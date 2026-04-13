import React, { useState, useRef } from "react";
import { api } from "../../services/api";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", ""]); 
  const [resendLoading, setResendLoading] = useState(false);
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < otp.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 4) {
      toast.error("Please enter all 4 digits", { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      const res = await api.post("/accounts/verify_otp/", { email, otp: otpCode });
      toast.success(res.data.message, { position: "top-right", autoClose: 3000 });
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      let message = "Something went wrong";
      if (err.response?.data) {
        message = Object.values(err.response.data).flat().join(", ");
      }
      toast.error(message, { position: "top-right", autoClose: 5000 });
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const res = await api.post("/accounts/resend_otp/", { email });
      toast.success(res.data.message || "OTP resent successfully", { position: "top-right", autoClose: 3000 });
      setOtp(["", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (err) {
      let message = "Failed to resend OTP";
      if (err.response?.data) {
        message = Object.values(err.response.data).flat().join(", ");
      }
      toast.error(message, { position: "top-right", autoClose: 5000 });
    }
    setResendLoading(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4 text-center" style={{ width: "400px" }}>
        <h3 className="card-title mb-4">Verify OTP</h3>
        <p>OTP sent to: <strong>{email}</strong></p>

        <form onSubmit={handleSubmit}>
          <div className="d-flex justify-content-between mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="form-control text-center mx-1"
                style={{ width: "60px", fontSize: "1.5rem" }}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => (inputsRef.current[index] = el)}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Verify OTP
          </button>
        </form>

        <div className="mt-3">
          <small>
            Didn't receive OTP?{" "}
            <button
              className="btn btn-link p-0"
              disabled={resendLoading}
              onClick={handleResendOTP}
            >
              {resendLoading ? "Resending..." : "Resend"}
            </button>
          </small>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default VerifyOTP;