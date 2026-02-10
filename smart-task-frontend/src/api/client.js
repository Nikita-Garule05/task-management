import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export function setAuthToken(accessToken) {
  if (accessToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}
