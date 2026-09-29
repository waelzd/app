import os
import re
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import jwt
import httpx
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------------------------------------------------------------------
# Config & DB
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_DAYS = int(os.environ.get("ACCESS_TOKEN_DAYS", "30"))
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "malaeb-admin-2026")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("malaeb")

# ---------------------------------------------------------------------------
# Emergent Push relay
# ---------------------------------------------------------------------------
PUSH_BASE_URL = "https://integrations.emergentagent.com"
PUSH_KEY = os.environ.get("EMERGENT_PUSH_KEY", "placeholder")
_push_client = httpx.AsyncClient(
    base_url=PUSH_BASE_URL, headers={"X-Push-Key": PUSH_KEY}, timeout=10.0
)


async def send_push(recipients: List[str], data: dict, idempotency_key: Optional[str] = None) -> None:
    if not recipients:
        return
    if "title" not in data or "message" not in data:
        return
    payload: dict = {"recipients": recipients[:100], "data": data}
    if idempotency_key:
        payload["$idempotency_key"] = idempotency_key
    resp = await _push_client.post("/api/v1/push/trigger", json=payload)
    resp.raise_for_status()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return uuid.uuid4().hex


LEB_PHONE = re.compile(r"^\+961\d{7,8}$")


def normalize_phone(phone: str) -> str:
    p = re.sub(r"[\s\-()]", "", phone or "")
    if p.startswith("00961"):
        p = "+" + p[2:]
    if p.startswith("961"):
        p = "+" + p
    if not p.startswith("+") and p.startswith("0"):
        p = "+961" + p[1:]
    return p


def valid_phone(phone: str) -> bool:
    return bool(LEB_PHONE.match(phone or ""))


def make_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": user_id, "iat": now, "exp": now + timedelta(days=ACCESS_TOKEN_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    phone: str
    password: str = Field(min_length=6, max_length=128)
    role: Literal["user", "admin"] = "user"
    admin_secret: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: str
    role: Literal["user", "admin"]


class FieldIn(BaseModel):
    name: str
    location: str
    description: str = ""
    price_per_hour: float
    image_url: str = ""
    amenities: List[str] = []
    size: str = ""


class ReservationIn(BaseModel):
    field_id: str
    date: str
    slot: str


class TournamentIn(BaseModel):
    name: str
    description: str = ""
    location: str
    image_url: str = ""
    start_date: str
    max_teams: int = 16
    entry_fee: float = 0
    prize: str = ""


class JoinIn(BaseModel):
    team_name: str = Field(min_length=2, max_length=60)
    players: int = Field(ge=1, le=30, default=7)
    captain_phone: str = ""


class StatusUpdate(BaseModel):
    status: Literal["approved", "rejected"]
    note: str = ""


class RegisterPushBody(BaseModel):
    user_id: str
    platform: str
    device_token: str


# ---------------------------------------------------------------------------
# Auth dependencies
# ---------------------------------------------------------------------------
def unauthorized():
    return HTTPException(status_code=401, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})


async def current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    if not credentials or credentials.scheme.lower() != "bearer":
        raise unauthorized()
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        uid = payload.get("sub")
    except Exception:
        raise unauthorized()
    if not uid:
        raise unauthorized()
    user = await db.users.find_one({"id": uid}, {"_id": 0})
    if not user or user.get("disabled"):
        raise unauthorized()
    return user


def require_admin(user=Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def to_user_out(u: dict) -> dict:
    return {"id": u["id"], "name": u["name"], "email": u["email"], "phone": u["phone"], "role": u["role"]}


# ---------------------------------------------------------------------------
# App & router
# ---------------------------------------------------------------------------
app = FastAPI(title="Malaeb API")
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"message": "Malaeb API running"}


# ---- Auth ----
@api.post("/auth/register", status_code=201)
async def register(body: RegisterIn):
    email = str(body.email).lower().strip()
    phone = normalize_phone(body.phone)
    if not valid_phone(phone):
        raise HTTPException(status_code=422, detail="Please enter a valid Lebanese phone number (+961)")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    role = "user"
    if body.role == "admin":
        if body.admin_secret != ADMIN_SECRET:
            raise HTTPException(status_code=403, detail="Invalid admin code")
        role = "admin"

    doc = {
        "id": new_id(),
        "name": body.name.strip(),
        "email": email,
        "phone": phone,
        "password_hash": pwd_context.hash(body.password),
        "role": role,
        "disabled": False,
        "created_at": now_utc(),
    }
    await db.users.insert_one(doc)
    return {"access_token": make_token(doc["id"]), "token_type": "bearer", "user": to_user_out(doc)}


