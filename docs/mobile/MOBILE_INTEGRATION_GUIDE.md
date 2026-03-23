# Mobile Integration Guide

This guide is for external mobile app developers integrating with the Air Sensor backend.

## 1) Integration Goal

The mobile app should:

- authenticate users
- submit sensor sessions and measurements
- allow annotation edits (without overwriting raw values)
- fetch analytics/heatmap data for display

## 2) Environment Setup

- Base URL from backend owner:
  - Dev: `http://localhost:4000/api`
  - Prod: `https://api.yourdomain.com/api`
- All protected endpoints require:
  - `Authorization: Bearer <accessToken>`
- Use `Content-Type: application/json` for JSON requests.

## 3) Auth Flow (Required)

1. Call `POST /auth/login` with email/password.
2. Store `accessToken`, `refreshToken`, `workspaceId` securely.
3. Send `accessToken` in `Authorization` header.
4. On `401`, call `POST /auth/refresh` to get a new access token.
5. If refresh fails, force re-login.

## 4) Core Data Flow

### A. App startup

1. Login.
2. Call `GET /auth/me`.
3. Read user role and profile (`school_code`, `period`, `group_code`).

### B. Session lifecycle

Teacher creates session:

- `POST /workspaces/:workspaceId/sessions`

Students and teacher list sessions:

- `GET /workspaces/:workspaceId/sessions`

### C. Measurement upload

Teacher role can upload measurements:

- `POST /workspaces/:workspaceId/measurements`

Important: each measurement should include accurate `capturedAt` timestamp from phone sensor event.

### D. Annotation flow (students + teachers)

For corrections/notes, do not overwrite source value:

- `POST /workspaces/:workspaceId/measurements/:measurementId/edits`

UI should show edited value with an indicator (`*`) and keep original accessible.

## 5) Role Rules (Current Backend Behavior)

- `owner` / `teacher`:
  - create sessions
  - upload measurements
  - patch measurements
  - export sheets
- `student`:
  - read sessions/measurements/analytics
  - create measurement edits
  - cannot create raw measurements directly (current policy)

## 6) Offline + Retry Recommendations (Mobile)

- Queue unsent measurements locally (SQLite or secure local DB).
- Retry in background with exponential backoff.
- Mark each local item as:
  - `pending`
  - `sent`
  - `failed`
- Include a client-side UUID per measurement event to avoid accidental duplicate sends later (future backend dedupe endpoint recommended).

## 7) Error Handling Guidelines

- `400`: validation issue, fix payload.
- `401`: token expired/invalid, refresh then retry once.
- `403`: role not allowed for endpoint.
- `404`: resource not found (stale session/measurement ID).
- `409`: conflict (e.g. duplicate email on register).
- `500`: backend/server issue; retry with backoff for non-auth endpoints.

## 8) Performance Notes

- Use paging on `GET /measurements` with `limit` and `offset`.
- Apply filters (`from`, `to`, `groupCode`, etc.) to reduce payload size.
- Cache static profile/session metadata in app memory during active session.

## 9) QA Checklist For Mobile Team

- Login/refresh/logout works.
- Role restrictions enforced in UI.
- Measurement upload persists and appears in web dashboard.
- Student edits appear in measurement `edits` object.
- Analytics summary and heatmap render with live backend data.
- Offline capture syncs when network returns.

## 10) Demo Accounts

- Teacher: `shim@tamgu.com` / `password`
- Student G1: `jiin@tamgu.com` / `password`
- Student G4: `julia@tamgu.com` / `password`

Additional seeded student accounts also exist for roster realism.
