import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import "./Admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("adminToken")) {
      navigate("/allEvents", { replace: true });
    }
  }, [navigate]);

  const submitForm = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/login", { email, password });
      const { token, user } = res.data;

      if (!token) {
        toast.error(res.data.message || "Login failed");
        return;
      }

      // One login endpoint serves both roles; the role decides where you land.
      if (user?.role !== "admin") {
        toast.error("This account is not an admin. Use the staff login instead.");
        return;
      }

      sessionStorage.setItem("adminToken", token);
      sessionStorage.removeItem("userToken");
      navigate("/allEvents", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card sc-fade-in">
        <div className="auth-brand">
          <h1>Admin Panel</h1>
          <p>Social Catering</p>
        </div>

        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to manage events and templates.</p>

        <form onSubmit={submitForm}>
          <div className="sc-field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="sc-btn sc-btn--block" style={{ marginTop: "1.75rem" }} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
