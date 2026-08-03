# UbuntuConnect — Frontend ↔ Backend Connection Summary

## How to run

**Backend** (from `UbuntuConnect-Backend-Connected.zip`):
```
cd UbuntuConnect-Fixed/UbuntuConnect-master/backend/UbuntuConnectAPI
dotnet run
```
Runs on `http://localhost:5275` by default (see `Properties/launchSettings.json`).

**Frontend** (from `UbuntuConnect-Frontend-Connected.zip`):
```
npm install
npm run dev
```
Runs on `http://localhost:5173` and talks to the backend via `VITE_API_URL`
in `.env` (already set to `http://localhost:5275/api`).

Run the backend first, then the frontend. Register a new account through
the UI (Individual/NPO/Business/Admin) — there's no seed data.

## What changed

**Backend — one change only:** added a CORS policy in `Program.cs` allowing
`http://localhost:5173` to call the API. Without this, literally no request
from the frontend could reach the backend, regardless of how the frontend
code was written. No other backend files were touched.

**Frontend — every screen wired to real endpoints:**
- `src/lib/api.ts` — typed client covering all 13 backend controllers
- `src/lib/AuthContext.tsx` — JWT/session handling
- `src/app/components/ProtectedRoute.tsx` — role-gated dashboard routes
- Login/Register — real `/api/Auth/login` + `/api/Auth/register`
- IndividualDashboard, NPODashboard, BusinessDashboard, AdminDashboard —
  data fetched on load, and buttons/forms call real endpoints (follow,
  donate, apply, create/edit/delete posts & opportunities & campaigns,
  approve/reject applications & verifications, wallet & withdrawals, etc.)

## Known gaps (frontend UI with no backend to hit)

These were left as local-only/decorative and marked with `NOTE:` comments
in the code, per your instruction not to add backend features:

1. **NPO fundraising campaigns** (goal/raised/deadline progress bars) —
   there's no backend model for this. The only "campaign" in the API is a
   *Business-initiated partnership campaign* that NPOs apply to
   (`CampaignController`), a different feature. That one IS fully wired
   (Business dashboard's "My Campaigns" tab).
2. **NPO/Business change-password and delete/deactivate-account** — only
   `IndividualController` has these; `NPOController`/`BusinessController`
   explicitly don't (there's a comment in the backend code explaining why:
   cascading deletes).
3. **Admin registration key** — no backend concept of one; anyone can
   currently register as Admin.
4. Several profile fields in the original mock UI (NPO email/phone/address/
   website/logo, Business company name/phone/address/CSR budget) have no
   backing database columns — removed from the forms rather than left as
   fake inputs.
5. Saved bank accounts for withdrawals, donation "messages," and payment
   method selection aren't backend fields — inputs are still shown but
   noted as not being sent.
6. Several list views show `User #123` / IDs instead of names, or omit
   "joined date," because the relevant GET endpoints (e.g.
   `admin/transactions`, `admin/users`) don't join across to the profile
   tables that hold display names.

None of these block the app from running — they're just places where the
UI shows slightly less than the original mockup because the data doesn't
exist on the backend yet.
