# OpenAQ (reference line on Analysis)

The **Analysis** page can show a **PM2.5** reference series from [OpenAQ](https://openaq.org/) (API v3). The **API key never goes in the frontend** — only the backend calls OpenAQ.

## Local backend

1. Copy `backend/.env.example` → `backend/.env` (already gitignored).
2. Set:
   ```bash
   OPENAQ_API_KEY=your_key_here
   ```
3. Restart the API (`npm run dev` in `backend/`).

## Production (Render)

1. Web service → **Environment** → add **`OPENAQ_API_KEY`** with your key.
2. **Save** and redeploy.

## Git

- **`OPENAQ_API_KEY` must not be committed.**  
- Repo ignores `backend/.env`, `.env`, and `.env.*` (with `!.env.example` so examples can be committed).

## Behavior

- **PM2.5** only: OpenAQ is queried for daily averages near the selected reference pin.
- **CO / temp / humidity**: still use the **simulated** reference curve in the UI.
