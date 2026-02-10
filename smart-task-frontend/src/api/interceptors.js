import { apiClient, setAuthToken } from "./client";
import { getAccessToken } from "../auth/token";
import { refreshAccessToken, logout } from "../auth/authService";

let isRefreshing = false;
let queued = [];

function flushQueue(error, token) {
  queued.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  queued = [];
}

export function setupInterceptors() {
  apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      if (!original) return Promise.reject(error);

      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
      }

      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queued.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      isRefreshing = true;

      try {
        const token = await refreshAccessToken();
        setAuthToken(token);
        flushQueue(null, token);
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch (refreshErr) {
        flushQueue(refreshErr, null);
        logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
  );
}
