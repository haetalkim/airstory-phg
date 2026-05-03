# GitHub Pages deployment

## Canonical frontend location

The **main React app** lives at the **repository root**: `package.json`, `src/`, `public/`.

The nested folder `air-quality-tracker/` is a **legacy / alternate CRA tree** (older dashboard-only prototype). **GitHub Actions and manual deploy must build from the root**, not from `air-quality-tracker/`.

If the live site shows old behavior (e.g. Manhattan map, missing Raw Data fixes), the Pages bundle was almost certainly built from the wrong directory or an old commit—fix CI/build source first, not only hard refresh.

## Automatic deploy (recommended)

Workflow: [.github/workflows/deploy-gh-pages.yml](../.github/workflows/deploy-gh-pages.yml).

- Triggers on push to `main` when `src/`, `public/`, `package.json`, `package-lock.json`, Tailwind/PostCSS configs, or the workflow file change.
- Runs `npm ci` and `npm run build` at the **repo root**, uploads `build/` to GitHub Pages.

### Optional repository secret

| Name | Purpose |
|------|--------|
| `REACT_APP_API_BASE_URL` | Full API base URL ending in `/api`, e.g. `https://air-sensor-api.onrender.com/api`. If omitted, the workflow uses the same default as [DEPLOY_RENDER.md](DEPLOY_RENDER.md). |

GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

### GitHub Pages settings

**Settings → Pages → Build and deployment**

- Source: **GitHub Actions** (not “Deploy from a branch” only—Actions uploads the artifact).

### Backend checklist (feature parity)

After changing auth or profile APIs, redeploy the **Render** (or other) API so the deployed frontend can call:

- `PATCH /auth/me/profile`
- `GET /auth/workspaces/:id/class-structure` (including student role if you rely on Raw Data for students)

Mismatch between frontend bundle and API version often looks like “Save does nothing” or stale dropdowns.

## Manual deploy (same artifact as CI)

From repo root:

```bash
# Optional: .env with REACT_APP_API_BASE_URL=https://your-api.../api
npm run build
npm run deploy   # gh-pages branch via scripts/deploy-github-pages.sh
```

Ensure **`homepage`** in root `package.json` stays **`"."`** so asset URLs work on GitHub Pages subpaths (see [VERCEL.md](VERCEL.md)).
