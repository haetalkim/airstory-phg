/**
 * Reference “public / regional” trends for Analysis — same conceptual locations as the heat map,
 * clearly separate from your workspace measurements. Values are illustrative (not live EPA feeds).
 */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Baseline levels by named place (Manhattan-area style); used only for comparison charts.
export const REFERENCE_LOCATIONS = [
  { name: "Upper Manhattan", pm25: 8, co: 0.35, temp: 18, humidity: 42 },
  { name: "Washington Heights (168th St)", pm25: 9, co: 0.35, temp: 17, humidity: 44 },
  { name: "Central Park", pm25: 12, co: 0.4, temp: 20, humidity: 45 },
  { name: "Midtown East", pm25: 22, co: 0.8, temp: 22, humidity: 55 },
  { name: "Midtown West", pm25: 20, co: 0.7, temp: 21, humidity: 52 },
  { name: "Chelsea", pm25: 18, co: 0.6, temp: 20, humidity: 50 },
  { name: "Lower Manhattan", pm25: 10, co: 0.4, temp: 18, humidity: 43 },
  { name: "Columbia Area", pm25: 11, co: 0.4, temp: 19, humidity: 46 },
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
