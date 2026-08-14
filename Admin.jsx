import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export default function Admin() {

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitForm = (e) => {
    e.preventDefault();

    if (email === "admin@gmail.com" && password === "admin") {
      alert("Admin Login Successful");
      navigate("/menucardgenerator");

      setEmail("");
      setPassword("");
    } else {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="admin-container">

      <div className="admin-card">

        {/* LEFT SIDE FORM */}
        <div className="admin-form">
          <h1 className="logo">Admin Panel</h1>
          <h2>Welcome Admin</h2>
          <p>Please login to continue</p>

          <form onSubmit={submitForm}>

            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />

            <button type="submit">Login</button>

          </form>
        </div>

        {/* RIGHT IMAGE */}
        <div className="admin-image">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d"
            alt="admin"
          />
        </div>

      </div>

    </div>
  );
}