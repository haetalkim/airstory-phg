# Air Story — PHG (test variant)

Sibling fork of the main `src/` frontend, scoped to **Philadelphia High School for Girls (PHG)**.

This folder is built and deployed independently from the original `airstory/` site.
The original site under the repo-root `src/` and `public/` directories is **left untouched**.

## What's different vs. the original

- Students never see a login form. The landing page exposes four group buttons
  (Group 1–4); clicking a button stamps a `phg.studentContext` value into
  `localStorage` and silently logs the browser into the shared `phg-students`
  backend account so CSV uploads / measurement reads keep working.
- No logout button on the student portal; a `G1 G2 G3 G4` switcher takes its place.
- "My Page" is rendered as a blurred / disabled card with a "Not needed for group
  sessions" notice.
- All analytical tabs auto-apply the current group as a filter on entry, so the
  student lands on their own group's data without clicking "Clear filters".
- Heat Map: `Best Area` / `Needs Attention` are suppressed for `temp` / `humidity`,
  the city aggregate is forced to "Philadelphia, PA", and `(0,0)` /
  `NaN` coordinates default to **Philadelphia High School for Girls**.
- Raw Data: each CSV import collapses into one chevron-expandable summary row;
  the photos sub-section + modal are removed from the help block.
- Manage Classes: blurred Student Profiles, no `Unknowns` bucket, and per-group
  `<N> sessions` count next to "Open lab data".

## Local dev

```bash
cd phg
npm ci
REACT_APP_API_BASE_URL=https://air-sensor-api.onrender.com/api \
REACT_APP_GOOGLE_MAPS_API_KEY=... \
npm start
```

## Deploy

GitHub Actions workflow at `.github/workflows/deploy-gh-pages-phg.yml`. Runs on
push to `phg/**` and uploads the build as a Pages artifact under the
`github-pages-phg` environment. See that file for the path / domain caveats.
