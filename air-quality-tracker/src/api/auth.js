import { apiRequest, setStoredAuth, getStoredAuth } from "./http";

export async function login(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setStoredAuth(data);
  return data;
}

export async function register(payload) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(data);
  return data;
}

export async function logout() {
  const auth = getStoredAuth();
  if (auth?.refreshToken) {
    await apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
  }
  setStoredAuth(null);
}

export async function getMe() {
  return apiRequest("/auth/me");
}
