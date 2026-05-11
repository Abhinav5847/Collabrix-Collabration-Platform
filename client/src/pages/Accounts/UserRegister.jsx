import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { ToastContainer, toast } from "react-toastify";
import { registerUser, clearError } from "../../store/slices/authSlice";
import "react-toastify/dist/ReactToastify.css";

/* ─── Collabrix Brand Tokens ─────────────────────────────────────────────── */
const theme = {
  navy:       "#0B1120",
  navyMid:    "#111827",
  navyLight:  "#1E2A3B",
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
  success:    "#38A169",
  radius:     "12px",
  radiusSm:   "8px",
};

/* ─── Inline Styles ──────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: `linear-gradient(135deg, ${theme.navy} 0%, #0D1B2E 50%, #132039 100%)`,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
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
  bgDots: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
    backgroundSize: "28px 28px",
  },

  /* Left brand panel */
  brand: {
    flex: "0 0 420px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px 52px",
    position: "relative",
    zIndex: 1,
  },
  brandLogo: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 56,
  },
  logoIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: theme.indigo,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  logoText: {
    fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.4px",
  },
  brandHeadline: {
    fontSize: 38, fontWeight: 700, color: "#FFFFFF",
    lineHeight: 1.2, letterSpacing: "-0.8px", marginBottom: 16,
  },
  brandSub: {
    fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 48,
  },
  featureList: { listStyle: "none", padding: 0, margin: 0 },
  featureItem: {
    display: "flex", alignItems: "center", gap: 12,
    color: "rgba(255,255,255,0.75)", fontSize: 14, marginBottom: 16,
  },
  featureDot: {
    width: 28, height: 28, borderRadius: "50%",
    background: "rgba(79,110,247,0.22)",
    border: "1px solid rgba(79,110,247,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  /* Right form panel */
  formPane: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    position: "relative",
    zIndex: 1,
  },
  card: {
    background: theme.surface,
    borderRadius: 20,
    padding: "44px 44px",
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  },
  cardHeader: { marginBottom: 32, textAlign: "center" },
  cardTitle: {
    fontSize: 26, fontWeight: 700, color: theme.text,
    letterSpacing: "-0.5px", marginBottom: 6,
  },
  cardSub: { fontSize: 14, color: theme.muted },

  /* Form elements */
  fieldWrap: { marginBottom: 18 },
  label: {
    display: "block", fontSize: 12.5, fontWeight: 600,
    color: theme.textSoft, marginBottom: 6, letterSpacing: "0.3px", textTransform: "uppercase",
  },
  inputBase: {
    display: "block", width: "100%", boxSizing: "border-box",
    padding: "11px 14px", borderRadius: theme.radiusSm,
    border: `1.5px solid ${theme.border}`,
    fontSize: 14.5, color: theme.text,
    outline: "none", transition: "border-color .15s, box-shadow .15s",
    background: "#FAFBFC",
  },
  inputError: {
    border: `1.5px solid ${theme.danger}`,
    background: theme.dangerBg,
  },
  errMsg: {
    fontSize: 12, color: theme.danger, marginTop: 5, display: "flex", alignItems: "center", gap: 4,
  },

  /* Divider */
  divider: {
    display: "flex", alignItems: "center", margin: "24px 0",
  },
  divLine: { flex: 1, height: 1, background: theme.border },
  divLabel: {
    padding: "0 14px", fontSize: 11.5, fontWeight: 600,
    color: theme.muted, letterSpacing: "0.8px", textTransform: "uppercase",
  },

  /* Buttons */
  btnPrimary: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "13px", borderRadius: theme.radiusSm,
    background: theme.indigo, color: "#FFFFFF",
    fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
    transition: "background .15s, transform .1s",
    letterSpacing: "-0.1px",
  },
  btnGoogle: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", padding: "12px", borderRadius: theme.radiusSm,
    background: "#FFFFFF", color: theme.text,
    fontSize: 14.5, fontWeight: 600,
    border: `1.5px solid ${theme.border}`,
    cursor: "pointer", transition: "background .15s, border-color .15s",
  },

  footer: { marginTop: 28, textAlign: "center", fontSize: 13.5, color: theme.muted },
  footerLink: {
    background: "none", border: "none", cursor: "pointer",
    color: theme.indigo, fontWeight: 600, padding: 0, fontSize: 13.5,
  },

  spinner: {
    width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)",
    borderTopColor: "#FFF", borderRadius: "50%",
    animation: "spin .7s linear infinite",
  },
};

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <polyline points="2,7 5,10 11,3" stroke={theme.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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

/* ─── Component ──────────────────────────────────────────────────────────── */
const UserRegister = () => {
  const [form, setForm] = useState({ email: "", username: "", password: "", confirm_password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [hover, setHover] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    /* inject spin keyframe once */
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
    const resultAction = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(resultAction)) {
      toast.success("Registration successful!");
      setTimeout(() => navigate("/verify-otp", { state: { email: form.email } }), 1000);
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

  const renderInput = (label, name, type = "text", placeholder = "") => {
    const hasErr = !!fieldErrors[name];
    return (
      <div style={S.fieldWrap}>
        <label style={S.label}>{label}</label>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          style={{
            ...S.inputBase,
            ...(hasErr ? S.inputError : {}),
            ...(hover === name && !hasErr ? { borderColor: theme.indigo, boxShadow: `0 0 0 3px ${theme.indigoSoft}` } : {}),
          }}
          value={form[name]}
          onChange={handleChange}
          onFocus={() => setHover(name)}
          onBlur={() => setHover(null)}
          required
        />
        {hasErr && (
          <div style={S.errMsg}>
            <ErrIcon />
            {Array.isArray(fieldErrors[name]) ? fieldErrors[name][0] : fieldErrors[name]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={S.page}>
      {/* Background decorations */}
      <div style={S.bgDots} />
      <div style={S.bgOrb1} />
      <div style={S.bgOrb2} />

      {/* ── Left brand panel ── */}
      <div style={S.brand}>
        <div style={S.brandLogo}>
          <div style={S.logoIcon}><LogoMark /></div>
          <span style={S.logoText}>Collabrix</span>
        </div>

        <h1 style={S.brandHeadline}>
          Collaborate<br />without limits.
        </h1>
        <p style={S.brandSub}>
          Bring your team together in one unified workspace — documents, video calls, and more.
        </p>

        <ul style={S.featureList}>
          {[
            "Real-time document collaboration",
            "HD video meetings & screen sharing",
            "Organized team workspaces",
            "Instant messaging & threads",
          ].map((f) => (
            <li key={f} style={S.featureItem}>
              <div style={S.featureDot}><IconCheck /></div>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right form panel ── */}
      <div style={S.formPane}>
        <div style={S.card}>
          <div style={S.cardHeader}>
            <h2 style={S.cardTitle}>Create your account</h2>
            <p style={S.cardSub}>Join thousands of teams already using Collabrix</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {renderInput("Email Address", "email", "email", "name@company.com")}
            {renderInput("Username", "username", "text", "johndoe")}
            {renderInput("Password", "password", "password", "••••••••")}
            {renderInput("Confirm Password", "confirm_password", "password", "••••••••")}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...S.btnPrimary,
                marginTop: 8,
                background: hover === "submit" ? theme.indigoHov : theme.indigo,
                transform: hover === "submit" ? "translateY(-1px)" : "none",
                opacity: loading ? 0.8 : 1,
              }}
              onMouseEnter={() => setHover("submit")}
              onMouseLeave={() => setHover(null)}
            >
              {loading ? (
                <>
                  <div style={S.spinner} />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div style={S.divider}>
            <div style={S.divLine} />
            <span style={S.divLabel}>or continue with</span>
            <div style={S.divLine} />
          </div>

          <button
            type="button"
            style={{
              ...S.btnGoogle,
              background: hover === "google" ? "#F7F9FF" : "#FFFFFF",
              borderColor: hover === "google" ? theme.indigo : theme.border,
            }}
            onMouseEnter={() => setHover("google")}
            onMouseLeave={() => setHover(null)}
            onClick={handleGoogleLogin}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <p style={S.footer}>
            Already have an account?{" "}
            <button
              style={{
                ...S.footerLink,
                textDecoration: hover === "login" ? "underline" : "none",
              }}
              onMouseEnter={() => setHover("login")}
              onMouseLeave={() => setHover(null)}
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar
        toastStyle={{ borderRadius: 10, fontSize: 14 }}
      />
    </div>
  );
};

export default UserRegister;