@api.post("/auth/login")
async def login(body: LoginIn):
    email = str(body.email).lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not pwd_context.verify(body.password, user["password_hash"]) or user.get("disabled"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": make_token(user["id"]), "token_type": "bearer", "user": to_user_out(user)}


@api.get("/auth/me", response_model=UserOut)
async def me(user=Depends(current_user)):
    return to_user_out(user)


# ---- Fields ----
@api.get("/fields")
async def list_fields(user=Depends(current_user)):
    return await db.fields.find({"active": True}, {"_id": 0}).to_list(500)


@api.get("/fields/{field_id}")
async def get_field(field_id: str, user=Depends(current_user)):
    doc = await db.fields.find_one({"id": field_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Field not found")
    return doc


@api.post("/fields", status_code=201)
async def create_field(body: FieldIn, admin=Depends(require_admin)):
    doc = body.model_dump()
    doc.update({"id": new_id(), "active": True, "created_at": now_utc()})
    await db.fields.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/fields/{field_id}")
async def update_field(field_id: str, body: FieldIn, admin=Depends(require_admin)):
    res = await db.fields.update_one({"id": field_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Field not found")
    return await db.fields.find_one({"id": field_id}, {"_id": 0})


@api.delete("/fields/{field_id}")
async def delete_field(field_id: str, admin=Depends(require_admin)):
    await db.fields.update_one({"id": field_id}, {"$set": {"active": False}})
    return {"status": "deleted"}


@api.get("/fields/{field_id}/slots")
async def field_slots(field_id: str, date: str, user=Depends(current_user)):
    booked = await db.reservations.find(
        {"field_id": field_id, "date": date, "status": {"$in": ["pending", "approved"]}},
        {"_id": 0, "slot": 1},
    ).to_list(200)
    return {"booked": [b["slot"] for b in booked]}


# ---- Reservations ----
async def enrich_reservation(r: dict) -> dict:
    field = await db.fields.find_one({"id": r["field_id"]}, {"_id": 0, "name": 1, "location": 1, "image_url": 1})
    r["field"] = field or {}
    if "user_id" in r:
        u = await db.users.find_one({"id": r["user_id"]}, {"_id": 0, "name": 1, "phone": 1})
        r["user"] = u or {}
    return r


@api.post("/reservations", status_code=201)
async def create_reservation(body: ReservationIn, user=Depends(current_user)):
    field = await db.fields.find_one({"id": body.field_id}, {"_id": 0})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    clash = await db.reservations.find_one(
        {"field_id": body.field_id, "date": body.date, "slot": body.slot, "status": {"$in": ["pending", "approved"]}}
    )
    if clash:
        raise HTTPException(status_code=409, detail="This time slot is already taken")
    doc = {
        "id": new_id(),
        "user_id": user["id"],
        "field_id": body.field_id,
        "date": body.date,
        "slot": body.slot,
        "price": field.get("price_per_hour", 0),
        "status": "pending",
        "note": "",
        "created_at": now_utc(),
    }
    await db.reservations.insert_one(doc)
    doc.pop("_id", None)
    return await enrich_reservation(doc)


@api.get("/reservations/my")
async def my_reservations(user=Depends(current_user)):
    docs = await db.reservations.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [await enrich_reservation(d) for d in docs]


@api.get("/reservations")
async def all_reservations(status_filter: Optional[str] = None, admin=Depends(require_admin)):
    q = {}
    if status_filter:
        q["status"] = status_filter
    docs = await db.reservations.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [await enrich_reservation(d) for d in docs]


@api.put("/reservations/{res_id}/status")
async def update_reservation_status(res_id: str, body: StatusUpdate, admin=Depends(require_admin)):
    r = await db.reservations.find_one({"id": res_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Reservation not found")
    await db.reservations.update_one({"id": res_id}, {"$set": {"status": body.status, "note": body.note}})
    field = await db.fields.find_one({"id": r["field_id"]}, {"_id": 0, "name": 1})
    fname = field.get("name", "the field") if field else "the field"
    try:
        verb = "approved" if body.status == "approved" else "rejected"
        await send_push(
            recipients=[r["user_id"]],
            data={
                "title": f"Reservation {verb}",
                "message": f"Your booking at {fname} on {r['date']} at {r['slot']} was {verb}.",
                "action_url": "/(user)/(tabs)/bookings",
            },
        )
    except Exception as e:
        logger.warning(f"Push failed (non-blocking): {e}")
    return {"status": body.status}


# ---- Tournaments ----
@api.get("/tournaments")
async def list_tournaments(user=Depends(current_user)):
    docs = await db.tournaments.find({"active": {"$ne": False}}, {"_id": 0}).sort("start_date", 1).to_list(500)
    for d in docs:
        d["teams_count"] = await db.team_requests.count_documents(
            {"tournament_id": d["id"], "status": {"$in": ["pending", "approved"]}}
        )
    return docs


@api.get("/tournaments/{t_id}")
async def get_tournament(t_id: str, user=Depends(current_user)):
    doc = await db.tournaments.find_one({"id": t_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tournament not found")
    doc["teams_count"] = await db.team_requests.count_documents(
        {"tournament_id": t_id, "status": {"$in": ["pending", "approved"]}}
    )
    doc["my_request"] = await db.team_requests.find_one({"tournament_id": t_id, "user_id": user["id"]}, {"_id": 0})
    return doc


@api.post("/tournaments", status_code=201)
async def create_tournament(body: TournamentIn, admin=Depends(require_admin)):
    doc = body.model_dump()
    doc.update({"id": new_id(), "active": True, "created_at": now_utc()})
    await db.tournaments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/tournaments/{t_id}")
async def update_tournament(t_id: str, body: TournamentIn, admin=Depends(require_admin)):
    res = await db.tournaments.update_one({"id": t_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return await db.tournaments.find_one({"id": t_id}, {"_id": 0})


@api.delete("/tournaments/{t_id}")
async def delete_tournament(t_id: str, admin=Depends(require_admin)):
    await db.tournaments.update_one({"id": t_id}, {"$set": {"active": False}})
    return {"status": "deleted"}


# ---- Team join requests ----
async def enrich_team_request(r: dict) -> dict:
    t = await db.tournaments.find_one({"id": r["tournament_id"]}, {"_id": 0, "name": 1, "start_date": 1, "location": 1})
    r["tournament"] = t or {}
    u = await db.users.find_one({"id": r["user_id"]}, {"_id": 0, "name": 1, "phone": 1})
    r["user"] = u or {}
    return r


@api.post("/tournaments/{t_id}/join", status_code=201)
async def join_tournament(t_id: str, body: JoinIn, user=Depends(current_user)):
    t = await db.tournaments.find_one({"id": t_id}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    existing = await db.team_requests.find_one({"tournament_id": t_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=409, detail="You already requested to join this tournament")
    doc = {
        "id": new_id(),
        "tournament_id": t_id,
        "user_id": user["id"],
        "team_name": body.team_name.strip(),
        "players": body.players,
        "captain_phone": normalize_phone(body.captain_phone) or user.get("phone", ""),
        "status": "pending",
        "note": "",
        "created_at": now_utc(),
    }
    await db.team_requests.insert_one(doc)
    doc.pop("_id", None)
    return await enrich_team_request(doc)


@api.get("/team-requests/my")
async def my_team_requests(user=Depends(current_user)):
    docs = await db.team_requests.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [await enrich_team_request(d) for d in docs]


@api.get("/team-requests")
async def all_team_requests(status_filter: Optional[str] = None, admin=Depends(require_admin)):
    q = {}
    if status_filter:
        q["status"] = status_filter
    docs = await db.team_requests.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [await enrich_team_request(d) for d in docs]


@api.put("/team-requests/{req_id}/status")
async def update_team_request_status(req_id: str, body: StatusUpdate, admin=Depends(require_admin)):
    r = await db.team_requests.find_one({"id": req_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Request not found")
    await db.team_requests.update_one({"id": req_id}, {"$set": {"status": body.status, "note": body.note}})
    t = await db.tournaments.find_one({"id": r["tournament_id"]}, {"_id": 0, "name": 1})
    tname = t.get("name", "the tournament") if t else "the tournament"
    try:
        verb = "approved" if body.status == "approved" else "rejected"
        await send_push(
            recipients=[r["user_id"]],
            data={
                "title": f"Team request {verb}",
                "message": f"Team '{r['team_name']}' for {tname} was {verb}.",
                "action_url": "/(user)/(tabs)/bookings",
            },
        )
    except Exception as e:
        logger.warning(f"Push failed (non-blocking): {e}")
    return {"status": body.status}


# ---- Admin stats ----
@api.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    revenue_docs = await db.reservations.find({"status": "approved"}, {"_id": 0, "price": 1}).to_list(5000)
    return {
        "total_fields": await db.fields.count_documents({"active": True}),
        "total_reservations": await db.reservations.count_documents({}),
        "pending_reservations": await db.reservations.count_documents({"status": "pending"}),
        "approved_reservations": await db.reservations.count_documents({"status": "approved"}),
        "total_tournaments": await db.tournaments.count_documents({"active": {"$ne": False}}),
        "pending_teams": await db.team_requests.count_documents({"status": "pending"}),
        "total_users": await db.users.count_documents({"role": "user"}),
        "revenue": sum(d.get("price", 0) for d in revenue_docs),
    }


# ---- Push registration ----
@api.post("/register-push", status_code=201)
async def register_push(body: RegisterPushBody):
    try:
        resp = await _push_client.post("/api/v1/push/users/register", json=body.model_dump())
        resp.raise_for_status()
    except Exception as e:
        logger.warning(f"register-push failed (non-blocking): {e}")
        return {"status": "skipped"}
    return {"status": "registered"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    await _push_client.aclose()
