import React, { useState } from "react";
import { api } from "../services/api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/accounts/forgot_pass/", { email });

      toast.success("If the email exists, a reset link has been sent", {
        position: "top-right",
        autoClose: 3000,
      });

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error("Something went wrong", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">Forgot Password</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary w-100">
            Send Reset Link
          </button>
        </form>

        <div className="mt-3 text-center">
          <small>
            Remember your password?{" "}
            <span
              style={{ color: "#0d6efd", cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </small>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ForgotPassword;