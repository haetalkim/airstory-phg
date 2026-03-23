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

## Demo Personas (seeded)

After `npm run db:seed`, these demo accounts exist:

- Instructor (teacher role)
  - Email: `shim@tamgu.com`
  - Password: `password`
- Student Group 1
  - Email: `jiin@tamgu.com`
  - Password: `password`
- Student Group 4
  - Email: `julia@tamgu.com`
  - Password: `password`

The seed also creates:
- One demo workspace
- Two sessions (G1 and G4)
- Prefilled measurements for both groups
- One sample measurement edit annotation (`*` behavior)
