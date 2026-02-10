import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import { createTask, getTask, updateTask } from "../api/tasks";

function Addtask({ mode }) {
  const navigate = useNavigate();
  const params = useParams();
  const taskId = params.id;

  const isEdit = useMemo(() => mode === "edit", [mode]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [categoryPreset, setCategoryPreset] = useState("");
  const [status, setStatus] = useState("pending");
  const [isImportant, setIsImportant] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      if (!taskId) return;

      setLoading(true);
      setError("");
      try {
        const t = await getTask(taskId);
        setTitle(t.title || "");
        setDescription(t.description || "");
        setDueDate(t.due_date || "");
        setPriority(t.priority || "");
        setCategory(t.category || "");
        const presetValues = new Set(["Work", "Personal", "Study", "Urgent"]);
        setCategoryPreset(presetValues.has(t.category) ? t.category : t.category ? "Custom" : "");
        setStatus(t.status || "pending");
        setIsImportant(Boolean(t.is_important));
      } catch (err) {
        setError("Failed to load task.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isEdit, taskId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        due_date: dueDate || null,
        category: categoryPreset === "Custom" ? category : categoryPreset,
        is_important: isImportant,
      };

      if (priority) payload.priority = priority;
      if (isEdit) payload.status = status;

      if (isEdit) {
        await updateTask(taskId, payload);
      } else {
        await createTask(payload);
      }

      navigate("/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.title?.[0] || err?.response?.data?.detail || "Failed to save task.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ maxWidth: 760 }}>
        <h2 className="mb-1">{isEdit ? "Edit Task" : "Add Task"}</h2>
        <div className="text-muted mb-3">{isEdit ? "Update your task details." : "Create a new task."}</div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <form onSubmit={onSubmit} className="card card-body">
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Due Date</label>
              <input className="form-control" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Priority</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">Auto (recommended)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="form-text">If not selected, priority is suggested using the due date.</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryPreset}
                onChange={(e) => {
                  const v = e.target.value;
                  setCategoryPreset(v);
                  if (v !== "Custom") setCategory("");
                }}
              >
                <option value="">Select</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
                <option value="Urgent">Urgent</option>
                <option value="Custom">Custom</option>
              </select>
              {categoryPreset === "Custom" ? (
                <input
                  className="form-control mt-2"
                  placeholder="Enter custom category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              ) : null}
            </div>
          </div>

          <div className="form-check mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              id="importantCheck"
            />
            <label className="form-check-label" htmlFor="importantCheck">
              Mark as Important
            </label>
          </div>

          {isEdit ? (
            <div className="mt-3">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          ) : null}

          <div className="mt-4 d-flex gap-2">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Task" : "Create Task"}
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default Addtask;
