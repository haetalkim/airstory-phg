/**
 * OpenAQ API v3 — server-side only (API key stays off the client).
 * @see https://docs.openaq.org/using-the-api/api-key
 */

const OPENAQ_BASE = "https://api.openaq.org/v3";

function roundCoord(n) {
  return Math.round(n * 10000) / 10000;
}

async function openaqJson(path, apiKey, searchParams) {
  const url = new URL(OPENAQ_BASE + path);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url, {
    headers: { "X-API-Key": apiKey },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAQ ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function normalizeMetric(metric) {
  const m = String(metric || "pm25").toLowerCase();
  if (m === "pm25" || m === "pm2.5") return "pm25";
  return m;
}

/** Match OpenAQ sensor parameter to our metric (pm25 only for real OpenAQ for now). */
function sensorMatchesMetric(sensor, metric) {
  const name = (sensor?.parameter?.name || "").toLowerCase();
  if (metric === "pm25") return name === "pm25" || name === "pm2.5" || name.includes("pm2");
  if (metric === "co") return name === "co";
  if (metric === "temp") return name === "temp" || name === "temperature";
  if (metric === "humidity") return name === "humidity" || name === "rh";
  return false;
}

function pickSensorFromLocations(locations, metric) {
  for (const loc of locations || []) {
    for (const s of loc.sensors || []) {
      if (sensorMatchesMetric(s, metric)) {
        return { sensorId: s.id, locationName: loc.name || null, locality: loc.locality || null };
      }
    }
  }
  return null;
}

function extractMeasurementDayUtc(m) {
  const utc =
    m?.period?.datetimeFrom?.utc ||
    m?.datetimeFrom?.utc ||
    m?.period?.datetimeTo?.utc ||
    null;
  if (!utc) return null;
  return utc.split("T")[0];
}

/**
 * Fetch measurements for a sensor and return daily averages { 'YYYY-MM-DD': number }.
 */
async function fetchMeasurementsDailyAverages(apiKey, sensorId, datetimeFrom, datetimeTo) {
  const byDate = {};
  let page = 1;
  const limit = 1000;
  const maxPages = 10;

  while (page <= maxPages) {
    const data = await openaqJson(`/sensors/${sensorId}/measurements`, apiKey, {
      datetime_from: datetimeFrom,
      datetime_to: datetimeTo,
      limit,
      page,
    });
    const results = data.results || [];
    if (!results.length) break;

    for (const m of results) {
      const day = extractMeasurementDayUtc(m);
      if (!day) continue;
      const v = Number(m.value);
      if (Number.isNaN(v)) continue;
      if (!byDate[day]) byDate[day] = { sum: 0, n: 0 };
      byDate[day].sum += v;
      byDate[day].n += 1;
    }

    const found = Number(data.meta?.found);
    if (!Number.isFinite(found) || page * limit >= found) break;
    page += 1;
  }

  const out = {};
  Object.entries(byDate).forEach(([day, { sum, n }]) => {
    out[day] = Math.round((sum / n) * 100) / 100;
  });
  return out;
}

/**
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {number} opts.lat
 * @param {number} opts.lng
 * @param {string} opts.dateFrom YYYY-MM-DD
 * @param {string} opts.dateTo YYYY-MM-DD
 * @param {string} [opts.metric]
 * @returns {Promise<{ points: { date: string, value: number }[], locationName?: string, sensorId?: number, source: string } | { error: string, message: string }>}
 */
export async function fetchOpenAQDailyReference(opts) {
  const { apiKey, lat, lng, dateFrom, dateTo, metric: rawMetric } = opts;
  const metric = normalizeMetric(rawMetric);

  if (!apiKey) {
    return { error: "no_api_key", message: "OPENAQ_API_KEY is not set on the server." };
  }

  if (!["pm25"].includes(metric)) {
    return {
      error: "unsupported_metric",
      message: "OpenAQ daily reference is implemented for pm25 (PM2.5) only. Use simulated reference for other metrics.",
    };
  }

  const coords = `${roundCoord(lat)},${roundCoord(lng)}`;
  const locData = await openaqJson("/locations", apiKey, {
    coordinates: coords,
    radius: 15000,
    limit: 15,
  });

  const picked = pickSensorFromLocations(locData.results || [], metric);
  if (!picked) {
    return {
      error: "no_sensor",
      message: "No matching OpenAQ sensor found near this location for the selected metric.",
      points: [],
    };
  }

  const datetimeFrom = `${dateFrom}T00:00:00.000Z`;
  const datetimeTo = `${dateTo}T23:59:59.999Z`;

  const byDate = await fetchMeasurementsDailyAverages(apiKey, picked.sensorId, datetimeFrom, datetimeTo);

  const points = Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));

  return {
    source: "openaq",
    metric,
    locationName: picked.locationName,
    sensorId: picked.sensorId,
    points,
  };
}
