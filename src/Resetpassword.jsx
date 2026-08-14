import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

export default function ResetPassword() {

  const navigate = useNavigate();

  const [newPassword, setNewPassword] =
    useState("");

  const email =
    sessionStorage.getItem("resetEmail");

  const otp =
    sessionStorage.getItem("resetOtp");

  const resetPassword = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(
        "/resetPassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            otp,
            newPassword
          })
        }
      );

      const data = await res.json();

      alert(data.message);

      if (
        data.message ===
        "Password Updated Successfully"
      ) {

        sessionStorage.removeItem(
          "resetEmail"
        );

        sessionStorage.removeItem(
          "resetOtp"
        );

        navigate("/");
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

          <h2>Reset Password</h2>

          <p>
            Enter your new password
          </p>

          <form onSubmit={resetPassword}>

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              required
            />

            <button type="submit">
              Update Password
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}