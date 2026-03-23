# tamguingAIR

Air quality classroom platform: React dashboard + Express/Postgres API.

| Folder | Purpose |
|--------|---------|
| `src/` | **Main app** — student/teacher login, heat map, raw data, analysis, My Page |
| `backend/` | Node API (auth, sessions, measurements, analytics) |
| `docs/` | Deploy guides (`DEPLOY_RENDER.md`, `VERCEL.md`), mobile API docs, user guides |
| `keepsake/integrated-frontend-snapshot/` | Frozen copy of `src/` + configs (restore / diff reference) |
| `keepsake-pre-backend/` | Older UI snapshot before backend work |

**GitHub Pages (static frontend):** from this folder, run `npm run deploy` (builds, then pushes `build/` to branch `gh-pages`). Deploy uses `scripts/deploy-github-pages.sh` and sets **`CACHE_DIR`** outside the repo so Git doesn’t confuse the `gh-pages` clone with ignored `node_modules`. On GitHub: **Settings → Pages → Branch** → **`gh-pages`** / **`/ (root)`** → Save. Site: `https://haetalkim.github.io/tamguingAIR/` (adjust if your username/repo differ). Set `REACT_APP_API_BASE_URL` in `.env` before deploy.

**Vercel:** optional; build this repo root (CRA). See `docs/VERCEL.md`.

**Render:** `render.yaml` Blueprint — API + Postgres. See `docs/DEPLOY_RENDER.md`.
