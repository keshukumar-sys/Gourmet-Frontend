import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import "./Admin.css";

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("userToken")) {
      navigate("/events", { replace: true });
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

      // Admins signing in here are sent to their own console.
      if (user?.role === "admin") {
        sessionStorage.setItem("adminToken", token);
        sessionStorage.removeItem("userToken");
        navigate("/allEvents", { replace: true });
        return;
      }

      sessionStorage.setItem("userToken", token);
      sessionStorage.setItem("email", email);
      sessionStorage.removeItem("adminToken");
      navigate("/events", { replace: true });
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
          <h1>Social Catering</h1>
          <p>Event Studio</p>
        </div>

        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in with your email and password.</p>

        <form onSubmit={submitForm}>
          <div className="sc-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
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

          <p className="auth-links">
            <NavLink to="/forgotPassword">Forgot your password?</NavLink>
          </p>
        </form>
      </div>
    </div>
  );
}
