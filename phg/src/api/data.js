import { apiRequest } from "./http";

export function getMeasurements(workspaceId, params = {}) {
  const qs = new URLSearchParams(params);
  return apiRequest(`/workspaces/${workspaceId}/measurements?${qs.toString()}`);
}

export function addMeasurementEdit(workspaceId, measurementId, body) {
  return apiRequest(`/workspaces/${workspaceId}/measurements/${measurementId}/edits`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Aggregated lat/lng buckets for heat map (requires auth). */
export function getHeatmapPoints(workspaceId, metric = "pm25") {
  const q = new URLSearchParams({ metric });
  return apiRequest(`/workspaces/${workspaceId}/heatmap?${q.toString()}`);
}

export function importCsvMeasurements(workspaceId, rows = []) {
  return apiRequest(`/workspaces/${workspaceId}/import/csv`, {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

export function clearWorkspaceMeasurements(workspaceId) {
  return apiRequest(`/workspaces/${workspaceId}/measurements`, {
    method: "DELETE",
  });
}
