# Deploy on Render (API + Postgres) + Vercel (website)

You will have **three URLs**:

1. **Vercel** — React app (you already have this)  
2. **Render Web Service** — `https://air-sensor-api.onrender.com` (example) — your API  
3. **Render Postgres** — no public URL; the API connects with `DATABASE_URL`

---

## Option A — Blueprint (fastest if the repo is on GitHub)

1. Push this repo to **GitHub**.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo and select it. Render reads **`render.yaml`** at the repo root.
4. Apply the blueprint — it creates:
   - PostgreSQL (`air-sensor-db`)
   - Web service (`air-sensor-api`) with `rootDir: backend`
5. Open the **Web Service** → **Environment**:
   - Find **`FRONTEND_URL`** (sync: false — you must set it).
   - Set value to your **exact Vercel URL**: `https://your-project.vercel.app`  
     - Use `https`, **no** trailing slash.
6. **Save** — Render redeploys.

**Migrations (free tier):** `preDeployCommand` is **not supported** on Render’s free web services. After the first successful API deploy, open the Web Service → **Shell** and run **`npm run db:migrate`** once (safe to repeat). Paid plans can use `preDeployCommand` in `render.yaml` if you add it back.

**Optional demo data** (demo environments only): Web Service → **Shell**, run:

```bash
npm run db:seed
```

7. Copy your API hostname, e.g. `https://air-sensor-api.onrender.com`
8. **Vercel** → Project → **Settings → Environment Variables**:
   - `REACT_APP_API_BASE_URL` = `https://air-sensor-api.onrender.com/api`  
   - Redeploy the frontend.

---

## Option B — Manual (no Blueprint)

### 1. Postgres

- **New** → **PostgreSQL**
- Name: `air-sensor-db`
- Copy **Internal Database URL** (preferred if API is also on Render) into a note as `DATABASE_URL`.

### 2. Web service

- **New** → **Web Service** → connect repo  
- **Root Directory:** `backend`  
- **Build:** `npm install`  
- **Start:** `npm start`  
- **Environment variables:**

| Key | Value |
|-----|--------|
| `DATABASE_URL` | From Postgres (Internal URL) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `JWT_ACCESS_SECRET` | Long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | Different random string |

### 3. Migrations (once)

Web Service → **Shell**:

```bash
npm run db:migrate
```

### 4. Vercel

Same as Option A: `REACT_APP_API_BASE_URL` = `https://YOUR-RENDER-SERVICE.onrender.com/api` → Redeploy.

---

## Check it works

1. Open `https://YOUR-API.onrender.com/health` — should return JSON `{ "ok": true, ... }`.
2. Open your Vercel site → log in (use seeded accounts if you ran `db:seed`).

### CORS errors in the browser

- `FRONTEND_URL` must **exactly** match the site origin (scheme + host, no path, no trailing slash).
- After changing env vars on Render, wait for redeploy to finish.

### Free tier sleep

Render **free** web services **spin down** after idle. First request after sleep can take **~30–60s**. Paid plan stays awake.

---

## Checklist

- [ ] Postgres created on Render  
- [ ] Web service deployed from `backend/`  
- [ ] `FRONTEND_URL` = Vercel URL  
- [ ] `npm run db:migrate` ran (or Blueprint `preDeployCommand` succeeded)  
- [ ] Vercel `REACT_APP_API_BASE_URL` = `https://…onrender.com/api`  
- [ ] Vercel redeployed  
- [ ] `/health` OK in browser  

Next improvement for **shared CSV imports**: add a server endpoint so uploads go to Postgres (not `localStorage`).
