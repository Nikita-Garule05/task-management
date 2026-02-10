import axios from "axios";

const envBaseUrl = process.env.REACT_APP_API_BASE_URL;
const API_BASE_URL = (envBaseUrl && envBaseUrl.replace(/\/+$/, "")) ||
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");

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
