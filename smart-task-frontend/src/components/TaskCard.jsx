import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

function TaskCard({ task, onToggleComplete, onToggleImportant, onSetInProgress, onDelete }) {
  const priorityBadgeClass =
    task.priority === "high"
      ? "stm-badge-high"
      : task.priority === "medium"
        ? "stm-badge-medium"
        : "stm-badge-low";

  const now = new Date();
  const due = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null;
  const isOverdue = Boolean(due && due < now && task.status !== "completed");

  const statusBadgeClass =
    task.status === "completed"
      ? "stm-badge-completed"
      : task.status === "in_progress"
        ? "stm-badge-in-progress"
        : "stm-badge-pending";

  const statusLabel =
    task.status === "completed" ? "Completed" : task.status === "in_progress" ? "In Progress" : "Pending";

  const accentClass = isOverdue
    ? "stm-accent-red"
    : task.priority === "high"
      ? "stm-accent-red"
      : task.priority === "medium"
        ? "stm-accent-amber"
        : "stm-accent-blue";

  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (!cardRef.current) return;
      if (cardRef.current.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const primaryAction = useMemo(() => {
    if (task.status === "pending") {
      return {
        label: "Start",
        icon: "▶",
        onClick: () => onSetInProgress(task),
        className: "stm-btn stm-btn-sm stm-btn-amber",
      };
    }

    if (task.status === "in_progress") {
      return {
        label: "Done",
        icon: "✓",
        onClick: () => onToggleComplete(task),
        className: "stm-btn stm-btn-sm stm-btn-success",
      };
    }

    return {
      label: "Undo",
      icon: "↺",
      onClick: () => onToggleComplete(task),
      className: "stm-btn stm-btn-sm stm-btn-indigo",
    };
  }, [onSetInProgress, onToggleComplete, task]);

  return (
    <div
      ref={cardRef}
      className={
        task.is_important
          ? `card shadow-sm border-0 stm-task-card task-card-pinned ${accentClass}`
          : `card shadow-sm border-0 stm-task-card ${accentClass}`
      }
      role="article"
      style={{ height: "100%", width: "100%", transition: "transform 120ms ease, box-shadow 120ms ease" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 .5rem 1rem rgba(0,0,0,.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div className="card-body d-flex flex-column" style={{ height: "100%" }}>
        <div className="task-card">
          <div className="task-header">
            <h5 className="task-title mb-0 d-flex align-items-center gap-2">
              <span>{task.title}</span>
              {task.is_important ? (
                <button
                  type="button"
                  className="pin-icon-btn"
                  aria-label="Unpin task"
                  title="Pinned"
                  onClick={() => onToggleImportant(task)}
                >
                  <span className="pin-icon">★</span>
                </button>
              ) : null}
            </h5>

            <div className="task-actions">
              {!task.is_important ? (
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Pin task"
                  onClick={() => onToggleImportant(task)}
                  title="Pin"
                >
                  <span className="pin-icon">☆</span>
                </button>
              ) : null}

              <div className="menu-wrap">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                  </svg>
                </button>

                {menuOpen ? (
                  <div className="menu" role="menu">
                    <Link className="menu-item" to={`/tasks/${task.id}/edit`} onClick={() => setMenuOpen(false)}>
                      Edit
                    </Link>
                    <button
                      className="menu-item danger"
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(task);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="badges">
            <div className="d-flex gap-2 flex-wrap">
              <span className={`badge ${priorityBadgeClass}`}>
                {(task.priority || "").toString().toUpperCase()}
              </span>

              <span className={`badge ${statusBadgeClass}`}>
                {statusLabel.toUpperCase()}
              </span>

              {isOverdue ? <span className="badge stm-badge-overdue">Overdue</span> : null}
            </div>
          </div>

          {task.category ? <div className="text-muted small mt-1">Category: {task.category}</div> : null}
          {task.due_date ? (
            <div className="text-muted small d-flex align-items-center gap-1 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h.5A1.5 1.5 0 0 1 15 2.5v11A1.5 1.5 0 0 1 13.5 15h-11A1.5 1.5 0 0 1 1 13.5v-11A1.5 1.5 0 0 1 2.5 1H3V.5a.5.5 0 0 1 .5-.5zM2.5 2A.5.5 0 0 0 2 2.5V4h12V2.5a.5.5 0 0 0-.5-.5h-11z" />
              </svg>
              <span>Due: {task.due_date}</span>
            </div>
          ) : null}
          {task.description ? <div className="stm-task-desc mt-2">{task.description}</div> : null}

          <div className="task-footer">
            <button type="button" className={primaryAction.className} onClick={primaryAction.onClick}>
              <span className="me-2" aria-hidden="true">
                {primaryAction.icon}
              </span>
              {primaryAction.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
