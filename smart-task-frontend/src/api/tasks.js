import { apiClient } from "./client";

export async function listTasks(params = {}) {
  const res = await apiClient.get("/api/tasks/", { params });
  return res.data;
}

export async function listTasksPaginated(params = {}) {
  const res = await apiClient.get("/api/tasks/", { params });
  return res.data;
}

export async function listAllTasks(params = {}) {
  const res = await apiClient.get("/api/tasks/all/", { params });
  return res.data;
}

export async function createTask(payload) {
  const res = await apiClient.post("/api/tasks/", payload);
  return res.data;
}

export async function updateTask(id, payload) {
  const res = await apiClient.put(`/api/tasks/${id}/`, payload);
  return res.data;
}

export async function patchTask(id, payload) {
  const res = await apiClient.patch(`/api/tasks/${id}/`, payload);
  return res.data;
}

export async function deleteTask(id) {
  await apiClient.delete(`/api/tasks/${id}/`);
}

export async function getTask(id) {
  const res = await apiClient.get(`/api/tasks/${id}/`);
  return res.data;
}

export async function getAnalytics() {
  const res = await apiClient.get("/api/tasks/analytics/");
  return res.data;
}

export async function getInsights() {
  const res = await apiClient.get("/api/tasks/insights/");
  return res.data;
}

export async function getReminders() {
  const res = await apiClient.get("/api/tasks/reminders/");
  return res.data;
}
