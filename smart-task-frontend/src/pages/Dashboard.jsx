import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import TaskCard from "../components/TaskCard";
import ConfirmModal from "../components/ConfirmModal";
import StatCard from "../components/StatCard";
import { deleteTask, getAnalytics, getInsights, getReminders, listAllTasks, listTasksPaginated, patchTask } from "../api/tasks";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [reminders, setReminders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const progressPct = insights?.progress_pct ?? 0;
  const circleRadius = 18;
  const circleCirc = 2 * Math.PI * circleRadius;
  const circleOffset = circleCirc - (Math.min(Math.max(progressPct, 0), 100) / 100) * circleCirc;

  const [activeTab, setActiveTab] = useState("all");

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  const params = useMemo(() => {
    const p = {};

    if (activeTab === "important") p.important = "1";
    if (activeTab === "completed") p.status = "completed";
    if (activeTab === "in_progress") p.status = "in_progress";

    if (activeTab === "all" && statusFilter) p.status = statusFilter;
    if (priorityFilter) p.priority = priorityFilter;
    if (categoryFilter) p.category = categoryFilter;
    if (search) p.search = search;
    return p;
  }, [activeTab, categoryFilter, priorityFilter, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [params]);

  const pinnedCount = useMemo(() => allTasks.filter((t) => Boolean(t.is_important)).length, [allTasks]);

  const displayTasks = useMemo(() => {
    const copy = Array.isArray(tasks) ? [...tasks] : [];
    copy.sort((a, b) => {
      const ai = a?.is_important ? 1 : 0;
      const bi = b?.is_important ? 1 : 0;
      if (ai !== bi) return bi - ai;

      const ad = a?.due_date || "";
      const bd = b?.due_date || "";
      if (ad !== bd) return ad.localeCompare(bd);
      return (b?.id ?? 0) - (a?.id ?? 0);
    });
    return copy;
  }, [tasks]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [tp, all, a, i, r] = await Promise.all([
        listTasksPaginated({ ...params, page }),
        listAllTasks(),
        getAnalytics(),
        getInsights(),
        getReminders(),
      ]);

      const results = Array.isArray(tp?.results) ? tp.results : [];
      setTasks(results);
      setAllTasks(all);

      const total = Number(tp?.count ?? results.length) || 0;
      const pc = Math.max(1, Math.ceil(total / 6));
      setPageCount(pc);
      setAnalytics(a);
      setInsights(i);
      setReminders(r);
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const src = Array.isArray(allTasks) ? allTasks : [];
    const total = src.length;
    const pending = src.filter((t) => t.status === "pending").length;
    const inProgress = src.filter((t) => t.status === "in_progress").length;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const next7 = new Date(todayStart);
    next7.setDate(todayStart.getDate() + 7);

    const active = src.filter((t) => t.status !== "completed");
    const overdue = active.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(`${t.due_date}T00:00:00`);
      return d < todayStart;
    }).length;

    const dueSoon = active.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(`${t.due_date}T00:00:00`);
      return d >= todayStart && d <= next7;
    }).length;

    return {
      total,
      pending,
      inProgress,
      overdue,
      dueSoon,
    };
  }, [allTasks]);

  const pages = useMemo(() => {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }, [pageCount]);

  useEffect(() => {
    load();
  }, [params, page]);

  const onToggleComplete = async (task) => {
    try {
      const nextStatus = task.status === "completed" ? "pending" : "completed";
      await patchTask(task.id, { status: nextStatus });
      await load();
    } catch (err) {
      setError("Failed to update task.");
    }
  };

  const onToggleImportant = async (task) => {
    try {
      await patchTask(task.id, { is_important: !task.is_important });
      await load();
    } catch (err) {
      setError("Failed to update task.");
    }
  };

  const onSetInProgress = async (task) => {
    try {
      const next = task.status === "in_progress" ? "pending" : "in_progress";
      await patchTask(task.id, { status: next });
      await load();
    } catch (err) {
      setError("Failed to update task.");
    }
  };

  const onDelete = async (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete.id);
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
      await load();
    } catch (err) {
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
      setError("Failed to delete task.");
    }
  };

  return (
    <>
      <Navbar
        notifications={{
          overdue: reminders?.counts?.overdue ?? 0,
          dueTomorrow: reminders?.counts?.due_tomorrow ?? 0,
          suggestions: reminders?.suggestions ?? [],
        }}
      />
      <div className="container py-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge text-bg-primary">Smart</span>
                  <h2 className="mb-0">Dashboard</h2>
                </div>
                <div className="text-muted mt-1">Track tasks, deadlines, and progress.</div>
              </div>

              <div className="d-flex align-items-center flex-wrap gap-2">
                <div style={{ minWidth: 160 }}>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    disabled={activeTab !== "all"}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div style={{ minWidth: 160 }}>
                  <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                    <option value="">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div style={{ minWidth: 170 }}>
                  <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Study">Study</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div style={{ minWidth: 220 }}>
                  <input
                    className="form-control"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error ? <div className="alert alert-danger mt-3">{error}</div> : null}

        {insights ? (
          <div className="card shadow-sm border-0 mt-3">
            <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div className="text-muted">Progress</div>
                <div className="fw-semibold">
                  {insights.counts.completed} completed out of {insights.counts.total} tasks
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="Progress">
                  <circle cx="24" cy="24" r={circleRadius} stroke="#e9ecef" strokeWidth="6" fill="none" />
                  <circle
                    cx="24"
                    cy="24"
                    r={circleRadius}
                    stroke="#0d6efd"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circleCirc}
                    strokeDashoffset={circleOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)"
                  />
                  <text x="24" y="28" textAnchor="middle" fontSize="12" fill="#212529" fontWeight="600">
                    {progressPct}%
                  </text>
                </svg>
                <div className="fw-semibold">{progressPct}%</div>
              </div>
            </div>
            <div className="progress mt-2" role="progressbar" aria-label="Task progress">
              <div className="progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            </div>
          </div>
        ) : null}

        <div className="mt-3 stats-grid">
          <StatCard title="Total Tasks" value={stats.total} color="blue" />
          <StatCard title="Pending" value={stats.pending} color="yellow" tag="Open" />
          <StatCard title="In Progress" value={stats.inProgress} color="purple" tag="Active" />
          <StatCard title="Overdue" value={stats.overdue} color="red" tag="Urgent" />
          <StatCard title="Due Soon" value={stats.dueSoon} color="green" tag="Next" />
        </div>

        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h4 className="mb-0">Your Tasks</h4>
            <ul className="nav nav-pills">
              <li className="nav-item">
                <button
                  className={activeTab === "all" ? "nav-link active" : "nav-link"}
                  type="button"
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={activeTab === "important" ? "nav-link active" : "nav-link"}
                  type="button"
                  onClick={() => setActiveTab("important")}
                >
                  Pinned
                  {pinnedCount ? <span className="badge text-bg-dark ms-2">{pinnedCount}</span> : null}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={activeTab === "completed" ? "nav-link active" : "nav-link"}
                  type="button"
                  onClick={() => setActiveTab("completed")}
                >
                  Completed
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={activeTab === "in_progress" ? "nav-link active" : "nav-link"}
                  type="button"
                  onClick={() => setActiveTab("in_progress")}
                >
                  In Progress
                </button>
              </li>
            </ul>
          </div>

          {loading ? <div className="text-muted">Loading...</div> : null}
          {!loading && tasks.length === 0 ? <div className="text-muted">No tasks found.</div> : null}

          <div className="row g-3">
            {displayTasks.map((t) => (
              <div key={t.id} className="col-12 col-md-6 col-lg-4 d-flex">
                <TaskCard
                  task={t}
                  onToggleComplete={onToggleComplete}
                  onToggleImportant={onToggleImportant}
                  onSetInProgress={onSetInProgress}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>

          {pageCount > 1 ? (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="Tasks pagination">
                <ul className="pagination mb-0">
                  <li className={page <= 1 ? "page-item disabled" : "page-item"}>
                    <button className="page-link" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Prev
                    </button>
                  </li>

                  {pages.map((p) => (
                    <li key={p} className={p === page ? "page-item active" : "page-item"}>
                      <button className="page-link" type="button" onClick={() => setPage(p)}>
                        {p}
                      </button>
                    </li>
                  ))}

                  <li className={page >= pageCount ? "page-item disabled" : "page-item"}>
                    <button className="page-link" type="button" onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        show={deleteConfirmOpen}
        title="Delete Task"
        message={taskToDelete ? `Are you sure you want to delete: ${taskToDelete.title}?` : "Are you sure you want to delete this task?"}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setTaskToDelete(null);
        }}
      />
    </>
  );
}

export default Dashboard;
