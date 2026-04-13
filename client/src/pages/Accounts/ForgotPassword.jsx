import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux"; // Added
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { forgotPassword } from "../../store/slices/authSlice"; // Added
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth); 

  const handleSubmit = async (e) => {
    e.preventDefault();

    const resultAction = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(resultAction)) {
      toast.success("If the email exists, a reset link has been sent", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => navigate("/login"), 1500);
    } else {
      toast.error(resultAction.payload || "Something went wrong", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "100%", maxWidth: "400px" }}>
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

          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
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