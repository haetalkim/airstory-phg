# Mobile API Spec

This document is the integration contract for the external mobile app team.

## Base URL

- Local: `http://localhost:4000/api`
- Production (example): `https://api.yourdomain.com/api`

## Auth

- Header: `Authorization: Bearer <accessToken>`
- Access token: short-lived JWT
- Refresh token: long-lived token returned by auth endpoints

## Standard Error Shape

Most errors return:

```json
{
  "error": "Message"
}
```

## Health Check

- `GET /health`
- Auth: not required
- Response:

```json
{
  "ok": true,
  "environment": "development"
}
```

## Authentication Endpoints

### `POST /auth/register`

Register user and join/create workspace.

Request body:

```json
{
  "email": "student@tamgu.com",
  "password": "password",
  "fullName": "Student Name",
  "workspaceName": "Demo Sensor Platform Workspace",
  "role": "student",
  "schoolCode": "MTN12",
  "instructor": "Shim",
  "period": "P1",
  "groupCode": "G1",
  "studentCode": "STU999",
  "joinWorkspaceId": "optional-workspace-uuid"
}
```

Response `201`:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": "uuid",
    "email": "student@tamgu.com",
    "fullName": "Student Name",
    "workspaceId": "uuid"
  }
}
```

### `POST /auth/login`

Request:

```json
{
  "email": "shim@tamgu.com",
  "password": "password"
}
```

Response `200`:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": "uuid",
    "email": "shim@tamgu.com",
    "fullName": "Shim",
    "workspaceId": "uuid"
  }
}
```

### `POST /auth/refresh`

Request:

```json
{
  "refreshToken": "jwt"
}
```

Response `200`:

```json
{
  "accessToken": "jwt"
}
```

### `POST /auth/logout`

Request:

```json
{
  "refreshToken": "jwt"
}
```

Response: `204 No Content`

### `GET /auth/me`

Auth required.

Response `200`:

```json
{
  "user": {
    "id": "uuid",
    "email": "jiin@tamgu.com",
    "full_name": "Jiin"
  },
  "memberships": [
    {
      "workspace_id": "uuid",
      "role": "student"
    }
  ],
  "profile": {
    "workspace_id": "uuid",
    "school_code": "MTN12",
    "instructor": "Shim",
    "period": "P1",
    "group_code": "G1",
    "student_code": "STU003"
  }
}
```

### `GET /auth/workspaces/:workspaceId/roster`

Auth required (member of workspace).

Response `200`:

```json
{
  "members": [
    {
      "id": "uuid",
      "full_name": "Jiin",
      "email": "jiin@tamgu.com",
      "role": "student",
      "school_code": "MTN12",
      "instructor": "Shim",
      "period": "P1",
      "group_code": "G1",
      "student_code": "STU003"
    }
  ]
}
```

## Sensor / Session Endpoints

### `GET /workspaces/:workspaceId/sessions`

Roles: `owner`, `teacher`, `student`

Response:

```json
{
  "sessions": []
}
```

### `POST /workspaces/:workspaceId/sessions`

Roles: `owner`, `teacher`

Request:

```json
{
  "sessionCode": "DEMO-G1-002",
  "name": "Campus Walk Group 1",
  "notes": "Morning route",
  "locationName": "North Campus",
  "schoolCode": "MTN12",
  "instructor": "Shim",
  "period": "P1",
  "groupCode": "G1",
  "startedAt": "2026-03-23T08:00:00.000Z",
  "endedAt": "2026-03-23T09:00:00.000Z"
}
```

Response `201`:

```json
{
  "session": {}
}
```

### `GET /workspaces/:workspaceId/measurements`

Roles: `owner`, `teacher`, `student`

Query params:

- `from` (ISO date/time)
- `to` (ISO date/time)
- `sessionId`
- `schoolCode`
- `instructor`
- `groupCode`
- `limit` (default `200`)
- `offset` (default `0`)

Response:

```json
{
  "measurements": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "session_id": "uuid",
      "captured_at": "2026-03-23T08:00:00.000Z",
      "latitude": 40.744,
      "longitude": -73.991,
      "pm25": 12,
      "co": 0.45,
      "temp": 21,
      "humidity": 44,
      "session_code": "DEMO-G1-001",
      "session_name": "Campus Walk Group 1",
      "school_code": "MTN12",
      "instructor": "Shim",
      "period": "P1",
      "group_code": "G1",
      "edits": {
        "pm25": {
          "editedValue": 14,
          "originalValue": 12,
          "editedByUserId": "uuid",
          "editNote": "Adjusted after manual validation",
          "createdAt": "2026-03-23T09:10:00.000Z"
        }
      }
    }
  ]
}
```

### `POST /workspaces/:workspaceId/measurements`

Roles: `owner`, `teacher`

Request:

```json
{
  "sessionId": "uuid",
  "capturedAt": "2026-03-23T08:05:00.000Z",
  "latitude": 40.7445,
  "longitude": -73.9908,
  "indoorOutdoor": "OUTDOOR",
  "pm25": 11,
  "co": 0.4,
  "temp": 20,
  "humidity": 45
}
```

Response `201`:

```json
{
  "measurement": {}
}
```

### `PATCH /workspaces/:workspaceId/measurements/:measurementId`

Roles: `owner`, `teacher`

Request: partial fields, e.g.

```json
{
  "pm25": 15,
  "humidity": 50
}
```

Response:

```json
{
  "measurement": {}
}
```

### `POST /workspaces/:workspaceId/measurements/:measurementId/edits`

Roles: `owner`, `teacher`, `student`

Use this to annotate values without overwriting original measurement row.

Request:

```json
{
  "fieldName": "pm25",
  "editedValue": 14,
  "editNote": "Calibration correction"
}
```

Response `201`:

```json
{
  "edit": {}
}
```

## Analytics Endpoints

### `GET /workspaces/:workspaceId/analytics/summary?metric=pm25&from=...&to=...`

Roles: `owner`, `teacher`, `student`

`metric` supports: `pm25`, `co`, `temp`, `humidity`

Response:

```json
{
  "metric": "pm25",
  "summary": {
    "mean": "14.1200",
    "min": "8",
    "max": "30",
    "median": "13",
    "stddev": "4.2100",
    "sample_count": "120"
  }
}
```

### `GET /workspaces/:workspaceId/heatmap?metric=pm25`

Roles: `owner`, `teacher`, `student`

Response:

```json
{
  "metric": "pm25",
  "points": [
    {
      "latitude": "40.7440",
      "longitude": "-73.9910",
      "value": "12.33",
      "point_count": "40"
    }
  ]
}
```

### `GET /workspaces/:workspaceId/export/measurements.csv`

Roles: `owner`, `teacher`, `student`

Returns CSV attachment with measurement and session columns.

## Sheets Export Endpoint

### `POST /workspaces/:workspaceId/sheets/export`

Roles: `owner`, `teacher`

Writes session + measurement data to configured Google Sheet.

Response:

```json
{
  "ok": true,
  "exported": {
    "sessions": 2,
    "measurements": 120
  }
}
```
