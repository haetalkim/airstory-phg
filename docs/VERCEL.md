# Vercel (frontend)

## GitHub Pages만 쓸 때 — Vercel 자동 배포 끄기

`git push` 할 때마다 Vercel이 배포되는 이유는 **Vercel 프로젝트가 이 GitHub 저장소와 연결**되어 있기 때문입니다. 저장소 안의 `vercel.json`을 지워도 **연결만 남아 있으면** 배포는 계속될 수 있습니다.

1. [vercel.com](https://vercel.com) 로그인 → **air-quality-tracker** (또는 해당) 프로젝트 열기  
2. **Settings → Git**  
3. **Disconnect** (또는 **Remove Git Repository**) 로 GitHub 연결 해제  

또는 프로젝트 전체 **Delete Project** 로 삭제해도 됩니다.

선택: GitHub → **Settings → Applications** → **Vercel** 권한 정리.

이후 프론트는 **`npm run deploy`** 로 **GitHub Pages (`gh-pages` 브랜치)** 만 쓰면 됩니다.

---

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

## Blank white page on Vercel (deploy succeeds)

If production is empty but the build is green, open DevTools → **Network** and check whether JS/CSS requests go to **`/tamguingAIR/static/...`** and return **404**.

That happens when `package.json` uses a **GitHub Pages** `homepage` (absolute path `/tamguingAIR`). Vercel serves the app at the **site root** (`/`), so those asset URLs are wrong.

This repo uses **`"homepage": "."`** so asset paths are **relative** and work on **both** Vercel (root) and GitHub Pages (`/tamguingAIR/`).

## Environment variable

`REACT_APP_API_BASE_URL` = your API base, e.g.

`https://your-service.onrender.com/api`

Redeploy after changing env vars.

## Still skipping the login page?

If the root directory is correct but you never see login: open the site in an **Incognito/Private** window. An old `localStorage` token can make the app think you’re already logged in.

## Keepsake copy of this UI

`keepsake/integrated-frontend-snapshot/` — see `keepsake/README.md`.
