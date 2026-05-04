import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { ToastContainer, toast } from "react-toastify";
import { registerUser } from "../../store/slices/authSlice";
import "react-toastify/dist/ReactToastify.css";

const UserRegister = () => {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirm_password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get loading state from auth slice to disable button during request
  const { loading } = useSelector((state) => state.auth);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side check before hitting the API
    if (form.password !== form.confirm_password) {
      return toast.error("Passwords do not match");
    }

    // Dispatch the registration thunk
    const resultAction = await dispatch(registerUser(form));

    if (registerUser.fulfilled.match(resultAction)) {
      toast.success(resultAction.payload.message || "Registration successful!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Navigate to OTP page, passing email for the next step
      setTimeout(() => {
        navigate("/verify-otp", { state: { email: form.email } });
      }, 1000);
    } else {
      // Logic to handle Django error objects or strings
      const errorData = resultAction.payload;
      let message = "Registration failed";
      
      if (typeof errorData === 'object' && errorData !== null) {
        message = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join(" | ");
      } else if (typeof errorData === 'string') {
        message = errorData;
      }

      toast.error(message, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleGoogleLogin = () => {
    const clientId = "113584658101-1mcdiqv8vaqtqnlp9ftr952gdr415q2d.apps.googleusercontent.com";
    const redirectUri = "http://localhost:5173/google/callback";
    const scope = "email profile";
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = googleUrl;
  };

  return (
    // Use container-fluid and min-vh-100 for proper centering on all devices
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light p-3">
      {/* Responsive card: 100% width on small screens, max 400px on large */}
      <div className="card shadow border-0 p-4 w-100" style={{ maxWidth: "400px" }}>
        <h3 className="text-center mb-4 fw-bold">User Registration</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">Confirm Password</label>
            <input
              type="password"
              name="confirm_password"
              className="form-control"
              placeholder="Confirm your password"
              value={form.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 shadow-sm"
            disabled={loading} // Disable button while loading
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : null}
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <small className="text-muted">
            Already have an account?{" "}
            <span 
              className="text-primary fw-bold" 
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              Login here
            </span>
          </small>
        </div>

        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="px-2 text-muted small">OR</span>
          <hr className="flex-grow-1" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center py-2"
          style={{ borderRadius: "6px", fontWeight: "500" }}
        >
          <FcGoogle size={22} style={{ marginRight: "10px" }} />
          Continue with Google
        </button>
      </div>

      <ToastContainer />
    </div>
  );
};

export default UserRegister;