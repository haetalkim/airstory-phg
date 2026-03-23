import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  addMeasurementEdit,
  getHeatmap,
  getMeasurements,
  getSessions,
  getSummary,
} from "../api/data";

const METRICS = {
  pm25: { label: "PM 2.5", unit: "ug/m3" },
  co: { label: "CO", unit: "ppm" },
  temp: { label: "Temperature", unit: "C" },
  humidity: { label: "Humidity", unit: "%" },
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardApi({
  workspaceId,
  selectedMetric,
  setSelectedMetric,
  reflection,
  setReflection,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [editDrafts, setEditDrafts] = useState({});
  const [editLoadingId, setEditLoadingId] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!workspaceId) return;
      setLoading(true);
      setError("");
      try {
        const [sessionRes, measurementRes, summaryRes, heatmapRes] = await Promise.all([
          getSessions(workspaceId),
          getMeasurements(workspaceId, { limit: 200 }),
          getSummary(workspaceId, selectedMetric),
          getHeatmap(workspaceId, selectedMetric),
        ]);
        if (cancelled) return;
        setSessions(sessionRes.sessions || []);
        setMeasurements(measurementRes.measurements || []);
        setSummary(summaryRes.summary || null);
        setHeatmap(heatmapRes.points || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, selectedMetric]);

  const trendData = useMemo(() => {
    const grouped = new Map();
    measurements.forEach((row) => {
      const day = new Date(row.captured_at).toLocaleDateString();
      const value = toNumber(row[selectedMetric]);
      if (!grouped.has(day)) grouped.set(day, []);
      grouped.get(day).push(value);
    });
    return Array.from(grouped.entries())
      .map(([day, values]) => ({
        day,
        value: values.reduce((sum, n) => sum + n, 0) / values.length,
      }))
      .slice(0, 14)
      .reverse();
  }, [measurements, selectedMetric]);

  const topHeatPoints = heatmap.slice(0, 8);

  async function submitEdit(measurementId, fieldName) {
    const draftKey = `${measurementId}:${fieldName}`;
    const draft = editDrafts[draftKey];
    if (draft === undefined || draft === "") return;

    const note = window.prompt("Optional edit note", "Manual correction");
    setEditLoadingId(draftKey);
    try {
      await addMeasurementEdit(workspaceId, measurementId, {
        fieldName,
        editedValue: Number(draft),
        editNote: note || "",
      });
      setEditDrafts((prev) => ({ ...prev, [draftKey]: "" }));

      const [measurementRes, summaryRes, heatmapRes] = await Promise.all([
        getMeasurements(workspaceId, { limit: 200 }),
        getSummary(workspaceId, selectedMetric),
        getHeatmap(workspaceId, selectedMetric),
      ]);
      setMeasurements(measurementRes.measurements || []);
      setSummary(summaryRes.summary || null);
      setHeatmap(heatmapRes.points || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setEditLoadingId("");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sensor Analytics Dashboard</h2>
            <p className="text-sm text-gray-500">
              Workspace: {workspaceId || "No workspace selected"}
            </p>
          </div>
          <a
            href={`${process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api"}/workspaces/${workspaceId}/export/measurements.csv`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
          >
            Export CSV
          </a>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(METRICS).map(([key, metric]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`py-3 rounded-lg text-sm font-medium ${
                selectedMetric === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-xs text-gray-500">Mean</p>
          <p className="text-3xl font-bold text-blue-600">{toNumber(summary?.mean).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-xs text-gray-500">Median</p>
          <p className="text-3xl font-bold text-purple-600">{toNumber(summary?.median).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-xs text-gray-500">Min</p>
          <p className="text-3xl font-bold text-green-600">{toNumber(summary?.min).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-xs text-gray-500">Max</p>
          <p className="text-3xl font-bold text-orange-600">{toNumber(summary?.max).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-xs text-gray-500">Samples</p>
          <p className="text-3xl font-bold text-gray-700">{toNumber(summary?.sample_count)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend ({METRICS[selectedMetric].label})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Heatmap Aggregates</h3>
          <div className="space-y-2 max-h-72 overflow-auto">
            {topHeatPoints.map((point, idx) => (
              <div key={`${point.latitude}-${point.longitude}-${idx}`} className="flex justify-between text-sm border-b pb-2">
                <span className="text-gray-700">
                  ({point.latitude}, {point.longitude})
                </span>
                <span className="font-semibold text-gray-900">
                  {toNumber(point.value).toFixed(2)} {METRICS[selectedMetric].unit}
                </span>
              </div>
            ))}
            {!topHeatPoints.length ? <p className="text-sm text-gray-500">No heatmap points available.</p> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Measurements</h3>
          <div className="overflow-auto max-h-72">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr>
                  <th className="py-2">Time</th>
                  <th className="py-2">Session</th>
                  <th className="py-2">PM2.5</th>
                  <th className="py-2">CO</th>
                  <th className="py-2">Temp</th>
                  <th className="py-2">Humidity</th>
                </tr>
              </thead>
              <tbody>
                {measurements.slice(0, 15).map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2">{new Date(row.captured_at).toLocaleString()}</td>
                    <td className="py-2">{row.session_name || row.session_code || "Unknown"}</td>
                    {["pm25", "co", "temp", "humidity"].map((fieldName) => {
                      const edit = row.edits?.[fieldName];
                      const displayValue = edit ? toNumber(edit.editedValue) : toNumber(row[fieldName]);
                      const draftKey = `${row.id}:${fieldName}`;
                      const isBusy = editLoadingId === draftKey;
                      return (
                        <td key={fieldName} className="py-2">
                          <div className="flex items-center gap-1">
                            <span title={edit ? `Original: ${edit.originalValue}` : ""}>
                              {displayValue.toFixed(2)}
                              {edit ? "*" : ""}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <input
                              value={editDrafts[draftKey] || ""}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                              }
                              placeholder="Edit"
                              className="w-20 border rounded px-1 py-0.5 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => submitEdit(row.id, fieldName)}
                              disabled={isBusy}
                              className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white"
                            >
                              {isBusy ? "..." : "Save"}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {loading ? <p className="text-sm text-gray-500 mt-2">Loading...</p> : null}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Sessions</h3>
          <div className="space-y-2 max-h-44 overflow-auto">
            {sessions.slice(0, 10).map((session) => (
              <div key={session.id} className="text-sm border rounded-lg p-3">
                <p className="font-semibold">{session.name}</p>
                <p className="text-gray-600">
                  {session.session_code} • {session.group_code || "No group"} • {session.school_code || "No school"}
                </p>
              </div>
            ))}
            {!sessions.length ? <p className="text-sm text-gray-500">No sessions found.</p> : null}
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-800 mb-2">Reflection</p>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={4}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Capture analysis notes for this dataset..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
