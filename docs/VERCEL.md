# Vercel (frontend)

## Root directory

If this GitHub repo **is** the CRA app (root has `package.json` + `src/`), leave **Root Directory** empty or `.`.

If your Vercel project points at a **parent monorepo** folder instead, set root to the subfolder that contains `package.json` (e.g. `air-quality-tracker`).

## Environment variable

`REACT_APP_API_BASE_URL` = your API base, e.g.

`https://your-service.onrender.com/api`

Redeploy after changing env vars.

## Keepsake copy of this UI

A frozen copy of this app’s source lives at:

`keepsake/integrated-frontend-snapshot/`

See `keepsake/README.md`.
