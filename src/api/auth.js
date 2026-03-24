import { apiRequest, setStoredAuth, getStoredAuth } from "./http";

export async function login(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setStoredAuth(data);
  return data;
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
}) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
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
