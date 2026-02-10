import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import { forgotPassword } from "../auth/authService";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSuccess("If an account exists for this email, a reset link has been sent.");
    } catch (err) {
      setError("Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5" style={{ maxWidth: 560 }}>
        <h2 className="mb-2">Forgot Password</h2>
        <div className="text-muted mb-3">Enter your email to receive a reset link.</div>

        {error ? <div className="alert alert-danger">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}

        <form className="card card-body" onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>

          <div className="mt-3">
            <Link to="/login">Back to login</Link>
          </div>
        </form>

        <div className="text-muted small mt-3">
          <strong>Dev mode:</strong> The reset link will appear in the Django terminal console. Copy the link and open it in your browser.
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;
