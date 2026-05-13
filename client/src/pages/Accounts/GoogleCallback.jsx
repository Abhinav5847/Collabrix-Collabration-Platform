import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { googleLogin, fetchUserProfile } from "../../store/slices/authSlice"; // Added fetchUserProfile
import sendFCMTokenToBackend from "../../utils/fcm"; // Added FCM utility

const GoogleCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code && !hasCalledAPI.current) {
      hasCalledAPI.current = true;
      
      dispatch(googleLogin(code))
        .unwrap()
        .then(async (loginData) => {
          try {
            // CRITICAL FIX: Fetch profile to update Redux state (and the Navbar)
            const userData = await dispatch(fetchUserProfile()).unwrap();
            
            toast.success("Logged in with Google!");

            // Optional: Send FCM token just like your normal login
            sendFCMTokenToBackend().catch(err => console.error("FCM failed:", err));

            // Navigation logic
            if (userData?.is_staff) {
              navigate("/collabrix_admin", { replace: true });
            } else {
              navigate("/", { replace: true });
            }
          } catch (profileErr) {
            console.error("Profile Fetch Error:", profileErr);
            navigate("/login");
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
    <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ background: "#0B1120", color: "white" }}>
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <h3 className="fw-light">Verifying Google Account...</h3>
    </div>
  );
};

export default GoogleCallback;