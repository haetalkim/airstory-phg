# Simple cloud setup (you have Vercel already)

You need **one shared database** + **one API** that everyone hits. Vercel only serves the React app; it does **not** replace your Node backend.

**→ Step-by-step for Render:** see **[DEPLOY_RENDER.md](./DEPLOY_RENDER.md)** (includes `render.yaml` Blueprint).

---

## Pick a host (either is fine)

| Option | Why people use it |
|--------|-------------------|
| **Render** | Free tier, Postgres + web service in the same site, good docs. |
| **Railway** | Very fast to connect GitHub + Postgres, small free credit then paid. |

**Recommendation:** Start with **Render** if you want fewer moving parts on a free tier.

There is no single “best” host — both work with this repo.

---

## Step 1 — Postgres in the cloud

1. Sign up at [render.com](https://render.com) (or Railway).
2. Create **New → PostgreSQL**.
3. Copy the **Internal Database URL** (or **External** if the API runs outside their network — Render shows both; use what their docs say for “connect from Web Service”).
4. That string is your `DATABASE_URL`.

---

## Step 2 — Deploy the API (this repo’s `backend/` folder)

1. Push this project to **GitHub** (if it isn’t already).
2. On Render: **New → Web Service** → connect the repo.
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node

4. Add **Environment variables** (same names as `backend/.env.example`):

   | Variable | What to put |
   |----------|-------------|
   | `DATABASE_URL` | From Step 1 |
   | `JWT_ACCESS_SECRET` | Long random string (e.g. 32+ chars) |
   | `JWT_REFRESH_SECRET` | Different long random string |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | Your Vercel site URL, e.g. `https://your-app.vercel.app` |
   | `PORT` | Often auto-set by Render; if not, `4000` |

5. After the first deploy, run migrations **once**:
   - Render: **Shell** tab for the service, or a **one-off job**, run:
     ```bash
     npm run db:migrate
     ```
   - Optional demo data: `npm run db:seed` (only on a **demo** project, not real student PII).

6. Note your API URL, e.g. `https://air-sensor-api.onrender.com`

---

## Step 3 — Point Vercel at the API

1. Vercel → your project → **Settings → Environment Variables**
2. Add:
   - **Name:** `REACT_APP_API_BASE_URL`
   - **Value:** `https://YOUR-API.onrender.com/api`  
     (must end with `/api` — same as local)

3. **Redeploy** the frontend (Deployments → Redeploy).

---

## Step 4 — Smoke test

1. Open your Vercel URL → log in.
2. If login fails: check Render logs and that `FRONTEND_URL` matches Vercel **exactly** (including `https`, no trailing slash).

---

## Why this feels “hard”

- **Vercel** = static/frontend + serverless. Your **Express app** is a long-running server → it lives on **Render/Railway/Fly**, not on Vercel.
- **localStorage** CSV import = only one browser. For **other groups** to see data, uploads must go to the **API → Postgres** (we can add a “upload CSV to server” endpoint next).

---

## Quick checklist

- [ ] Cloud Postgres created → `DATABASE_URL`
- [ ] Backend deployed → public `https://...` URL
- [ ] `npm run db:migrate` ran once on that database
- [ ] `FRONTEND_URL` = Vercel URL
- [ ] Vercel `REACT_APP_API_BASE_URL` = `https://your-api.../api`
- [ ] Redeploy Vercel

When you’re ready, we can add **POST /import CSV** so imports are stored in Postgres and visible to all workspace members.
