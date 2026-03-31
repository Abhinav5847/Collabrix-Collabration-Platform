import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EnableMFA = () => {
  const [qrImage, setQrImage] = useState(null);
  const navigate = useNavigate();

  const fetchQRCode = async () => {
    try {
      const res = await api.get("/accounts/enable_mfa/", {
        responseType: "blob", 
      });
      const imageUrl = URL.createObjectURL(res.data);
      setQrImage(imageUrl);
    } catch (err) {
      toast.error("Failed to load QR code");
    }
  };

  useEffect(() => {
    fetchQRCode();
    return () => {
      if (qrImage) URL.revokeObjectURL(qrImage);
    };
  }, []);

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow p-4" style={{ width: "420px" }}>
        <h4 className="text-center mb-3">Enable Two-Factor Authentication</h4>

        <div className="text-center mb-3">
          {qrImage ? (
            <img
              src={qrImage}
              alt="QR Code"
              style={{ width: "200px", height: "200px" }}
            />
          ) : (
            <p>Loading QR...</p>
          )}
        </div>

        <div className="mb-3 text-muted small text-center">
          Scan this QR code using Google Authenticator or any MFA app. 
          Then go to the Verify MFA page to enter the 6-digit code and enable MFA.
        </div>


        <button
          className="btn btn-primary w-100"
          onClick={() => navigate("/verify_mfa")}
          disabled={!qrImage}
        >
          Go to Verify MFA
        </button>
      </div>
    </div>
  );
};

export default EnableMFA;