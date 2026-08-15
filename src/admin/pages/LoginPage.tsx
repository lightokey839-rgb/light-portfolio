import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { ApiError } from "../../lib/api/client";
import "./LoginPage.css";

export default function LoginPage() {
  const { status, login } = useAdminAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in — bounce straight to the dashboard (or wherever
  // ProtectedRoute originally sent them from).
  if (status === "authenticated") {
    const from = (location.state as { from?: string } | null)?.from ?? "/admin";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_CREDENTIALS") {
        setError("Invalid email or password.");
      } else if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else {
        setError("Couldn't log in right now. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__panel terminal glass">
        <div className="terminal__bar">
          <span className="terminal__dot terminal__dot--red" />
          <span className="terminal__dot terminal__dot--yellow" />
          <span className="terminal__dot terminal__dot--green" />
          <span className="terminal__title">admin-login.sh</span>
        </div>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          <p className="admin-login__prompt">
            <span className="terminal__prompt">$</span> authenticate --admin
          </p>

          <label className="admin-login__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </label>

          <label className="admin-login__field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="admin-login__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
