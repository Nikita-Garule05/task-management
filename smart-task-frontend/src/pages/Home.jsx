import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";

function Home() {
  return (
    <>
      <Navbar />
      <div className="stm-hero">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <div className="badge bg-dark-subtle text-dark mb-3">Django + React • JWT Auth • Smart Features</div>
              <h1 className="display-5 fw-bold mb-3">Smart Task Management</h1>
              <p className="lead text-muted mb-4">
                Plan, prioritize, and finish tasks faster with a clean dashboard, important pinning, overdue indicators,
                and analytics.
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <Link className="btn btn-primary btn-lg" to="/login">
                  Get Started
                </Link>
                <Link className="btn btn-outline-dark btn-lg" to="/register">
                  Create Account
                </Link>
              </div>
              <div className="text-muted small mt-3">
                Tip: Add a due date to get an automatic priority suggestion.
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="fw-semibold mb-3">What you get</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="p-3 rounded-3 bg-light">
                        <div className="fw-semibold">Secure Authentication</div>
                        <div className="text-muted small">JWT login + protected routes for your data.</div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="p-3 rounded-3 bg-light">
                        <div className="fw-semibold">Smart Visibility</div>
                        <div className="text-muted small">Important pinning, overdue badges, and quick filters.</div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="p-3 rounded-3 bg-light">
                        <div className="fw-semibold">Analytics</div>
                        <div className="text-muted small">Track pending, in-progress, overdue and due-soon tasks.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-5">
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="fw-semibold mb-1">Priority + Due Dates</div>
                  <div className="text-muted small">Sort tasks, detect urgent items, and keep deadlines visible.</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="fw-semibold mb-1">Status Workflow</div>
                  <div className="text-muted small">Move tasks between Pending, In Progress, and Completed.</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="fw-semibold mb-1">Fast Actions</div>
                  <div className="text-muted small">Pin, mark done, edit or delete directly from the cards.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
