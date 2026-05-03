import { apiRequest, setStoredAuth, getStoredAuth } from "./http";

export async function login(email, password) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail, password }),
  });
  setStoredAuth(data);
  return data;
}

/** Requires Bearer token; email must match signed-in user. Invalidates refresh tokens. */
export async function changePassword(email, newPassword) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  return apiRequest("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail, newPassword }),
  });
}

export async function register({
  email,
  password,
  fullName,
  workspaceName,
  role,
  schoolCode,
  instructor,
  period,
  groupCode,
  studentCode,
  joinWorkspaceId,
  joinCode,
}) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password,
      fullName,
      workspaceName: workspaceName || "Default Workspace",
      role: role || "student",
      schoolCode: schoolCode || "",
      instructor: instructor || "",
      period: period || "",
      groupCode: groupCode || "",
      studentCode: studentCode || "",
      joinWorkspaceId,
      joinCode: joinCode || undefined,
    }),
  });
  setStoredAuth(data);
  return data;
}

export async function getMe() {
  return apiRequest("/auth/me");
}

export async function getRoster(workspaceId) {
  return apiRequest(`/auth/workspaces/${workspaceId}/roster`);
}

export async function getJoinCodes(workspaceId) {
  return apiRequest(`/auth/workspaces/${workspaceId}/join-codes`);
}

export async function createJoinCode(workspaceId, body) {
  return apiRequest(`/auth/workspaces/${workspaceId}/join-codes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getJoinCodeConfig(code) {
  return apiRequest(`/auth/join-code/${encodeURIComponent(String(code || "").toUpperCase())}/config`);
}

export async function getClassStructure(workspaceId) {
  return apiRequest(`/auth/workspaces/${workspaceId}/class-structure`);
}

export async function updateClassStructure(workspaceId, body) {
  return apiRequest(`/auth/workspaces/${workspaceId}/class-structure`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function setJoinCodeActive(workspaceId, codeId, active) {
  return apiRequest(`/auth/workspaces/${workspaceId}/join-codes/${codeId}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export async function resetStudentPassword(workspaceId, userId, newPassword) {
  return apiRequest(`/auth/workspaces/${workspaceId}/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export async function updateStudentPlacement(workspaceId, userId, { period, groupCode }) {
  return apiRequest(`/auth/workspaces/${workspaceId}/users/${userId}/placement`, {
    method: "PATCH",
    body: JSON.stringify({ period, groupCode }),
  });
}

export async function removeStudent(workspaceId, userId) {
  return apiRequest(`/auth/workspaces/${workspaceId}/users/${userId}`, {
    method: "DELETE",
  });
}

export async function logout() {
  const auth = getStoredAuth();
  try {
    if (auth?.refreshToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
    }
  } finally {
    // Always clear local session, even when backend logout is unreachable.
    setStoredAuth(null);
  }
}
