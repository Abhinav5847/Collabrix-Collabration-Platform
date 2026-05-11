import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux"; // Import useDispatch
import { toast } from "react-toastify";
import { googleLogin } from "../../store/slices/authSlice"; // Import your thunk

const GoogleCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code && !hasCalledAPI.current) {
      hasCalledAPI.current = true;
      
      // Dispatch the thunk instead of a raw API call
      dispatch(googleLogin(code))
        .unwrap() // Allows us to use .then()/.catch() on the result
        .then((userData) => {
          toast.success("Logged in with Google!");
          
          // Use your staff logic if applicable
          if (userData.is_staff) {
            navigate("/collabrix_admin", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        })
        .catch((err) => {
          console.error("Google Auth Error:", err);
          toast.error(typeof err === 'string' ? err : "Google login failed!");
          navigate("/login");
        });
    }
  }, [dispatch, navigate]);

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary mb-3" role="status"></div>
      <h3 className="fw-light">Verifying Google Account...</h3>
    </div>
  );
};

export default GoogleCallback;