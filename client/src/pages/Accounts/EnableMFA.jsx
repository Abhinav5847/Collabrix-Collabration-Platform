import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { fetchMfaQr, fetchUserProfile } from "../../store/slices/authSlice";
import { ShieldCheck, ArrowLeft, Smartphone, CheckCircle, RefreshCw } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const EnableMFA = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get state from Redux
  const { qrImage, loading, user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // 1. If we don't have user data yet, fetch it to check the MFA status from the backend
    if (isAuthenticated && !user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    // 2. ONLY fetch the QR code if the backend confirmed mfa_enabled is FALSE
    // This prevents the QR from generating if the user is already protected
    if (user && user.mfa_enabled === false && !qrImage && !loading) {
      dispatch(fetchMfaQr());
    }
  }, [dispatch, user, qrImage, loading]);

  // --- UI Logic: Loading State ---
  if (loading && !user) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <RefreshCw size={40} className="text-primary animate-spin mb-3" />
          <p className="text-muted fw-medium">Verifying security status...</p>
        </div>
      </div>
    );
  }

  // --- UI Logic: ALREADY ENABLED (The "Mark as Enabled" View) ---
  if (user?.mfa_enabled === true) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light p-3">
        <div className="card shadow-lg border-0 p-4 text-center w-100" style={{ maxWidth: "420px", borderRadius: "20px" }}>
          <div className="mb-4 d-flex justify-content-center">
            <div className="bg-success bg-opacity-10 p-4 rounded-circle">
              <ShieldCheck size={60} className="text-success" />
            </div>
          </div>
          <h3 className="fw-bold text-dark mb-2">MFA is Active</h3>
          <div className="d-inline-flex align-items-center justify-content-center bg-success text-white px-3 py-1 rounded-pill small mb-4">
            <CheckCircle size={14} className="me-2" /> Verified & Secured
          </div>
          <p className="text-muted mb-4 px-2">
            Your account is already protected with Two-Factor Authentication. 
            You don't need to scan a new QR code.
          </p>
          <hr className="my-4 opacity-50" />
          <button 
            className="btn btn-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            onClick={() => navigate("/")}
            style={{ borderRadius: "12px" }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- UI Logic: SETUP REQUIRED (The QR Code View) ---
  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light p-3">
      <div className="card shadow-lg border-0 p-4 w-100" style={{ maxWidth: "420px", borderRadius: "20px" }}>
        <div className="text-center mb-4">
          <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
            <Smartphone size={32} className="text-primary" />
          </div>
          <h4 className="fw-bold text-dark m-0">Enable 2FA</h4>
          <p className="text-muted small mt-1">Protect your account with an Authenticator app</p>
        </div>

        <div className="text-center mb-4">
          {loading ? (
            <div className="py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="small text-muted mt-2">Generating Secure QR...</p>
            </div>
          ) : qrImage ? (
            <div className="bg-white p-3 border rounded-4 shadow-sm d-inline-block">
               <img
                src={qrImage}
                alt="Scan this QR Code"
                className="img-fluid"
                style={{ width: "220px", height: "220px" }}
              />
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-danger small mb-2">Could not retrieve QR code.</p>
              <button className="btn btn-sm btn-outline-primary" onClick={() => dispatch(fetchMfaQr())}>
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="bg-light p-3 rounded-3 border mb-4">
          <p className="small text-dark mb-0" style={{ fontSize: "13px" }}>
            <strong>Step 1:</strong> Open Google Authenticator or Authy.<br />
            <strong>Step 2:</strong> Scan the image above.<br />
            <strong>Step 3:</strong> Click verify to enter your code.
          </p>
        </div>

        <button
          className="btn btn-primary btn-lg w-100 shadow-sm fw-bold mb-3"
          onClick={() => navigate("/verify_mfa")}
          disabled={!qrImage || loading}
          style={{ borderRadius: "12px" }}
        >
          Proceed to Verify
        </button>

        <button 
          className="btn btn-link btn-sm w-100 text-decoration-none text-muted"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
      </div>
      <ToastContainer position="top-center" />
    </div>
  );
};

export default EnableMFA;