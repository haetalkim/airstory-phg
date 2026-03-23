# Instructor Guide

## Account and Access

- Sign in with your instructor account (`shim@tamgu.com` for demo).
- Confirm you are in the correct workspace after login.
- Instructor role can create sessions, review edits, and export data.

## Core Workflow

1. Log in and open the dashboard.
2. Review the latest sessions and measurements.
3. Switch metrics (`PM2.5`, `CO`, `Temperature`, `Humidity`) to compare trends.
4. Check summary cards (mean, median, min, max, samples).
5. Review heatmap aggregates to identify hotspots.

## Session and Measurement Management

- Create or review session metadata (group, school, instructor, period, notes).
- Validate measurement quality across groups.
- Keep canonical sensor values intact.
- Review student edit annotations (`*`) before reporting.

## Student Edit Annotations

- Students can submit correction annotations for fields (`pm25`, `co`, `temp`, `humidity`).
- Edited values appear with `*` in the dashboard.
- Hovering/edit context should reference original value and notes.
- Treat edits as reviewable annotations, not source overwrite.

## Reporting and Export

- Use CSV export for reporting: `/export/measurements.csv`.
- Optionally sync to Google Sheets for sharing with stakeholders.
- Include both original and annotated context during presentations.
