import React, { useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VerifyMFA = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();

    console.log("Sending code:", code);

    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(
        "/accounts/verify_mfa/",
        { code },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      console.log("Response from verify MFA:", res.data);

      toast.success(res.data.message || "Verification successful");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error("Error verifying MFA:", err);

      let message = "Verification failed";
      if (err.response?.data) {
        message = Object.values(err.response.data).flat().join(", ");
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h4 className="text-center mb-3">Two-Factor Authentication</h4>

        <p className="text-muted text-center small">
          Enter the 6-digit code from your authenticator app
        </p>

        <form onSubmit={handleVerify}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control text-center fs-5"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="text-center mt-3 small text-muted">
          Open Google Authenticator and enter the current code
        </div>
      </div>
    </div>
  );
};

export default VerifyMFA;