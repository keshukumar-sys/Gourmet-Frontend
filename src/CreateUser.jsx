import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import "./Admin.css";

/**
 * Account creation for the admin console.
 * `role` decides whether this creates a staff account or another admin —
 * the backend takes it on POST /users/create.
 */
export default function CreateAccount({ role = "user" }) {
  const navigate = useNavigate();
  const toast = useToast();

  const isAdminForm = role === "admin";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submitForm = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Name, email and password are all required.");
      return;
    }

    if (password.length < 6) {
      toast.error("Use a password of at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users/create", {
        name: name.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password,
        role
      });

      toast.success(`${isAdminForm ? "Admin" : "User"} created successfully.`);
      navigate("/allUsers");
    } catch (err) {
      toast.error(errorMessage(err, "Could not create the account"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card sc-fade-in">
        <div className="auth-brand">
          <h1>{isAdminForm ? "New Admin" : "New User"}</h1>
          <p>Social Catering</p>
        </div>

        <h2>Create an account</h2>
        <p className="auth-sub">
          {isAdminForm
            ? "Admins can manage every event, template and account."
            : "Staff accounts can create and manage their own events."}
        </p>

        <form onSubmit={submitForm}>
          <div className="sc-field">
            <label htmlFor="ca-name">Full name</label>
            <input
              id="ca-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label htmlFor="ca-email">Email</label>
            <input
              id="ca-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label htmlFor="ca-mobile">Mobile number</label>
            <input
              id="ca-mobile"
              type="tel"
              inputMode="numeric"
              value={mobileNumber}
              onChange={(e) => {
                const v = e.target.value;
                if (/^\d*$/.test(v)) setMobileNumber(v.slice(0, 10));
              }}
              placeholder="10-digit number"
            />
          </div>

          <div className="sc-field" style={{ marginTop: "1rem" }}>
            <label htmlFor="ca-password">Password</label>
            <input
              id="ca-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="sc-btn sc-btn--block" style={{ marginTop: "1.75rem" }} disabled={loading}>
            {loading ? "Creating…" : `Create ${isAdminForm ? "admin" : "user"}`}
          </button>

          <p className="auth-links">
            <NavLink to="/allUsers">← Back to all users</NavLink>
          </p>
        </form>
      </div>
    </div>
  );
}
