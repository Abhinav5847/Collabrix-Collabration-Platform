import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { ToastContainer, toast } from "react-toastify";
import { loginUser, fetchUserProfile, clearError } from "../../store/slices/authSlice";
import sendFCMTokenToBackend from "../../utils/fcm"; 
import "react-toastify/dist/ReactToastify.css";

const UserLogin = () => {
const [form, setForm] = useState({ email: "", password: "" });
const dispatch = useDispatch();
const navigate = useNavigate();

const { loading } = useSelector((state) => state.auth);

useEffect(() => {
dispatch(clearError());
}, [dispatch]);

const handleChange = (e) =>
setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
e.preventDefault();

const resultAction = await dispatch(loginUser(form));

if (loginUser.fulfilled.match(resultAction)) {
  toast.success("Login Successful!");

  // Fetch profile
  const userId = resultAction.payload.user?.id || resultAction.payload.id;
  if (userId) {
    await dispatch(fetchUserProfile(userId));
  }

  // ✅ Get token from localStorage (reliable)
  const accessToken = localStorage.getItem("access");

  // ✅ Send FCM token
  if (accessToken) {
    try {
      await sendFCMTokenToBackend(accessToken);
    } catch (err) {
      console.error("FCM failed:", err);
    }
  }

  setTimeout(() => {
    navigate("/");
  }, 1000);

} else {
  const message = resultAction.payload || "Invalid email or password";
  const errorMsg = typeof message === 'object' 
    ? Object.values(message).flat().join(", ") 
    : message;
  toast.error(errorMsg);
}

};

const handleGoogleLogin = () => {
const clientId = "113584658101-1mcdiqv8vaqtqnlp9ftr952gdr415q2d.apps.googleusercontent.com";
const redirectUri = "http://localhost:5173/google/callback";
const scope = "email profile";
const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
window.location.href = googleUrl;
};

return ( <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
<div className="card shadow p-4" style={{ width: "400px", borderRadius: "8px" }}> <h3 className="text-center mb-4 fw-bold">User Login</h3>

    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label fw-semibold">Email</label>
        <input 
          type="email" 
          name="email" 
          className="form-control" 
          placeholder="Enter email" 
          value={form.email} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="mb-2">
        <label className="form-label fw-semibold">Password</label>
        <input 
          type="password" 
          name="password" 
          className="form-control" 
          placeholder="Enter password" 
          value={form.password} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="d-flex justify-content-end mb-3">
        <button 
          type="button" 
          className="btn btn-link p-0 text-decoration-none" 
          style={{ fontSize: "0.85rem", color: "#0d6efd" }}
          onClick={() => navigate("/forgot_password")}
        >
          Forgot Password?
        </button>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary w-100 py-2 fw-bold" 
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
    
    <div className="d-flex align-items-center my-4">
      <hr className="flex-grow-1" />
      <span className="px-3 text-muted small fw-bold">OR</span>
      <hr className="flex-grow-1" />
    </div>

    <button 
      type="button" 
      className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center py-2" 
      onClick={handleGoogleLogin}
    >
      <FcGoogle className="me-2" size={20} /> Continue with Google
    </button>

    <div className="mt-4 text-center">
      <p className="text-muted small mb-0">
        Don't have an account?{" "}
        <button 
          className="btn btn-link p-0 text-decoration-none fw-bold" 
          onClick={() => navigate("/register")}
        >
          Register here
        </button>
      </p>
    </div>
  </div>

  <ToastContainer position="top-right" autoClose={3000} />
</div>

);
};

export default UserLogin;
