import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { forgotPassword } from "../../store/slices/authSlice";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const resultAction = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(resultAction)) {
      setSubmitted(true);
      toast.success("If the email exists, a reset link has been sent", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => navigate("/login"), 1500);
    } else {
      toast.error(resultAction.payload || "Something went wrong", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-root {
          font-family: 'Sora', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          position: relative;
          overflow: hidden;
        }

        /* Ambient background orbs */
        .fp-root::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          top: -150px;
          left: -150px;
          pointer-events: none;
        }
        .fp-root::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
          bottom: -120px;
          right: -100px;
          pointer-events: none;
        }

        .fp-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          margin: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 44px 40px 40px;
          backdrop-filter: blur(24px);
          animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Top accent line */
        .fp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent);
          border-radius: 100%;
        }

        .fp-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05));
          border: 1px solid rgba(99,102,241,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          animation: slideUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }

        .fp-icon-wrap svg {
          width: 24px;
          height: 24px;
          color: #818cf8;
        }

        .fp-heading {
          font-size: 22px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.4px;
          margin-bottom: 8px;
          animation: slideUp 0.5s 0.12s cubic-bezier(0.16,1,0.3,1) both;
        }

        .fp-subtext {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 32px;
          animation: slideUp 0.5s 0.14s cubic-bezier(0.16,1,0.3,1) both;
        }

        .fp-field {
          margin-bottom: 20px;
          animation: slideUp 0.5s 0.18s cubic-bezier(0.16,1,0.3,1) both;
        }

        .fp-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .fp-input-wrap {
          position: relative;
        }

        .fp-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #475569;
          pointer-events: none;
          transition: color 0.2s;
        }

        .fp-input {
          width: 100%;
          padding: 12px 14px 12px 40px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          color: #e2e8f0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .fp-input::placeholder { color: #334155; }

        .fp-input:focus {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.05);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        .fp-input:focus + .fp-input-icon,
        .fp-input-wrap:focus-within .fp-input-icon {
          color: #818cf8;
        }

        /* Move icon before input in DOM, so we use a wrapper approach */
        .fp-input-wrap .fp-input-icon { z-index: 1; }

        .fp-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.02em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          margin-top: 4px;
          animation: slideUp 0.5s 0.22s cubic-bezier(0.16,1,0.3,1) both;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }

        .fp-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .fp-btn:hover:not(:disabled)::before { opacity: 1; }
        .fp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(99,102,241,0.4); }
        .fp-btn:active:not(:disabled) { transform: translateY(0); }
        .fp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .fp-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .fp-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .fp-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0 24px;
          animation: slideUp 0.5s 0.24s cubic-bezier(0.16,1,0.3,1) both;
        }
        .fp-divider span {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .fp-divider p {
          font-size: 11px;
          color: #334155;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .fp-back {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13.5px;
          color: #475569;
          cursor: pointer;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: color 0.2s, border-color 0.2s, background 0.2s;
          text-decoration: none;
          animation: slideUp 0.5s 0.26s cubic-bezier(0.16,1,0.3,1) both;
        }
        .fp-back:hover {
          color: #818cf8;
          border-color: rgba(99,102,241,0.25);
          background: rgba(99,102,241,0.05);
        }
        .fp-back svg {
          width: 14px;
          height: 14px;
          transition: transform 0.2s;
        }
        .fp-back:hover svg { transform: translateX(-2px); }
      `}</style>

      <div className="fp-root">
        <div className="fp-card">
          {/* Icon */}
          <div className="fp-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h1 className="fp-heading">Reset your password</h1>
          <p className="fp-subtext">
            Enter your email address and we'll send you a secure link to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="fp-field">
              <label className="fp-label" htmlFor="fp-email">Email address</label>
              <div className="fp-input-wrap">
                <input
                  id="fp-email"
                  type="email"
                  className="fp-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <svg className="fp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>

            <button className="fp-btn" type="submit" disabled={loading}>
              <span className="fp-btn-inner">
                {loading ? (
                  <>
                    <span className="fp-spinner" />
                    Sending link…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send Reset Link
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="fp-divider">
            <span /><p>or</p><span />
          </div>

          <button className="fp-back" onClick={() => navigate("/login")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Login
          </button>
        </div>
      </div>

      <ToastContainer
        toastStyle={{
          background: "#1e1e2e",
          color: "#e2e8f0",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          fontFamily: "'Sora', sans-serif",
          fontSize: "13.5px",
        }}
      />
    </>
  );
};

export default ForgotPassword;