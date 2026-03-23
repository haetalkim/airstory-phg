import { apiRequest } from "./http";

export function getSessions(workspaceId) {
  return apiRequest(`/workspaces/${workspaceId}/sessions`);
}

export function createSession(workspaceId, body) {
  return apiRequest(`/workspaces/${workspaceId}/sessions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getMeasurements(workspaceId, params = {}) {
  const qs = new URLSearchParams(params);
  return apiRequest(`/workspaces/${workspaceId}/measurements?${qs.toString()}`);
}

export function getSummary(workspaceId, metric, params = {}) {
  const qs = new URLSearchParams({ metric, ...params });
  return apiRequest(`/workspaces/${workspaceId}/analytics/summary?${qs.toString()}`);
}

export function getHeatmap(workspaceId, metric) {
  return apiRequest(`/workspaces/${workspaceId}/heatmap?metric=${metric}`);
}

export function addMeasurementEdit(workspaceId, measurementId, body) {
  return apiRequest(`/workspaces/${workspaceId}/measurements/${measurementId}/edits`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
