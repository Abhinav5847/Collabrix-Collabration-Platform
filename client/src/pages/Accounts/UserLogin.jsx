import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { ToastContainer, toast } from "react-toastify";
import { loginUser, clearError } from "../../store/slices/authSlice";
import sendFCMTokenToBackend from "../../utils/fcm";
import "react-toastify/dist/ReactToastify.css";

const UserLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({}); 
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({}); 

    const resultAction = await dispatch(loginUser(form));

    if (loginUser.fulfilled.match(resultAction)) {
      toast.success("Welcome back!");
      
      // Extract user data directly from the payload
      const userData = resultAction.payload.user || resultAction.payload;

      try {
        await sendFCMTokenToBackend(); 
      } catch (err) {
        console.error("FCM failed:", err);
      }

      // Navigate immediately based on staff status
      if (userData.is_staff) {
        navigate("/collabrix_admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } else {
      const errorData = resultAction.payload;
      if (typeof errorData === 'object' && errorData !== null) {
        const globalMsg = errorData.non_field_errors || errorData.detail || errorData.error;
        if (globalMsg) {
          toast.error(Array.isArray(globalMsg) ? globalMsg[0] : globalMsg);
        }
        setFieldErrors(errorData);
      } else {
        toast.error("An unexpected server error occurred.");
      }
    }
  };

  const handleGoogleLogin = () => {
    const clientId = "113584658101-1mcdiqv8vaqtqnlp9ftr952gdr415q2d.apps.googleusercontent.com";
    const redirectUri = "http://127.0.0.1:4000/google/callback";
    const scope = "email profile";
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = googleUrl; 
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="card shadow-sm p-4 border-0" style={{ width: "420px", borderRadius: "12px" }}>
        <h3 className="text-center mb-4 fw-bold text-dark">Login</h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              className={`form-control py-2 ${fieldErrors.email ? "is-invalid" : ""}`}
              value={form.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && (
              <div className="invalid-feedback">{Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}</div>
            )}
          </div>

          <div className="mb-1">
            <label className="form-label small fw-bold text-muted">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              className={`form-control py-2 ${fieldErrors.password ? "is-invalid" : ""}`}
              value={form.password}
              onChange={handleChange}
              required
            />
            {fieldErrors.password && (
              <div className="invalid-feedback">{Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password}</div>
            )}
          </div>

          <div className="d-flex justify-content-end mb-4">
            <button type="button" className="btn btn-link p-0 text-decoration-none small fw-semibold" onClick={() => navigate("/forgot_password")}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : "Sign In"}
          </button>
        </form>

        <div className="d-flex align-items-center my-4">
          <hr className="flex-grow-1 text-muted" />
          <span className="px-3 text-muted x-small fw-bold">OR</span>
          <hr className="flex-grow-1 text-muted" />
        </div>

        <button type="button" className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center py-2 fw-semibold" onClick={handleGoogleLogin}>
          <FcGoogle className="me-2" size={22} /> Google
        </button>

        <p className="mt-4 text-center text-muted small">
          New to Collabrix?{" "}
          <button className="btn btn-link p-0 fw-bold text-decoration-none" onClick={() => navigate("/register")}>
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;