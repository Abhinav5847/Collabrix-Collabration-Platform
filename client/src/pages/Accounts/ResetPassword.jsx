import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { resetPassword } from "../../store/slices/authSlice";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const resultAction = await dispatch(
      resetPassword({ uid, token, password: form.password })
    );

    if (resetPassword.fulfilled.match(resultAction)) {
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      const errorData = resultAction.payload;
      let message = "Invalid or expired link";

      if (typeof errorData === "object" && errorData !== null) {
        message = Object.values(errorData).flat().join(", ");
      } else if (typeof errorData === "string") {
        message = errorData;
      }

      toast.error(message);
    }
  };

  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rp-root {
          font-family: 'Sora', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          position: relative;
          overflow: hidden;
        }

        .rp-root::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          top: -150px; left: -150px;
          pointer-events: none;
        }
        .rp-root::after {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
          bottom: -120px; right: -100px;
          pointer-events: none;
        }

        .rp-card {
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

        .rp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent);
          border-radius: 100%;
        }

        .rp-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05));
          border: 1px solid rgba(99,102,241,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          animation: slideUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }
        .rp-icon-wrap svg { width: 24px; height: 24px; color: #818cf8; }

        .rp-heading {
          font-size: 22px; font-weight: 700;
          color: #f1f5f9; letter-spacing: -0.4px;
          margin-bottom: 8px;
          animation: slideUp 0.5s 0.12s cubic-bezier(0.16,1,0.3,1) both;
        }

        .rp-subtext {
          font-size: 13.5px; color: #64748b;
          line-height: 1.6; margin-bottom: 32px;
          animation: slideUp 0.5s 0.14s cubic-bezier(0.16,1,0.3,1) both;
        }

        .rp-field {
          margin-bottom: 20px;
          animation: slideUp 0.5s 0.18s cubic-bezier(0.16,1,0.3,1) both;
        }
        .rp-field:nth-child(2) { animation-delay: 0.2s; }

        .rp-label {
          display: block;
          font-size: 12px; font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 8px;
        }

        .rp-input-wrap { position: relative; }

        .rp-input-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          width: 16px; height: 16px;
          color: #475569;
          pointer-events: none;
          transition: color 0.2s;
        }

        .rp-input {
          width: 100%;
          padding: 12px 44px 12px 40px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 14px; color: #e2e8f0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .rp-input::placeholder { color: #334155; }
        .rp-input:focus {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.05);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .rp-input.match {
          border-color: rgba(16,185,129,0.5);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
        }
        .rp-input.mismatch {
          border-color: rgba(239,68,68,0.5);
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }
        .rp-input-wrap:focus-within .rp-input-icon { color: #818cf8; }

        .rp-toggle {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; padding: 4px;
          color: #475569;
          transition: color 0.2s;
          display: flex; align-items: center;
        }
        .rp-toggle:hover { color: #818cf8; }
        .rp-toggle svg { width: 16px; height: 16px; }

        .rp-match-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 7px;
          font-size: 12px;
          font-weight: 500;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

        .rp-match-hint.ok  { color: #34d399; }
        .rp-match-hint.err { color: #f87171; }
        .rp-match-hint svg { width: 13px; height: 13px; flex-shrink: 0; }

        .rp-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none; border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600;
          color: #fff; letter-spacing: 0.02em;
          cursor: pointer; position: relative; overflow: hidden;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          margin-top: 8px;
          animation: slideUp 0.5s 0.24s cubic-bezier(0.16,1,0.3,1) both;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }
        .rp-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .rp-btn:hover:not(:disabled)::before { opacity: 1; }
        .rp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(99,102,241,0.4); }
        .rp-btn:active:not(:disabled) { transform: translateY(0); }
        .rp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .rp-btn-inner {
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }

        .rp-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .rp-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 28px 0 24px;
          animation: slideUp 0.5s 0.26s cubic-bezier(0.16,1,0.3,1) both;
        }
        .rp-divider span { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .rp-divider p { font-size: 11px; color: #334155; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }

        .rp-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 13.5px; color: #475569;
          cursor: pointer; padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: color 0.2s, border-color 0.2s, background 0.2s;
          width: 100%;
          animation: slideUp 0.5s 0.28s cubic-bezier(0.16,1,0.3,1) both;
        }
        .rp-back:hover { color: #818cf8; border-color: rgba(99,102,241,0.25); background: rgba(99,102,241,0.05); }
        .rp-back svg { width: 14px; height: 14px; transition: transform 0.2s; }
        .rp-back:hover svg { transform: translateX(-2px); }
      `}</style>

      <div className="rp-root">
        <div className="rp-card">

          <div className="rp-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>

          <h1 className="rp-heading">Set a new password</h1>
          <p className="rp-subtext">
            Choose a strong password to secure your account. It must match in both fields below.
          </p>

          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="rp-field">
              <label className="rp-label">New Password</label>
              <div className="rp-input-wrap">
                <svg className="rp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="rp-input"
                  placeholder="Enter new password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="rp-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="rp-field">
              <label className="rp-label">Confirm Password</label>
              <div className="rp-input-wrap">
                <svg className="rp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  className={`rp-input ${passwordsMatch ? "match" : ""} ${passwordsMismatch ? "mismatch" : ""}`}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="rp-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Inline match feedback */}
              {passwordsMatch && (
                <div className="rp-match-hint ok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Passwords match
                </div>
              )}
              {passwordsMismatch && (
                <div className="rp-match-hint err">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Passwords do not match
                </div>
              )}
            </div>

            <button type="submit" className="rp-btn" disabled={loading}>
              <span className="rp-btn-inner">
                {loading ? (
                  <>
                    <span className="rp-spinner" />
                    Resetting…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Reset Password
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="rp-divider">
            <span /><p>or</p><span />
          </div>

          <button className="rp-back" onClick={() => navigate("/login")}>
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

export default ResetPassword;