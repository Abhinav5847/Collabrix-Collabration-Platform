import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { ToastContainer, toast } from "react-toastify";
import { loginUser, clearError } from "../../store/slices/authSlice";
import sendFCMTokenToBackend from "../../utils/fcm";
import "react-toastify/dist/ReactToastify.css";

const theme = {
  navy:       "#0B1120",
  indigo:     "#4F6EF7",
  indigoHov:  "#3D5CE8",
  indigoSoft: "#EEF1FF",
  surface:    "#FFFFFF",
  border:     "#E4E7F0",
  muted:      "#8A94A6",
  text:       "#1A2236",
  textSoft:   "#4B5568",
  danger:     "#E53E3E",
  dangerBg:   "#FFF5F5",
  radiusSm:   "8px",
};

const S = {
  page: {
    minHeight: "100vh", display: "flex",
    background: `linear-gradient(135deg, ${theme.navy} 0%, #0D1B2E 50%, #132039 100%)`,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: "relative", overflow: "hidden",
  },
  bgDots: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
    backgroundSize: "28px 28px",
  },
  bgOrb1: {
    position: "absolute", width: 480, height: 480, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(79,110,247,0.18) 0%, transparent 70%)",
    top: -120, left: -80, pointerEvents: "none",
  },
  bgOrb2: {
    position: "absolute", width: 360, height: 360, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(79,110,247,0.10) 0%, transparent 70%)",
    bottom: -80, right: -60, pointerEvents: "none",
  },
  brand: {
    flex: "0 0 420px", display: "flex", flexDirection: "column",
    justifyContent: "center", padding: "60px 52px",
    position: "relative", zIndex: 1,
  },
  brandLogo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32 },
  logoIcon: {
    width: 40, height: 40, borderRadius: 10, background: theme.indigo,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.4px" },
  brandHeadline: {
    fontSize: 38, fontWeight: 700, color: "#FFFFFF",
    lineHeight: 1.2, letterSpacing: "-0.8px", marginBottom: 12,
  },
  brandSub: { fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 },
  formPane: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 24px", position: "relative", zIndex: 1,
  },
  card: {
    background: theme.surface, borderRadius: 20, padding: "48px 44px",
    width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  },
  cardHeader: { marginBottom: 36, textAlign: "center" },
  cardTitle: { fontSize: 26, fontWeight: 700, color: theme.text, letterSpacing: "-0.5px", marginBottom: 6 },
  cardSub: { fontSize: 14, color: theme.muted },
  fieldWrap: { marginBottom: 18 },
  label: {
    display: "block", fontSize: 12.5, fontWeight: 600, color: theme.textSoft,
    marginBottom: 6, letterSpacing: "0.3px", textTransform: "uppercase",
  },
  inputBase: {
    display: "block", width: "100%", boxSizing: "border-box",
    padding: "11px 14px", borderRadius: theme.radiusSm,
    border: `1.5px solid ${theme.border}`, fontSize: 14.5, color: theme.text,
    outline: "none", transition: "border-color .15s, box-shadow .15s", background: "#FAFBFC",
  },
  inputError: { border: `1.5px solid ${theme.danger}`, background: theme.dangerBg },
  errMsg: { fontSize: 12, color: theme.danger, marginTop: 5, display: "flex", alignItems: "center", gap: 4 },
  forgotRow: { display: "flex", justifyContent: "flex-end", marginTop: 6, marginBottom: 22 },
  forgotBtn: { background: "none", border: "none", cursor: "pointer", color: theme.indigo, fontSize: 12.5, fontWeight: 600, padding: 0 },
  divider: { display: "flex", alignItems: "center", margin: "24px 0" },
  divLine: { flex: 1, height: 1, background: theme.border },
  divLabel: { padding: "0 14px", fontSize: 11.5, fontWeight: 600, color: theme.muted, letterSpacing: "0.8px", textTransform: "uppercase" },
  btnPrimary: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "13px", borderRadius: theme.radiusSm,
    background: theme.indigo, color: "#FFFFFF", fontSize: 15, fontWeight: 600,
    border: "none", cursor: "pointer", transition: "background .15s, transform .1s", letterSpacing: "-0.1px",
  },
  btnGoogle: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", padding: "12px", borderRadius: theme.radiusSm,
    background: "#FFFFFF", color: theme.text, fontSize: 14.5, fontWeight: 600,
    border: `1.5px solid ${theme.border}`, cursor: "pointer", transition: "background .15s, border-color .15s",
  },
  footer: { marginTop: 28, textAlign: "center", fontSize: 13.5, color: theme.muted },
  footerLink: { background: "none", border: "none", cursor: "pointer", color: theme.indigo, fontWeight: 600, padding: 0, fontSize: 13.5 },
  spinner: {
    width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)",
    borderTopColor: "#FFF", borderRadius: "50%", animation: "spin .7s linear infinite",
  },
};

const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="2" width="8" height="8" rx="2" fill="rgba(255,255,255,0.9)"/>
    <rect x="12" y="2" width="8" height="8" rx="2" fill="rgba(255,255,255,0.55)"/>
    <rect x="2" y="12" width="8" height="8" rx="2" fill="rgba(255,255,255,0.55)"/>
    <rect x="12" y="12" width="8" height="8" rx="2" fill="rgba(255,255,255,0.9)"/>
  </svg>
);

const ErrIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke={theme.danger} strokeWidth="1.4"/>
    <line x1="6" y1="3.5" x2="6" y2="6.5" stroke={theme.danger} strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="6" cy="8.3" r="0.6" fill={theme.danger}/>
  </svg>
);

const UserLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [hover, setHover] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    if (!document.getElementById("cbx-spin")) {
      const s = document.createElement("style");
      s.id = "cbx-spin";
      s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`;
      document.head.appendChild(s);
    }
  }, [dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    const resultAction = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success("Welcome back!");
      const userData = resultAction.payload.user || resultAction.payload;
      try { await sendFCMTokenToBackend(); } catch (err) { console.error("FCM failed:", err); }
      if (userData.is_staff) {
        navigate("/collabrix_admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } else {
      const errorData = resultAction.payload;
      if (typeof errorData === "object" && errorData !== null) {
        const globalMsg = errorData.non_field_errors || errorData.detail || errorData.error;
        if (globalMsg) toast.error(Array.isArray(globalMsg) ? globalMsg[0] : globalMsg);
        setFieldErrors(errorData);
      } else {
        toast.error("An unexpected server error occurred.");
      }
    }
  };

  const handleGoogleLogin = () => {
    const clientId = "113584658101-1mcdiqv8vaqtqnlp9ftr952gdr415q2d.apps.googleusercontent.com";
    const redirectUri = "http://127.0.0.1:4000/google/callback";
    const scope = "email profile";
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = googleUrl;
  };

  const inputStyle = (name) => ({
    ...S.inputBase,
    ...(fieldErrors[name] ? S.inputError : {}),
    ...(hover === name && !fieldErrors[name] ? { borderColor: theme.indigo, boxShadow: `0 0 0 3px ${theme.indigoSoft}` } : {}),
  });

  return (
    <div style={S.page}>
      <div style={S.bgDots} />
      <div style={S.bgOrb1} />
      <div style={S.bgOrb2} />

      {/* Left — logo + welcome only */}
      <div style={S.brand}>
        <div style={S.brandLogo}>
          <div style={S.logoIcon}><LogoMark /></div>
          <span style={S.logoText}>Collabrix</span>
        </div>
        <h1 style={S.brandHeadline}>Welcome<br />back.</h1>
        <p style={S.brandSub}>Good to see you again.</p>
      </div>

      {/* Right — form */}
      <div style={S.formPane}>
        <div style={S.card}>
          <div style={S.cardHeader}>
            <h2 style={S.cardTitle}>Sign in to Collabrix</h2>
            <p style={S.cardSub}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={S.fieldWrap}>
              <label style={S.label}>Email Address</label>
              <input
                type="email" name="email" placeholder="name@company.com"
                style={inputStyle("email")} value={form.email} onChange={handleChange}
                onFocus={() => setHover("email")} onBlur={() => setHover(null)} required
              />
              {fieldErrors.email && (
                <div style={S.errMsg}><ErrIcon />{Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}</div>
              )}
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>Password</label>
              <input
                type="password" name="password" placeholder="••••••••"
                style={inputStyle("password")} value={form.password} onChange={handleChange}
                onFocus={() => setHover("password")} onBlur={() => setHover(null)} required
              />
              {fieldErrors.password && (
                <div style={S.errMsg}><ErrIcon />{Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password}</div>
              )}
            </div>

            <div style={S.forgotRow}>
              <button
                type="button"
                style={{ ...S.forgotBtn, textDecoration: hover === "forgot" ? "underline" : "none" }}
                onMouseEnter={() => setHover("forgot")} onMouseLeave={() => setHover(null)}
                onClick={() => navigate("/forgot_password")}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                ...S.btnPrimary,
                background: hover === "submit" ? theme.indigoHov : theme.indigo,
                transform: hover === "submit" ? "translateY(-1px)" : "none",
                opacity: loading ? 0.8 : 1,
              }}
              onMouseEnter={() => setHover("submit")} onMouseLeave={() => setHover(null)}
            >
              {loading ? <><div style={S.spinner} />Signing in…</> : "Sign In"}
            </button>
          </form>

          <div style={S.divider}>
            <div style={S.divLine} />
            <span style={S.divLabel}>or</span>
            <div style={S.divLine} />
          </div>

          <button
            type="button"
            style={{
              ...S.btnGoogle,
              background: hover === "google" ? "#F7F9FF" : "#FFFFFF",
              borderColor: hover === "google" ? theme.indigo : theme.border,
            }}
            onMouseEnter={() => setHover("google")} onMouseLeave={() => setHover(null)}
            onClick={handleGoogleLogin}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <p style={S.footer}>
            New to Collabrix?{" "}
            <button
              style={{ ...S.footerLink, textDecoration: hover === "register" ? "underline" : "none" }}
              onMouseEnter={() => setHover("register")} onMouseLeave={() => setHover(null)}
              onClick={() => navigate("/register")}
            >
              Create an account
            </button>
          </p>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar toastStyle={{ borderRadius: 10, fontSize: 14 }} />
    </div>
  );
};

export default UserLogin;