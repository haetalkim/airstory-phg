# tamguingAIR

Air quality classroom platform: React dashboard + Express/Postgres API.

| Folder | Purpose |
|--------|---------|
| `src/` | **Main app** — student/teacher login, heat map, raw data, analysis, My Page |
| `backend/` | Node API (auth, sessions, measurements, analytics) |
| `docs/` | Deploy guides (`DEPLOY_RENDER.md`, `VERCEL.md`), mobile API docs, user guides |
| `keepsake/integrated-frontend-snapshot/` | Frozen copy of `src/` + configs (restore / diff reference) |
| `keepsake-pre-backend/` | Older UI snapshot before backend work |

**GitHub Pages (static frontend):** from this folder, run `npm run deploy` (builds then pushes `build/` to branch `gh-pages`). In the repo on GitHub: **Settings → Pages → Build and deployment → Branch** → select **`gh-pages`** and **`/ (root)`**, Save. Site: `https://haetalkim.github.io/tamguingAIR/` (use your username/repo if different). Set `REACT_APP_API_BASE_URL` in `.env` before deploy so the production build talks to your API.

**Vercel:** optional; build this repo root (CRA). See `docs/VERCEL.md`.

**Render:** `render.yaml` Blueprint — API + Postgres. See `docs/DEPLOY_RENDER.md`.
