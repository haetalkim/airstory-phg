# Air Sensor Backend

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   - `npm install`
3. **Production (`npm start` on Render, etc.):** each start runs `db:migrate` then `db:upsert-teacher` then the API — the Sikich teacher is created/updated automatically; no Shell step required.
4. **Local dev:** optional one-off:
   - `npm run db:migrate`
   - `npm run db:seed` — resets the PHG01 workspace (measurements + join codes for that workspace)
   - or `npm run db:upsert-teacher` — teacher only, no data wipe
5. Local server:
   - `npm run dev` (does **not** auto-migrate; run step 4 manually when schema changes)

## API Base

- `http://localhost:4000/api`

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/workspaces/:workspaceId/sessions`
- `POST /api/workspaces/:workspaceId/sessions`
- `GET /api/workspaces/:workspaceId/measurements`
- `POST /api/workspaces/:workspaceId/measurements`
- `PATCH /api/workspaces/:workspaceId/measurements/:measurementId`
- `GET /api/workspaces/:workspaceId/analytics/summary`
- `GET /api/workspaces/:workspaceId/heatmap`
- `GET /api/workspaces/:workspaceId/export/measurements.csv`
- `POST /api/workspaces/:workspaceId/sheets/export`

## Seeded class (PHG01 Philadelphia)

After `npm run db:seed`:

- **Teacher (workspace owner)**  
  - Email: `sikich@tamgu.com`  
  - Password: `sikich2026`  
  - School code on profile: **PHG01** (Philadelphia class; frontend defaults to PA)

- **Student signup**  
  - The teacher logs in and opens **Manage Classes**. There they **generate a random 5-character join code** (or enter one manually), create it, and share **that** code with students.  
  - **School code PHG01** is the class/school identifier on profiles—it is **not** the same thing as the join code unless the teacher chooses to reuse it (join codes must still be exactly 5 letters/numbers).

The seed creates:

- Workspace **PHG01 — Philadelphia** with **no sessions and no measurements** (ready to import CSV)
- Class grid: **1 period, 6 groups** (adjustable under Manage Classes)
- **No join code in the database** until the teacher creates one in the portal (so the flow matches production).

Teachers can use **Manage Classes** to create join codes, view the roster, change student **period/group**, reset passwords, or remove students from the class (see `PATCH .../users/:userId/placement` and related auth routes).

### “Invalid credentials” for `sikich@tamgu.com`

The hosted API (`air-sensor-api.onrender.com` by default) uses **whatever Postgres `DATABASE_URL` it was given**. That database must contain the teacher row with the hashed password.

1. On **Render** (or your host): open the **Web Service → Shell** (or run locally with the **production** `DATABASE_URL` copied from the dashboard).
2. From `backend`: run migrations if needed, then:
   - `npm run db:upsert-teacher` — recommended for production (does not delete students, sessions, or join codes).
   - or `npm run db:seed` — only on an **empty / dev** database (it clears PHG01 workspace measurements and join codes for that workspace).

After `db:upsert-teacher`, try logging in again with `sikich@tamgu.com` / `sikich2026`.
