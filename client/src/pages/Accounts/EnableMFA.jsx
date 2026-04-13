import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { fetchMfaQr } from "../../store/slices/authSlice";
import "react-toastify/dist/ReactToastify.css";

const EnableMFA = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get data from Redux
  const { qrImage, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only fetch if we don't already have a QR image
    if (!qrImage) {
      dispatch(fetchMfaQr());
    }
  }, [dispatch, qrImage]);

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light p-3">
      <div className="card shadow border-0 p-4 w-100" style={{ maxWidth: "420px" }}>
        <h4 className="text-center mb-3 fw-bold">Two-Factor Auth</h4>

        <div className="text-center mb-3">
          {loading ? (
            <div className="d-flex flex-column align-items-center py-4">
              <div className="spinner-border text-primary mb-2" role="status"></div>
              <p className="small text-muted">Generating QR Code...</p>
            </div>
          ) : qrImage ? (
            <img
              src={qrImage}
              alt="QR Code"
              className="img-fluid border p-2 bg-white"
              style={{ width: "220px", height: "220px", borderRadius: "8px" }}
            />
          ) : (
            <p className="text-danger">Failed to load QR. Please refresh.</p>
          )}
        </div>

        <div className="alert alert-info py-2 small text-center mb-4">
          Scan this code with <strong>Google Authenticator</strong> or Authy, then enter the 6-digit code on the next page.
        </div>

        <button
          className="btn btn-primary btn-lg w-100 shadow-sm"
          onClick={() => navigate("/verify_mfa")}
          disabled={!qrImage || loading}
        >
          Go to Verify MFA
        </button>

        <button 
          className="btn btn-link btn-sm w-100 mt-3 text-decoration-none"
          onClick={() => navigate("/settings")} // Or wherever your back button goes
        >
          Cancel
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default EnableMFA;