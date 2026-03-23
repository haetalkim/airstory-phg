# Keepsake / snapshots

## 1. `integrated-frontend-snapshot/` (this folder)

**What it is:** A frozen copy of the **main React app** (`air-quality-tracker/src`, `public`, and key config files) with:

- Student / teacher **login & sign-up** (`LandingPage`, `App.js`)
- **Heat Map**, **Raw Data**, **Analysis**, **My Page**, **Manage Classes** (teachers)
- **Backend wiring** (`src/api/…`, JWT, `REACT_APP_API_BASE_URL`)
- **CSV import** helper (`src/utils/importedData.js`)

Use this if you ever need to restore the UI without digging through git history.

**It is not runnable by itself** — copy these files back into a Create React App project (or diff against a fresh CRA) and run `npm install`.

---

## 2. `../keepsake-pre-backend/`

**What it is:** Older snapshot from **before** the Node/Postgres backend (original look-and-feel reference only).  
See `keepsake-pre-backend/frontend-head/` for that UI.

---

## Canonical app location (what Vercel should build)

The live app you edit day-to-day is:

`air-quality-tracker/`  
→ `src/App.js`, `src/components/*`, `src/api/*`

Not the nested `air-quality-tracker/air-quality-tracker/` folder (legacy duplicate).
