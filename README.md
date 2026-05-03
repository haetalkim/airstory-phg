# tamguingAIR

Air quality classroom platform: React dashboard + Express/Postgres API.

| Folder | Purpose |
|--------|---------|
| `src/` | **Main app** — student/teacher login, heat map, raw data, analysis, My Page |
| `backend/` | Node API (auth, sessions, measurements, analytics) |
| `docs/` | Deploy guides (`DEPLOY_RENDER.md`, `VERCEL.md`, **`GITHUB_PAGES.md`**), mobile API docs |
| `air-quality-tracker/` | **Legacy** smaller CRA app — **do not use** for production builds; CI builds from **repo root** only |
| `keepsake/integrated-frontend-snapshot/` | Frozen copy of `src/` + configs (restore / diff reference) |
| `keepsake-pre-backend/` | Older UI snapshot before backend work |

**Frontend (canonical): GitHub Pages** — the live site must be built from **this repo root** (`npm run build`), not from `air-quality-tracker/`.

- **CI:** push to `main` runs [.github/workflows/deploy-gh-pages.yml](.github/workflows/deploy-gh-pages.yml) (see **[docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md)** for secrets + troubleshooting).
- **Manual:** `npm run deploy` uses `scripts/deploy-github-pages.sh` and **`CACHE_DIR`** outside the repo. Set `REACT_APP_API_BASE_URL` in `.env` before deploy (baked into the static build).

GitHub: **Settings → Pages** — source **GitHub Actions** so the workflow in `.github/workflows/deploy-gh-pages.yml` can publish (artifact + deploy-pages). For branch-only deploys, use **`npm run deploy`** instead (see [docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md)).

**Vercel:** not required if you only use Pages. If `git push` still triggers Vercel builds, disconnect the project in Vercel (see **`docs/VERCEL.md` → “GitHub Pages만 쓸 때”**).

**Render:** `render.yaml` Blueprint — API + Postgres. See `docs/DEPLOY_RENDER.md`.
