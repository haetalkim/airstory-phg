# Vercel (frontend)

## Root directory (important)

For the **`tamguingAIR`** GitHub repo:

| Root Directory in Vercel | What gets built | Login / logout? |
|--------------------------|-----------------|-----------------|
| **Empty** or **`.`** (default) | Repo root → `src/App.js` | **Yes** (LandingPage + API auth) |
| **`air-quality-tracker`** | Nested legacy folder → old `Dashboard` UI | **No** — wrong app |

**If you see heat map but no login screen and no Logout button**, Vercel is almost certainly using **`air-quality-tracker`** as the root. Fix it:

1. Vercel → your project → **Settings** → **General**
2. **Root Directory** → **clear the field** (leave empty) or set to `.`
3. **Save** → **Deployments** → **Redeploy** the latest production build

The nested `air-quality-tracker/` folder in this repo is a **legacy duplicate** (old `Dashboard` only). The real app is at the **repository root** (`package.json` + `src/` next to `backend/`).

## Environment variable

`REACT_APP_API_BASE_URL` = your API base, e.g.

`https://your-service.onrender.com/api`

Redeploy after changing env vars.

## Still skipping the login page?

If the root directory is correct but you never see login: open the site in an **Incognito/Private** window. An old `localStorage` token can make the app think you’re already logged in.

## Keepsake copy of this UI

`keepsake/integrated-frontend-snapshot/` — see `keepsake/README.md`.
