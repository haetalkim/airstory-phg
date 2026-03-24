# tamguingAIR

Air quality classroom platform: React dashboard + Express/Postgres API.

| Folder | Purpose |
|--------|---------|
| `src/` | **Main app** — student/teacher login, heat map, raw data, analysis, My Page |
| `backend/` | Node API (auth, sessions, measurements, analytics) |
| `docs/` | Deploy guides (`DEPLOY_RENDER.md`, `VERCEL.md`), mobile API docs, user guides |
| `keepsake/integrated-frontend-snapshot/` | Frozen copy of `src/` + configs (restore / diff reference) |
| `keepsake-pre-backend/` | Older UI snapshot before backend work |

**Frontend (canonical): GitHub Pages** — from this folder, run `npm run deploy` (builds, then pushes `build/` to branch `gh-pages`). Uses `scripts/deploy-github-pages.sh` and **`CACHE_DIR`** outside the repo. GitHub: **Settings → Pages → Branch** → **`gh-pages`** / **`/ (root)`**. Set `REACT_APP_API_BASE_URL` in `.env` before deploy (baked into the static build).

**Vercel:** not required if you only use Pages. If `git push` still triggers Vercel builds, disconnect the project in Vercel (see **`docs/VERCEL.md` → “GitHub Pages만 쓸 때”**).

**Render:** `render.yaml` Blueprint — API + Postgres. See `docs/DEPLOY_RENDER.md`.
