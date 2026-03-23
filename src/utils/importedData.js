const IMPORTED_MEASUREMENTS_KEY = "air_imported_measurements_v1";

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function getMappedValue(record, keys, fallback = "") {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return fallback;
}

export function setImportedMeasurements(data) {
  localStorage.setItem(IMPORTED_MEASUREMENTS_KEY, JSON.stringify(data || []));
}

export function getImportedMeasurements() {
  const raw = localStorage.getItem(IMPORTED_MEASUREMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearImportedMeasurements() {
  localStorage.removeItem(IMPORTED_MEASUREMENTS_KEY);
}

export function parseImportedCsv(csvText) {
  const lines = String(csvText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);
  const rows = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex]);
    const record = {};
    headers.forEach((header, i) => {
      record[header] = values[i] ?? "";
    });

    const date = getMappedValue(record, ["date"], "");
    const time = getMappedValue(record, ["time"], "");
    const timestamp = getMappedValue(record, ["timestamp"], "");
    const parsedDate = timestamp
      ? new Date(timestamp)
      : new Date(`${date || "1970-01-01"}T${time || "00:00"}`);

    if (Number.isNaN(parsedDate.getTime())) continue;

    const item = {
      id: `csv-${lineIndex}-${parsedDate.getTime()}`,
      date: parsedDate.toISOString().split("T")[0],
      time: parsedDate.toTimeString().slice(0, 5),
      sessionId: getMappedValue(record, ["sessionid", "sessioncode"], "SESSION"),
      sessionName: getMappedValue(record, ["sessionname", "session"], "Imported Session"),
      sessionNotes: getMappedValue(record, ["notes", "sessionnotes"], ""),
      location: getMappedValue(record, ["location"], "Imported Location"),
      latitude: Number(getMappedValue(record, ["latitude", "lat"], "40.758")),
      longitude: Number(getMappedValue(record, ["longitude", "lng", "lon"], "-73.9855")),
      indoorOutdoor: getMappedValue(record, ["indooroutdoor"], "OUTDOOR") || "OUTDOOR",
      school: getMappedValue(record, ["school", "schoolcode"], ""),
      instructor: getMappedValue(record, ["classinstructor", "class", "instructor"], ""),
      period: getMappedValue(record, ["period"], ""),
      group: getMappedValue(record, ["group", "groupcode"], ""),
      pm25: Number(getMappedValue(record, ["pm25"], "0")) || 0,
      co: (Number(getMappedValue(record, ["co"], "0")) || 0).toFixed(2),
      temp: Number(getMappedValue(record, ["temperature", "temp"], "0")) || 0,
      humidity: Number(getMappedValue(record, ["humidity"], "0")) || 0,
      photos: [],
      edits: {},
      source: "csv",
      capturedAt: parsedDate.toISOString(),
    };

    if (!Number.isFinite(item.latitude)) item.latitude = 40.758;
    if (!Number.isFinite(item.longitude)) item.longitude = -73.9855;
    rows.push(item);
  }

  if (!rows.length) {
    throw new Error("No valid data rows found in CSV.");
  }

  return rows.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
}
