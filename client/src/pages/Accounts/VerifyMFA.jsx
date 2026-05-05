import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyMfa, fetchUserProfile } from "../../store/slices/authSlice"; 

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const email = location.state?.email || "your account";
  const { loading } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length < 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    const resultAction = await dispatch(verifyMfa(otpCode));

    if (verifyMfa.fulfilled.match(resultAction)) {
      toast.success("MFA Enabled Successfully!");
      
      // Re-fetch profile to ensure all state flags (mfa_enabled) are fresh
      await dispatch(fetchUserProfile());
      
      // Redirect to profile after a short delay
      setTimeout(() => navigate("/profile"), 1000);
    } else {
      const message = resultAction.payload?.error || "Invalid Code";
      toast.error(message);
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg border-0 p-4 text-center" style={{ maxWidth: "450px" }}>
        <div className="mb-3">
          <i className="bi bi-shield-check text-primary" style={{ fontSize: "3rem" }}></i>
        </div>
        <h3 className="fw-bold">Verify MFA</h3>
        <p className="text-muted mb-4">
          Enter the 6-digit code from your Authenticator app for <br/>
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="d-flex justify-content-between mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                className="form-control text-center mx-1 fw-bold"
                style={{ width: "45px", height: "55px", fontSize: "1.2rem" }}
                value={digit}
                maxLength="1"
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => (inputsRef.current[index] = el)}
                autoFocus={index === 0}
                required
              />
            ))}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 mb-3" 
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : "Confirm & Enable"}
          </button>

          <button 
            type="button" 
            className="btn btn-link text-decoration-none text-muted" 
            onClick={() => navigate(-1)}
          >
            Back to QR Code
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;