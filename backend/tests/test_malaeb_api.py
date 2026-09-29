"""Malaeb backend API pytest suite covering auth, RBAC, fields, reservations, tournaments, team requests, and admin stats."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://malaeb-sports.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@malaeb.com"
ADMIN_PASS = "admin123"
USER_EMAIL = "user@malaeb.com"
USER_PASS = "user123"
ADMIN_CODE = "malaeb-admin-2026"


# ---------- helpers ----------
def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)
    return r


@pytest.fixture(scope="session")
def admin_token():
    r = _login(ADMIN_EMAIL, ADMIN_PASS)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def user_token():
    r = _login(USER_EMAIL, USER_PASS)
    if r.status_code != 200:
        pytest.skip(f"User login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


def auth_h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Auth ----------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert "message" in r.json()

    def test_register_invalid_phone(self):
        payload = {
            "name": "Bad Phone",
            "email": f"TEST_bad_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "12345",
            "password": "pass123",
        }
        r = requests.post(f"{API}/auth/register", json=payload, timeout=10)
        assert r.status_code == 422, r.text

    def test_register_admin_invalid_code(self):
        payload = {
            "name": "Fake Admin",
            "email": f"TEST_fadm_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "+96170999888",
            "password": "pass123",
            "role": "admin",
            "admin_secret": "wrong-code",
        }
        r = requests.post(f"{API}/auth/register", json=payload, timeout=10)
        assert r.status_code == 403, r.text

    def test_register_success_and_duplicate(self):
        email = f"TEST_new_{uuid.uuid4().hex[:6]}@example.com"
        payload = {
            "name": "Test New",
            "email": email,
            "phone": "+96170111222",
            "password": "pass123",
        }
        r = requests.post(f"{API}/auth/register", json=payload, timeout=10)
        assert r.status_code == 201, r.text
        data = r.json()
        assert "access_token" in data and data["user"]["role"] == "user"

        # Duplicate email -> 409
        r2 = requests.post(f"{API}/auth/register", json=payload, timeout=10)
        assert r2.status_code == 409, r2.text

    def test_login_success(self, user_token):
        assert user_token

    def test_login_bad_password(self):
        r = _login(USER_EMAIL, "wrong")
        assert r.status_code == 401

    def test_me_returns_current_user(self, user_token):
        r = requests.get(f"{API}/auth/me", headers=auth_h(user_token), timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == USER_EMAIL
        assert data["role"] == "user"

    def test_me_admin_role(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=auth_h(admin_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# ---------- RBAC ----------
class TestRBAC:
    def test_user_cannot_create_field(self, user_token):
        r = requests.post(
            f"{API}/fields",
            headers=auth_h(user_token),
            json={"name": "X", "location": "Y", "price_per_hour": 10},
            timeout=10,
        )
        assert r.status_code == 403

    def test_user_cannot_get_admin_stats(self, user_token):
        r = requests.get(f"{API}/admin/stats", headers=auth_h(user_token), timeout=10)
        assert r.status_code == 403

    def test_admin_can_get_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=auth_h(admin_token), timeout=10)
        assert r.status_code == 200
        for k in ["total_fields", "total_reservations", "revenue", "total_users"]:
            assert k in r.json()

    def test_no_token_401(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401


# ---------- Fields + Reservations + Tournaments (single class for loadscope) ----------
class TestCoreFlow:
    created_id = None
    res_id = None
    t_id = None
    tr_id = None

    def test_admin_create_field(self, admin_token):
        payload = {
            "name": "TEST_Arena",
            "location": "Beirut",
            "description": "Test",
            "price_per_hour": 50,
            "image_url": "",
            "amenities": ["lights"],
            "size": "7v7",
        }
        r = requests.post(f"{API}/fields", headers=auth_h(admin_token), json=payload, timeout=10)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert "id" in data
        TestCoreFlow.created_id = data["id"]

        # Verify persistence via list
        rl = requests.get(f"{API}/fields", headers=auth_h(admin_token), timeout=10)
        assert rl.status_code == 200
        assert any(f["id"] == data["id"] for f in rl.json())

    def test_get_field_detail(self, user_token):
        assert TestCoreFlow.created_id
        r = requests.get(f"{API}/fields/{TestCoreFlow.created_id}", headers=auth_h(user_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["id"] == TestCoreFlow.created_id

    def test_update_field(self, admin_token):
        assert TestCoreFlow.created_id
        payload = {
            "name": "TEST_Arena_Updated",
            "location": "Beirut",
            "description": "Test",
            "price_per_hour": 60,
            "image_url": "",
            "amenities": ["lights", "parking"],
            "size": "7v7",
        }
        r = requests.put(
            f"{API}/fields/{TestCoreFlow.created_id}", headers=auth_h(admin_token), json=payload, timeout=10
        )
        assert r.status_code == 200
        assert r.json()["price_per_hour"] == 60

    def test_field_slots_empty(self, user_token):
        assert TestCoreFlow.created_id
        r = requests.get(
            f"{API}/fields/{TestCoreFlow.created_id}/slots?date=2030-01-01",
            headers=auth_h(user_token),
            timeout=10,
        )
        assert r.status_code == 200
        assert r.json() == {"booked": []}


# ---------- Reservations (part of TestCoreFlow for loadscope) ----------
class _ReservationsUnused:
    pass


# Attach reservation & tournament tests to TestCoreFlow so xdist loadscope keeps them on one worker
def _test_create_reservation(self, user_token):
    assert TestCoreFlow.created_id
    payload = {"field_id": TestCoreFlow.created_id, "date": "2030-06-15", "slot": "18:00-19:00"}
    r = requests.post(f"{API}/reservations", headers=auth_h(user_token), json=payload, timeout=10)
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["status"] == "pending"
    assert data["price"] == 60
    TestCoreFlow.res_id = data["id"]


def _test_slot_clash_409(self, user_token):
    payload = {"field_id": TestCoreFlow.created_id, "date": "2030-06-15", "slot": "18:00-19:00"}
    r = requests.post(f"{API}/reservations", headers=auth_h(user_token), json=payload, timeout=10)
    assert r.status_code == 409


def _test_my_reservations_includes(self, user_token):
    r = requests.get(f"{API}/reservations/my", headers=auth_h(user_token), timeout=10)
    assert r.status_code == 200
    assert any(x["id"] == TestCoreFlow.res_id for x in r.json())


def _test_admin_list_reservations(self, admin_token):
    r = requests.get(f"{API}/reservations", headers=auth_h(admin_token), timeout=10)
    assert r.status_code == 200
    assert any(x["id"] == TestCoreFlow.res_id for x in r.json())


def _test_admin_approve(self, admin_token):
    r = requests.put(
        f"{API}/reservations/{TestCoreFlow.res_id}/status",
        headers=auth_h(admin_token),
        json={"status": "approved", "note": "ok"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "approved"
    r2 = requests.get(f"{API}/reservations", headers=auth_h(admin_token), timeout=10)
    matched = [x for x in r2.json() if x["id"] == TestCoreFlow.res_id]
    assert matched and matched[0]["status"] == "approved"


def _test_slot_now_booked(self, user_token):
    r = requests.get(
        f"{API}/fields/{TestCoreFlow.created_id}/slots?date=2030-06-15",
        headers=auth_h(user_token),
        timeout=10,
    )
    assert r.status_code == 200
    assert "18:00-19:00" in r.json()["booked"]


def _test_admin_create_tournament(self, admin_token):
    payload = {
        "name": "TEST_Cup",
        "description": "d",
        "location": "Beirut",
        "start_date": "2030-07-01",
        "max_teams": 8,
        "entry_fee": 100,
        "prize": "Trophy",
    }
    r = requests.post(f"{API}/tournaments", headers=auth_h(admin_token), json=payload, timeout=10)
    assert r.status_code == 201, r.text
    TestCoreFlow.t_id = r.json()["id"]


def _test_user_list_and_get_tournament(self, user_token):
    r = requests.get(f"{API}/tournaments", headers=auth_h(user_token), timeout=10)
    assert r.status_code == 200
    assert any(t["id"] == TestCoreFlow.t_id for t in r.json())
    r2 = requests.get(f"{API}/tournaments/{TestCoreFlow.t_id}", headers=auth_h(user_token), timeout=10)
    assert r2.status_code == 200
    assert "teams_count" in r2.json()


def _test_user_join(self, user_token):
    payload = {"team_name": "TEST_TeamA", "players": 7, "captain_phone": "+96170555444"}
    r = requests.post(
        f"{API}/tournaments/{TestCoreFlow.t_id}/join",
        headers=auth_h(user_token),
        json=payload,
        timeout=10,
    )
    assert r.status_code == 201, r.text
    TestCoreFlow.tr_id = r.json()["id"]
    assert r.json()["status"] == "pending"


def _test_user_duplicate_join_409(self, user_token):
    payload = {"team_name": "TEST_TeamA2", "players": 7}
    r = requests.post(
        f"{API}/tournaments/{TestCoreFlow.t_id}/join",
        headers=auth_h(user_token),
        json=payload,
        timeout=10,
    )
    assert r.status_code == 409


def _test_admin_approve_team_request(self, admin_token):
    r = requests.put(
        f"{API}/team-requests/{TestCoreFlow.tr_id}/status",
        headers=auth_h(admin_token),
        json={"status": "approved", "note": "welcome"},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "approved"


def _test_user_cannot_update_team_request(self, user_token):
    r = requests.put(
        f"{API}/team-requests/{TestCoreFlow.tr_id}/status",
        headers=auth_h(user_token),
        json={"status": "rejected"},
        timeout=10,
    )
    assert r.status_code == 403


def _test_revenue_includes_approved(self, admin_token):
    r = requests.get(f"{API}/admin/stats", headers=auth_h(admin_token), timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["approved_reservations"] >= 1
    assert data["revenue"] >= 60


def _test_cleanup(self, admin_token):
    if TestCoreFlow.created_id:
        requests.delete(f"{API}/fields/{TestCoreFlow.created_id}", headers=auth_h(admin_token), timeout=10)
    if TestCoreFlow.t_id:
        requests.delete(f"{API}/tournaments/{TestCoreFlow.t_id}", headers=auth_h(admin_token), timeout=10)


# Attach as methods so they share TestCoreFlow scope for xdist loadscope
TestCoreFlow.test_a_create_reservation = _test_create_reservation
TestCoreFlow.test_b_slot_clash_409 = _test_slot_clash_409
TestCoreFlow.test_c_my_reservations_includes = _test_my_reservations_includes
TestCoreFlow.test_d_admin_list_reservations = _test_admin_list_reservations
TestCoreFlow.test_e_admin_approve = _test_admin_approve
TestCoreFlow.test_f_slot_now_booked = _test_slot_now_booked
TestCoreFlow.test_g_admin_create_tournament = _test_admin_create_tournament
TestCoreFlow.test_h_user_list_and_get_tournament = _test_user_list_and_get_tournament
TestCoreFlow.test_i_user_join = _test_user_join
TestCoreFlow.test_j_user_duplicate_join_409 = _test_user_duplicate_join_409
TestCoreFlow.test_k_admin_approve_team_request = _test_admin_approve_team_request
TestCoreFlow.test_l_user_cannot_update_team_request = _test_user_cannot_update_team_request
TestCoreFlow.test_m_revenue_includes_approved = _test_revenue_includes_approved
TestCoreFlow.test_z_cleanup = _test_cleanup


# ---------- Reservations (deprecated, kept empty for reference) ----------
class _OldReservations:
    def test_create_reservation(self, user_token):
        assert TestCoreFlow.created_id
        payload = {"field_id": TestCoreFlow.created_id, "date": "2030-06-15", "slot": "18:00-19:00"}
        r = requests.post(f"{API}/reservations", headers=auth_h(user_token), json=payload, timeout=10)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert data["price"] == 60
        TestCoreFlow.res_id = data["id"]

    def test_slot_clash_409(self, user_token):
        payload = {"field_id": TestCoreFlow.created_id, "date": "2030-06-15", "slot": "18:00-19:00"}
        r = requests.post(f"{API}/reservations", headers=auth_h(user_token), json=payload, timeout=10)
        assert r.status_code == 409

    def test_my_reservations_includes(self, user_token):
        r = requests.get(f"{API}/reservations/my", headers=auth_h(user_token), timeout=10)
        assert r.status_code == 200
        assert any(x["id"] == TestCoreFlow.res_id for x in r.json())

    def test_admin_list_reservations(self, admin_token):
        r = requests.get(f"{API}/reservations", headers=auth_h(admin_token), timeout=10)
        assert r.status_code == 200
        assert any(x["id"] == TestCoreFlow.res_id for x in r.json())

    def test_admin_approve(self, admin_token):
        r = requests.put(
            f"{API}/reservations/{TestCoreFlow.res_id}/status",
            headers=auth_h(admin_token),
            json={"status": "approved", "note": "ok"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "approved"

        # Verify persistence via my reservations
        r2 = requests.get(f"{API}/reservations", headers=auth_h(admin_token), timeout=10)
        matched = [x for x in r2.json() if x["id"] == TestCoreFlow.res_id]
        assert matched and matched[0]["status"] == "approved"

    def test_slot_now_booked(self, user_token):
        r = requests.get(
            f"{API}/fields/{TestCoreFlow.created_id}/slots?date=2030-06-15",
            headers=auth_h(user_token),
            timeout=10,
        )
        assert r.status_code == 200
        assert "18:00-19:00" in r.json()["booked"]


# ---------- (Old classes removed — logic merged into TestCoreFlow above) ----------
