# Air Sensor Backend

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   - `npm install`
3. Run migrations:
   - `npm run db:migrate`
4. Seed a starter account:
   - `npm run db:seed`
5. Start server:
   - `npm run dev`

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
