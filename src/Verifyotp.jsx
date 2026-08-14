import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

export default function VerifyOtp() {

  const navigate = useNavigate();

  const [otp, setOtp] = useState("");

  const email = sessionStorage.getItem("resetEmail");

  const verifyOtp = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(
        "/verifyOtp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            otp
          })
        }
      );

      const data = await res.json();

      alert(data.message);

      if (
        data.message === "OTP Verified Successfully" ||
        data.message === "OTP Verified"
      ) {

        sessionStorage.setItem(
          "resetOtp",
          otp
        );

        navigate("/resetPassword");
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

          <h2>Verify OTP</h2>

          <p>
            Enter the OTP sent to your email
          </p>

          <form onSubmit={verifyOtp}>

            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value)
              }
              required
            />

            <button type="submit">
              Verify OTP
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}