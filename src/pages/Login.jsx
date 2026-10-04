import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import styles from "./Auth.module.css";

export default function Login() {
  const [role,      setRole]      = useState("worker");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginAsDemo, user, profile } = useAuth();
  const navigate = useNavigate();

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === "worker" ? "/worker" : "/employer", { replace: true });
    }
  }, [user, profile, navigate]);

  const handleDemoLogin = (demoRole) => {
    const result = loginAsDemo(demoRole);
    if (result.success) {
      navigate(demoRole === "worker" ? "/worker" : "/employer", { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }

    setIsLoading(true);
    const result = await login(email, password, role);
    if (result.success) {
      // Navigate immediately using returned role
      navigate(result.role === "worker" ? "/worker" : "/employer", { replace: true });
    } else {
      setError(result.error || "Login failed.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.top}>
          <Link to="/" className={styles.logo}>HireSpace</Link>
          <Link to="/" className={styles.back}>← Back</Link>
        </div>

        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.sub}>Log in to your <span style={{ color:"var(--cyan)" }}>HireSpace</span> account.</p>

        {/* 1-Click Demo Persona Switcher */}
        <div style={{
          background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(16,185,129,0.06))",
          border: "1px solid rgba(6,182,212,0.3)",
          borderRadius: "12px",
          padding: "0.85rem 1rem",
          marginBottom: "1.25rem",
          textAlign: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "0.35rem", color: "#38bdf8", fontWeight: 700, fontSize: "0.84rem" }}>
            <span>⚡ Instant Demo Mode</span>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 400 }}>(No signup needed)</span>
          </div>
          <p style={{ margin: "0 0 0.65rem", fontSize: "0.76rem", color: "#94a3b8" }}>
            Explore live features as a verified artisan or hiring client:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handleDemoLogin("worker")}
              style={{
                background: "rgba(15,23,42,0.85)",
                border: "1px solid rgba(56,189,248,0.4)",
                color: "#f8fafc",
                padding: "0.55rem 0.6rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px"
              }}
            >
              <span>👷 Demo Artisan</span>
              <span style={{ fontSize: "0.68rem", color: "#38bdf8", fontWeight: 400 }}>Emeka · Electrician</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("employer")}
              style={{
                background: "rgba(15,23,42,0.85)",
                border: "1px solid rgba(52,211,153,0.4)",
                color: "#f8fafc",
                padding: "0.55rem 0.6rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px"
              }}
            >
              <span>🏢 Demo Employer</span>
              <span style={{ fontSize: "0.68rem", color: "#34d399", fontWeight: 400 }}>Tunde · Project Lead</span>
            </button>
          </div>
        </div>

        <div className={styles.roleToggle} style={{ marginBottom:"1.5rem" }}>
          <button type="button" className={`${styles.toggleBtn} ${role==="worker"?styles.active:""}`} onClick={() => setRole("worker")}>👷 Worker</button>
          <button type="button" className={`${styles.toggleBtn} ${role==="employer"?styles.active:""}`} onClick={() => setRole("employer")}>🏢 Employer</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={styles.passwordWrap}>
            <label>Password</label>
            <div className={styles.passwordField}>
              <input
                type={showPass?"text":"password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log In →"}
          </Button>

          <p className={styles.switch}>No account? <Link to="/signup" className={styles.switchLink}>Sign up free</Link></p>
        </form>
      </div>
    </div>
  );
}
