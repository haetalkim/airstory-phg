# OpenAQ (reference line on Analysis)

The **Analysis** page can show a **reference series** from [OpenAQ](https://openaq.org/) (API v3) for **PM2.5, CO, temperature, and humidity** when a nearby OpenAQ sensor reports that parameter. The **API key never goes in the frontend** — only the backend calls OpenAQ.

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

- For **pm25, co, temp, humidity**: the backend searches OpenAQ locations near the reference pin and, if it finds a matching sensor, returns **daily averages** for your chart date range.
- If there is **no sensor** for that metric in the area (or OpenAQ has no data), the UI falls back to the **simulated** reference curve.
- Coverage varies by city: many stations publish PM2.5; **temp / RH / CO** are less common on OpenAQ than on dedicated weather APIs.
