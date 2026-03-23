const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api";

export function getStoredAuth() {
  const raw = localStorage.getItem("air_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(auth) {
  if (!auth) {
    localStorage.removeItem("air_auth");
    return;
  }
  localStorage.setItem("air_auth", JSON.stringify(auth));
}

export async function apiRequest(path, options = {}) {
  const auth = getStoredAuth();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      errorMessage = payload.error || errorMessage;
    } catch {
      // no-op
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;
  return response.json();
}
