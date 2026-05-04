import React, { useEffect, useRef } from "react"; // Added useRef to prevent double-execution
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../../services/api";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const hasCalledAPI = useRef(false); // StrictMode often triggers useEffect twice

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code && !hasCalledAPI.current) {
      hasCalledAPI.current = true;
      
      api
        .post("/accounts/google_login/", { code })
        .then((res) => {
          // IMPORTANT: Do NOT manually set localStorage for access/refresh tokens.
          // Your backend 'set_auth_cookies' handles this via HttpOnly cookies.

          toast.success("Logged in with Google!");
          
          // Small delay to let the cookie settle and show the toast
          setTimeout(() => {
            navigate("/");
          }, 500);
        })
        .catch((err) => {
          console.error("Google Auth Error:", err.response?.data || err.message);
          toast.error("Google login failed!");
          navigate("/login");
        });
    }
  }, [navigate]);

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary mb-3" role="status"></div>
      <h3>Verifying Google Account...</h3>
    </div>
  );
};

export default GoogleCallback;