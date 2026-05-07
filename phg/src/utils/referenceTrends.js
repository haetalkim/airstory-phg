/**
 * Reference “public / regional” trends for Analysis — Philadelphia-area pins,
 * clearly separate from your workspace measurements. Values are illustrative (not live EPA feeds).
 */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Baseline levels + coordinates for OpenAQ lookup (lat/lng ≈ heat map anchors).
export const REFERENCE_LOCATIONS = [
  { name: "Philadelphia", lat: 39.9526, lng: -75.1652, pm25: 14, co: 0.45, temp: 72, humidity: 52 },
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
