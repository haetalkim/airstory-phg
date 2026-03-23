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
