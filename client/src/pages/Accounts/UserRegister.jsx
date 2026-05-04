import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { ToastContainer, toast } from "react-toastify";
import { registerUser, clearError } from "../../store/slices/authSlice";
import "react-toastify/dist/ReactToastify.css";

const UserRegister = () => {
  const [form, setForm] = useState({ email: "", username: "", password: "", confirm_password: "" });
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

    const resultAction = await dispatch(registerUser(form));

    if (registerUser.fulfilled.match(resultAction)) {
      toast.success("Registration successful!");
      setTimeout(() => navigate("/verify-otp", { state: { email: form.email } }), 1000);
    } else {
      const errorData = resultAction.payload;
      if (typeof errorData === 'object' && errorData !== null) {
        // Global error handling
        const globalMsg = errorData.non_field_errors || errorData.detail || errorData.error;
        if (globalMsg) {
          toast.error(Array.isArray(globalMsg) ? globalMsg[0] : globalMsg);
        }
        // Field error handling
        setFieldErrors(errorData);
      } else {
        toast.error("An unexpected server error occurred.");
      }
    }
  };

  // MATCHED LOGIC FROM LOGIN
  const handleGoogleLogin = () => {
    const clientId = "113584658101-1mcdiqv8vaqtqnlp9ftr952gdr415q2d.apps.googleusercontent.com";
    const redirectUri = "http://127.0.0.1:4000/google/callback";
    const scope = "email profile";
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = googleUrl; 
  };

  const renderInput = (label, name, type = "text", placeholder = "") => (
    <div className="mb-3">
      <label className="form-label small fw-bold text-muted">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className={`form-control py-2 ${fieldErrors[name] ? "is-invalid" : ""}`}
        value={form[name]}
        onChange={handleChange}
        required
      />
      {fieldErrors[name] && (
        <div className="invalid-feedback">
          {Array.isArray(fieldErrors[name]) ? fieldErrors[name][0] : fieldErrors[name]}
        </div>
      )}
    </div>
  );

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm p-4 border-0" style={{ width: "420px", borderRadius: "12px" }}>
        <h3 className="text-center mb-4 fw-bold text-dark">Join Collabrix</h3>
        
        <form onSubmit={handleSubmit} noValidate>
          {renderInput("Email Address", "email", "email", "name@company.com")}
          {renderInput("Username", "username", "text", "johndoe")}
          {renderInput("Password", "password", "password", "••••••••")}
          {renderInput("Confirm Password", "confirm_password", "password", "••••••••")}

          <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm mt-2" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : "Create Account"}
          </button>
        </form>

        <div className="d-flex align-items-center my-4">
          <hr className="flex-grow-1 text-muted" />
          <span className="px-3 text-muted x-small fw-bold">OR CONTINUE WITH</span>
          <hr className="flex-grow-1 text-muted" />
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center py-2 fw-semibold"
          onClick={handleGoogleLogin}
        >
          <FcGoogle className="me-2" size={22} /> Google
        </button>

        <p className="mt-4 text-center text-muted small">
          Already have an account?{" "}
          <button
            className="btn btn-link p-0 fw-bold text-decoration-none"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </p>
      </div>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar />
    </div>
  );
};

export default UserRegister;