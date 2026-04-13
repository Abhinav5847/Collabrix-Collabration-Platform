import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux"; // Added
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { ToastContainer, toast } from "react-toastify";
import { loginUser } from "../../store/slices/authSlice"; // Added
import "react-toastify/dist/ReactToastify.css";

const UserLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading } = useSelector((state) => state.auth);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const resultAction = await dispatch(loginUser(form));

    if (loginUser.fulfilled.match(resultAction)) {
      toast.success("Login Successful!", {
        position: "top-right",
        autoClose: 2000,
      });
      setTimeout(() => navigate("/"), 1000);
    } else {
      const message = resultAction.payload || "Something went wrong";
      
      const formattedMessage = typeof message === 'object' 
        ? Object.values(message).flat().join(", ") 
        : message;

      toast.error(formattedMessage, {
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
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">User Login</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
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

          <div className="mb-2">
            <label className="form-label">Password</label>
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

          <div className="d-flex justify-content-end mb-3">
            <button
              type="button"
              onClick={() => navigate("/forgot_password")}
              style={{
                background: "none",
                border: "none",
                color: "#0d6efd",
                fontSize: "0.9rem",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading} // Uses Redux loading state
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <small>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{ color: "#0d6efd", cursor: "pointer" }}
            >
              Register here
            </span>
          </small>
        </div>

        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="px-2 text-muted">OR</span>
          <hr className="flex-grow-1" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-100 d-flex align-items-center justify-content-center"
          style={{
            padding: "10px",
            backgroundColor: "#fff",
            border: "1px solid #dadce0",
            borderRadius: "6px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f7f7f7")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
        >
          <FcGoogle size={22} style={{ marginRight: "10px" }} />
          Continue with Google
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserLogin;