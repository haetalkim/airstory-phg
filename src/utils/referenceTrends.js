/**
 * Reference “public / regional” trends for Analysis — same conceptual locations as the heat map,
 * clearly separate from your workspace measurements. Values are illustrative (not live EPA feeds).
 */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Baseline levels + coordinates for OpenAQ lookup (lat/lng ≈ heat map anchors).
export const REFERENCE_LOCATIONS = [
  { name: "Upper Manhattan", lat: 40.8448, lng: -73.9388, pm25: 8, co: 0.35, temp: 18, humidity: 42 },
  { name: "Washington Heights (168th St)", lat: 40.84, lng: -73.94, pm25: 9, co: 0.35, temp: 17, humidity: 44 },
  { name: "Central Park", lat: 40.7829, lng: -73.9654, pm25: 12, co: 0.4, temp: 20, humidity: 45 },
  { name: "Midtown East", lat: 40.7549, lng: -73.968, pm25: 22, co: 0.8, temp: 22, humidity: 55 },
  { name: "Midtown West", lat: 40.758, lng: -73.9855, pm25: 20, co: 0.7, temp: 21, humidity: 52 },
  { name: "Chelsea", lat: 40.7465, lng: -73.9972, pm25: 18, co: 0.6, temp: 20, humidity: 50 },
  { name: "Lower Manhattan", lat: 40.7074, lng: -74.0113, pm25: 10, co: 0.4, temp: 18, humidity: 43 },
  { name: "Columbia Area", lat: 40.8075, lng: -73.9626, pm25: 11, co: 0.4, temp: 19, humidity: 46 },
];

/**
 * Deterministic week-shaped series for a reference location (small day-to-day variation).
 */
export function getReferenceWeekSeries(locationName, metricKey) {
  const loc =
    REFERENCE_LOCATIONS.find((l) => l.name === locationName) || REFERENCE_LOCATIONS[2];
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
