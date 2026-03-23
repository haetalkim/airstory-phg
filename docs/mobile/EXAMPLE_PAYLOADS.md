# Example Payloads

Use these examples exactly as templates for mobile API calls.

## 1) Login

### Request

```json
{
  "email": "shim@tamgu.com",
  "password": "password"
}
```

### Response

```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "bff808d3-6f38-4650-b9d1-428530a08410",
    "email": "shim@tamgu.com",
    "fullName": "Shim",
    "workspaceId": "69747c82-be14-458a-9e79-37e922764e2b"
  }
}
```

## 2) Refresh Access Token

### Request

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### Response

```json
{
  "accessToken": "new_jwt_access_token"
}
```

## 3) Create Session (Teacher)

### Request

```json
{
  "sessionCode": "PHONE-G1-20260323",
  "name": "Morning Walk Group 1",
  "notes": "Mobile app capture",
  "locationName": "North Campus",
  "schoolCode": "MTN12",
  "instructor": "Shim",
  "period": "P1",
  "groupCode": "G1",
  "startedAt": "2026-03-23T08:00:00.000Z",
  "endedAt": "2026-03-23T08:45:00.000Z"
}
```

### Response

```json
{
  "session": {
    "id": "new-session-uuid",
    "workspace_id": "69747c82-be14-458a-9e79-37e922764e2b",
    "session_code": "PHONE-G1-20260323",
    "name": "Morning Walk Group 1"
  }
}
```

## 4) Upload Measurement (Teacher)

### Request

```json
{
  "sessionId": "new-session-uuid",
  "capturedAt": "2026-03-23T08:05:11.000Z",
  "latitude": 40.7446,
  "longitude": -73.9907,
  "indoorOutdoor": "OUTDOOR",
  "pm25": 12,
  "co": 0.42,
  "temp": 21,
  "humidity": 44
}
```

### Response

```json
{
  "measurement": {
    "id": "new-measurement-uuid",
    "session_id": "new-session-uuid",
    "pm25": 12,
    "co": 0.42,
    "temp": 21,
    "humidity": 44
  }
}
```

## 5) Add Annotation Edit (Student or Teacher)

### Request

```json
{
  "fieldName": "pm25",
  "editedValue": 14,
  "editNote": "Adjusted after calibration check"
}
```

### Response

```json
{
  "edit": {
    "id": "edit-uuid",
    "workspace_id": "69747c82-be14-458a-9e79-37e922764e2b",
    "measurement_id": "new-measurement-uuid",
    "field_name": "pm25",
    "original_value": 12,
    "edited_value": 14
  }
}
```

## 6) Read Measurements With Edits

### Request

`GET /workspaces/69747c82-be14-458a-9e79-37e922764e2b/measurements?limit=50&offset=0`

### Response (trimmed)

```json
{
  "measurements": [
    {
      "id": "new-measurement-uuid",
      "captured_at": "2026-03-23T08:05:11.000Z",
      "pm25": 12,
      "co": 0.42,
      "temp": 21,
      "humidity": 44,
      "school_code": "MTN12",
      "period": "P1",
      "group_code": "G1",
      "edits": {
        "pm25": {
          "editedValue": 14,
          "originalValue": 12,
          "editedByUserId": "student-uuid",
          "editNote": "Adjusted after calibration check",
          "createdAt": "2026-03-23T08:12:00.000Z"
        }
      }
    }
  ]
}
```

## 7) Summary Analytics

### Request

`GET /workspaces/69747c82-be14-458a-9e79-37e922764e2b/analytics/summary?metric=pm25`

### Response

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

## 8) Heatmap Points

### Request

`GET /workspaces/69747c82-be14-458a-9e79-37e922764e2b/heatmap?metric=pm25`

### Response

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
