/**
 * Column names aligned with sensor-export CSV (e.g. floor_*.csv).
 * Used for Raw Data export and as the UI source of truth for labels/order.
 */
export const SENSOR_CSV_EXPORT_HEADERS = [
  'Timestamp',
  'Date',
  'Time',
  'Session ID',
  'Session Name',
  'School',
  'Class (Instructor)',
  'Period',
  'Group',
  'Location',
  'Latitude',
  'Longitude',
  'INDOOR/OUTDOOR',
  'PM 2.5',
  'CO',
  'Temperature',
  'Humidity',
];

/** Escape a CSV field (quotes + commas). */
export function csvEscapeCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Match typical sensor file: "YYYY-MM-DD HH:mm:ss" in local time. */
export function formatSensorTimestamp(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Google Maps search URL for a coordinate pair, or null if invalid. */
export function googleMapsSearchUrl(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  return `https://www.google.com/maps?q=${la},${ln}`;
}
