import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout, isAuthenticated } from "../auth/authService";
import ConfirmModal from "./ConfirmModal";

function Navbar({ notifications }) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenSig, setSeenSig] = useState("");
  const [authed, setAuthed] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      const v = window.localStorage.getItem("stm_theme_v1");
      if (v === "light" || v === "dark") return v;
    } catch {
      // ignore
    }
    return "light";
  });
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    // Check authentication status
    const currentAuth = isAuthenticated();
    setAuthed(currentAuth);

    const onAuthChanged = () => {
      setAuthed(isAuthenticated());
    };
    window.addEventListener("stm_auth_changed", onAuthChanged);
    return () => window.removeEventListener("stm_auth_changed", onAuthChanged);
  }, []);

  const notifItems = useMemo(() => {
    const overdue = notifications?.overdue ?? 0;
    const dueTomorrow = notifications?.dueTomorrow ?? 0;
    const suggestions = Array.isArray(notifications?.suggestions) ? notifications.suggestions : [];

    const items = [];
    const seen = new Set();
    const add = (key, item) => {
      const k = (key || "").toString().trim().toLowerCase();
      if (!k) return;
      if (seen.has(k)) return;
      seen.add(k);
      items.push({ ...item, key: k });
    };

    if (overdue) {
      add(`overdue:${overdue}`, { type: "overdue", label: "Overdue", variant: "danger", text: `${overdue} task(s) need attention` });
    }
    if (dueTomorrow) {
      add(`dueTomorrow:${dueTomorrow}`, { type: "dueTomorrow", label: "Due Tomorrow", variant: "warning", text: `${dueTomorrow} task(s)` });
    }

    const normalizedSuggestions = suggestions
      .map((s) => (s || "").toString().trim())
      .filter(Boolean)
      .filter((s) => {
        const x = s.toLowerCase();
        if (dueTomorrow && x.includes("due tomorrow")) return false;
        if (overdue && x.includes("overdue")) return false;
        return true;
      });

    for (const s of normalizedSuggestions) {
      add(`smart:${s}`, { type: "smart", label: "Smart", variant: "primary", text: s });
    }

    return items;
  }, [notifications]);

  const notifSig = useMemo(() => notifItems.map((i) => i.key).sort().join("|"), [notifItems]);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem("stm_notif_seen_v1") || "";
      setSeenSig(v);
    } catch {
      setSeenSig("");
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("stm_theme_v1", theme);
    } catch {
      // ignore
    }
    try {
      document.documentElement.setAttribute("data-bs-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const hasUnseen = Boolean(notifSig) && notifSig !== seenSig;
  const notifCount = hasUnseen ? notifItems.length : 0;

  useEffect(() => {
    if (!notifOpen) return;
    try {
      window.localStorage.setItem("stm_notif_seen_v1", notifSig);
    } catch {
      // ignore
    }
    setSeenSig(notifSig);
  }, [notifOpen, notifSig]);

  const onLogout = () => {
    setNotifOpen(false);
    setNavOpen(false);
    setLogoutConfirmOpen(true);
  };

  const onConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    setNotifOpen(false);
    setNavOpen(false);
    
    // Perform logout actions synchronously to ensure they happen before navigation
    logout();
    setAuthed(false);
    
    // Use setTimeout to ensure the modal is fully closed and state is updated before navigating
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 0);
  };


  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
        <Link className="navbar-brand fw-bold" to={authed ? "/dashboard" : "/"} style={{ color: "#ffc107" }}>
          Smart Task Manager
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
          onClick={() => {
            setNotifOpen(false);
            setNavOpen((v) => !v);
          }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={navOpen ? "navbar-collapse" : "collapse navbar-collapse"}>
          <ul className="navbar-nav me-auto">
            {authed ? (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link text-white"
                    to="/dashboard"
                    onClick={() => {
                      setNotifOpen(false);
                      setNavOpen(false);
                    }}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link text-white"
                    to="/tasks/new"
                    onClick={() => {
                      setNotifOpen(false);
                      setNavOpen(false);
                    }}
                  >
                    Add Task
                  </Link>
                </li>
              </>
            ) : null}
          </ul>

          <div className="d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center">
            {authed ? (
              <>
                <button
                  type="button"
                  className={theme === "dark" ? "btn btn-outline-light" : "btn btn-outline-warning"}
                  aria-label="Toggle theme"
                  onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06.752-.183 6.004.278 6 .278z" />
                      </svg>
                      <span>Dark</span>
                    </span>
                  ) : (
                    <span className="d-inline-flex align-items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        <path d="M8 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 0zm0 13.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5zM16 8a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1A.5.5 0 0 1 16 8zM2.5 8a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 1 .5.5zM13.657 2.343a.5.5 0 0 1 0 .707l-.707.707a.5.5 0 0 1-.707-.707l.707-.707a.5.5 0 0 1 .707 0zM4.464 11.536a.5.5 0 0 1 0 .707l-.707.707a.5.5 0 0 1-.707-.707l.707-.707a.5.5 0 0 1 .707 0zM13.657 13.657a.5.5 0 0 1-.707 0l-.707-.707a.5.5 0 0 1 .707-.707l.707.707a.5.5 0 0 1 0 .707zM4.464 4.464a.5.5 0 0 1-.707 0L3.05 3.757a.5.5 0 1 1 .707-.707l.707.707a.5.5 0 0 1 0 .707z" />
                      </svg>
                      <span>Light</span>
                    </span>
                  )}
                </button>

                <div className="position-relative">
                  <button
                    type="button"
                    className="btn btn-outline-light position-relative"
                    aria-label="Notifications"
                    aria-expanded={notifOpen}
                    onClick={() => setNotifOpen((v) => !v)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 6h14c-1.5 0-2-4.902-2-6a5.002 5.002 0 0 0-4.005-4.901z"/>
                    </svg>
                    {notifCount ? (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger">
                        {notifCount}
                      </span>
                    ) : null}
                  </button>

                  {notifOpen ? (
                    <div
                      className="dropdown-menu dropdown-menu-end show p-2"
                      style={{ minWidth: 260, right: 0, left: "auto" }}
                    >
                      <div className="fw-semibold px-2 py-1">Notifications</div>
                      <div className="dropdown-divider" />

                      {notifItems.map((item, idx) => (
                        <div key={`${item.type}-${idx}`} className="px-2 py-1 small">
                          <span className={`badge text-bg-${item.variant} me-2`}>{item.label}</span>
                          {item.text}
                        </div>
                      ))}

                      {!notifCount ? <div className="px-2 py-2 text-muted small">No notifications</div> : null}
                    </div>
                  ) : null}
                </div>

                <button className="btn btn-outline-light" onClick={onLogout} type="button" style={{ width: "auto" }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={theme === "dark" ? "btn btn-outline-light" : "btn btn-outline-warning"}
                  aria-label="Toggle theme"
                  onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? "Dark" : "Light"}
                </button>
                <Link className="btn btn-outline-light" to="/login">
                  Login
                </Link>
                <Link className="btn btn-primary" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
        </div>
      </nav>

      <ConfirmModal
        show={logoutConfirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        onConfirm={onConfirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}

export default Navbar;
