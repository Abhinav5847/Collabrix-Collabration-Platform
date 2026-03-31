import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/accounts/reset_pass/${uid}/${token}/`, {
        password: form.password,
      });

      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      let message = "Invalid or expired link";
      if (err.response?.data) {
        message = Object.values(err.response.data).flat().join(", ");
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">Reset Password</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3 position-relative">
            <label className="form-label">New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-control pe-5"
              placeholder="Enter new password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "38px",
                cursor: "pointer",
                fontSize: "0.9rem",
                color: "#0d6efd",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          <div className="mb-2 position-relative">
            <label className="form-label">Confirm Password</label>
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              className="form-control pe-5"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                right: "10px",
                top: "38px",
                cursor: "pointer",
                fontSize: "0.9rem",
                color: "#0d6efd",
              }}
            >
              {showConfirm ? "Hide" : "Show"}
            </span>
          </div>

          {form.confirmPassword && (
            <div className="mb-3">
              <small
                style={{
                  color:
                    form.password === form.confirmPassword
                      ? "green"
                      : "red",
                }}
              >
                {form.password === form.confirmPassword
                  ? "Passwords match"
                  : "Passwords do not match"}
              </small>
            </div>
          )}


          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <small>
            Back to{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ color: "#0d6efd", cursor: "pointer" }}
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

export default ResetPassword;