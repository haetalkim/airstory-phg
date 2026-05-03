/**
 * Reference “public / regional” trends for Analysis — Philadelphia-area pins,
 * clearly separate from your workspace measurements. Values are illustrative (not live EPA feeds).
 */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Baseline levels + coordinates for OpenAQ lookup (lat/lng ≈ heat map anchors).
export const REFERENCE_LOCATIONS = [
  { name: "Center City", lat: 39.9526, lng: -75.1652, pm25: 14, co: 0.45, temp: 72, humidity: 52 },
  { name: "University City", lat: 39.9522, lng: -75.1932, pm25: 12, co: 0.42, temp: 71, humidity: 50 },
  { name: "South Philadelphia", lat: 39.9279, lng: -75.1722, pm25: 16, co: 0.55, temp: 73, humidity: 54 },
  { name: "Fishtown", lat: 39.9706, lng: -75.1345, pm25: 13, co: 0.4, temp: 70, humidity: 48 },
  { name: "Germantown", lat: 40.0318, lng: -75.175, pm25: 11, co: 0.38, temp: 69, humidity: 47 },
  { name: "Northeast Philadelphia", lat: 40.0736, lng: -75.014, pm25: 10, co: 0.35, temp: 68, humidity: 46 },
  { name: "West Philadelphia", lat: 39.962, lng: -75.264, pm25: 13, co: 0.44, temp: 71, humidity: 51 },
  { name: "Port Richmond", lat: 39.98, lng: -75.11, pm25: 15, co: 0.52, temp: 72, humidity: 53 },
];

/**
 * Deterministic week-shaped series for a reference location (small day-to-day variation).
 */
export function getReferenceWeekSeries(locationName, metricKey) {
  const loc =
    REFERENCE_LOCATIONS.find((l) => l.name === locationName) || REFERENCE_LOCATIONS[0];
  const base = Number(loc[metricKey]);
  if (Number.isNaN(base)) return WEEKDAYS.map((day) => ({ day, value: 0 }));

  return WEEKDAYS.map((day, i) => {
    const wobble = 1 + 0.06 * Math.sin((i + 1) * 1.2);
    let value = base * wobble;
    if (metricKey === "co") value = Math.round(value * 100) / 100;
    else if (metricKey === "temp" || metricKey === "humidity") value = Math.round(value);
    else value = Math.round(value);
    return { day, value };
  });
}
