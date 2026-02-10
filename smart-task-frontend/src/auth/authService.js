import { apiClient, setAuthToken } from "../api/client";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./token";

function emitAuthChanged() {
  try {
    window.dispatchEvent(new Event("stm_auth_changed"));
  } catch {
    // ignore
  }
}

function isJwtExpired(token) {
  try {
    const parts = (token || "").split(".");
    if (parts.length < 2) return true;
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(payloadB64);
    const payload = JSON.parse(payloadJson);
    const expMs = typeof payload.exp === "number" ? payload.exp * 1000 : 0;
    if (!expMs) return true;
    return Date.now() >= expMs;
  } catch {
    return true;
  }
}

export async function register({ username, email, password }) {
  const res = await apiClient.post("/api/auth/register/", { username, email, password });
  return res.data;
}

export async function login({ username, password }) {
  const res = await apiClient.post("/api/auth/login/", { username, password });
  setTokens(res.data);
  setAuthToken(res.data.access);
  emitAuthChanged();
  return res.data;
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");

  const res = await apiClient.post("/api/auth/refresh/", { refresh });
  setTokens({ access: res.data.access });
  setAuthToken(res.data.access);
  emitAuthChanged();
  return res.data.access;
}

export async function forgotPassword({ email }) {
  const res = await apiClient.post("/api/auth/forgot-password/", { email });
  return res.data;
}

export async function resetPassword({ uid, token, new_password }) {
  const res = await apiClient.post("/api/auth/reset-password/", { uid, token, new_password });
  return res.data;
}

export function initAuthFromStorage() {
  const access = getAccessToken();
  if (access && !isJwtExpired(access)) {
    setAuthToken(access);
  } else {
    clearTokens();
    setAuthToken(null);
  }
  emitAuthChanged();
}

export function logout() {
  clearTokens();
  setAuthToken(null);
  emitAuthChanged();
}

export function isAuthenticated() {
  const access = getAccessToken();
  if (!access) return false;
  if (isJwtExpired(access)) {
    clearTokens();
    setAuthToken(null);
    return false;
  }
  return true;
}
