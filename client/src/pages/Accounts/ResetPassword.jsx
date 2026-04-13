import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; 
import { toast, ToastContainer } from "react-toastify";
import { resetPassword } from "../../store/slices/authSlice"; 
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const resultAction = await dispatch(
      resetPassword({ uid, token, password: form.password })
    );

    if (resetPassword.fulfilled.match(resultAction)) {
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      const errorData = resultAction.payload;
      let message = "Invalid or expired link";
      
      if (typeof errorData === "object" && errorData !== null) {
        message = Object.values(errorData).flat().join(", ");
      } else if (typeof errorData === "string") {
        message = errorData;
      }
      
      toast.error(message);
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4 w-100" style={{ maxWidth: "400px" }}>
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
                  color: form.password === form.confirmPassword ? "green" : "red",
                }}
              >
                {form.password === form.confirmPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </small>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
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