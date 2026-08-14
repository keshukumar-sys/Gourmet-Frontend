import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

export default function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const sendOtp = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(
        "/sendOtp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email
          })
        }
      );

      const data = await res.json();

      alert(data.message);

      if (data.message === "OTP Sent Successfully") {

        sessionStorage.setItem(
          "resetEmail",
          email
        );

        navigate("/verifyOtp");
      }

    } catch (err) {

      console.log(err);
      alert("Something went wrong");

    }
  };

  return (
    <div className="forgot-container">

      <div className="forgot-card">

        <div className="forgot-form">

          <h2>Forgot Password</h2>

          <p>Enter your registered email address</p>

          <form onSubmit={sendOtp}>

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit">
              Send OTP
            </button>

          </form>

          <p className="back-login">
            Remember Password?
            <NavLink to="/"> Login</NavLink>
          </p>

        </div>

      </div>

    </div>
  );
}