# Malaeb — Product Requirements Document

## Original Problem Statement
Build a professional cross-platform mobile app called "Malaeb" for soccer field reservations and tournament management in Lebanon. Two roles: User (register, browse fields, reserve fields, join tournaments with a team, track approval status) and Admin (manage fields, approve/reject reservations, create tournaments, approve/reject team join requests). Modern sporty design with dark green + lime accents, Arabic/English with RTL, bottom tab navigation, polished login/signup, status badges, booking calendar, tournament cards, admin dashboard with stats, Lebanese phone validation (+961).

## User Choices
- Backend: FastAPI + MongoDB (platform-native)
- Auth: JWT email + password, role-based (User/Admin)
- Push: Emergent-managed push notifications (works only on native builds)
- Default language: English (Arabic + RTL toggle)
- Seed: none requested (a small demo field/tournament was added during testing to demonstrate the app; removable from Admin)

## Architecture
- Backend: `/app/backend/server.py` — FastAPI, motor (MongoDB), JWT (pyjwt), passlib bcrypt. UUID string ids, `_id` excluded from responses. httpx relay for Emergent push (`/api/register-push`, `send_push`).
- Frontend: Expo Router (file-based). Route groups: `(auth)`, `(user)/(tabs)`, `(admin)/(tabs)` + stack detail/modal screens. Data via @tanstack/react-query. Theme in `src/theme.ts` (dark-first, lime accents), Barlow Condensed + Manrope fonts, phosphor-react-native icons.
- Contexts: AuthContext (JWT via secure storage), LanguageContext (EN/AR), ToastContext (no Alerts).

## User Personas
- Player: books fields, joins tournaments, tracks approvals.
- Admin/Field owner: manages fields & tournaments, approves/rejects requests, monitors stats & revenue.

## Core Requirements (static)
- Role-based auth with +961 phone validation.
- Field browse + booking calendar (date + hourly slots, clash prevention).
- Tournament browse + team join requests.
- Approval workflow (pending/approved/rejected) with status badges + push on decision.
- Admin dashboard with live stats + revenue.
- Bilingual EN/AR, dark sporty theme.

## Implemented (2026-06)
- [x] JWT auth: register/login/me, admin gated by admin code (`malaeb-admin-2026`).
- [x] Lebanese phone validation (client + server).
- [x] Fields CRUD (admin) + list/detail (user); soft delete.
- [x] Booking calendar (14-day picker + hourly slots, booked-slot disabling, clash 409).
- [x] Reservations: create (pending), admin approve/reject, my reservations, status badges.
- [x] Tournaments CRUD (admin) + list/detail (user); team join requests, duplicate prevention.
- [x] Admin approve/reject team requests; push on decision (best-effort).
- [x] Admin dashboard: 8 stat cards, revenue, pending badges, Create Tournament FAB.
- [x] Bilingual EN/AR toggle, dark green + lime theme, bottom tabs (User + Admin).
- [x] Emergent push wiring (module-scope handlers, register on login) — needs native build + google-services.json to deliver.
- [x] 30/30 backend tests passing; frontend flows verified.

## Backlog / Remaining
- P1: Real Emergent push delivery (requires deploy + native build + google-services.json + APNs key).
- P1: Full RTL layout mirroring (native reload) — currently text alignment + directional rows.
- P2: Field images via Emergent Object Storage upload (currently image URL).
- P2: Reservation reschedule/cancel by user; admin reject reason input.
- P2: Tournament brackets/schedule, in-app payments (Stripe) for entry fees.

## Next Tasks
- Wire google-services.json + deploy to enable push.
- Object storage for field/tournament image uploads.
- Payments for entry fees / booking deposits.
