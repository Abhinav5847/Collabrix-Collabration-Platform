import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { verifyMfa } from "../../store/slices/authSlice"; // Changed from verifyOtp to verifyMfa
import "react-toastify/dist/ReactToastify.css";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const email = location.state?.email || "";
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
      toast.success(resultAction.payload.message || "MFA Verified!");
      setTimeout(() => navigate("/"), 1500);
    } else {
      const errorData = resultAction.payload;
      let message = "Invalid Code";

      if (typeof errorData === 'string') {
        message = errorData;
      } else if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.error) {
          message = typeof errorData.error === 'object' 
            ? Object.values(errorData.error).flat().join(", ") 
            : errorData.error;
        } else {
          message = Object.values(errorData).flat().join(", ");
        }
      }
      
      toast.error(message);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100 bg-light p-3">
      <div className="card shadow border-0 p-4 text-center w-100" style={{ maxWidth: "500px" }}>
        <h3 className="card-title mb-2 fw-bold">MFA Verification</h3>
        <p className="text-muted small mb-4">
          Enter the 6-digit code from your Authenticator app for <br />
          <span className="text-dark fw-bold">{email}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="d-flex justify-content-center mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="form-control text-center mx-1 fw-bold shadow-sm"
                style={{ width: "50px", height: "60px", fontSize: "1.5rem" }}
                value={digit}
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
            className="btn btn-primary btn-lg w-100 shadow-sm mb-3" 
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : null}
            Verify Code
          </button>

          <button 
            type="button" 
            className="btn btn-outline-secondary w-100" 
            onClick={handleGoBack}
            disabled={loading}
          >
            Back to Scanner
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default VerifyOTP;