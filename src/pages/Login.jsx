import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import styles from "./Auth.module.css";

export default function Login() {
  const [role, setRole] = useState("worker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    const result = login(email, role);
    if (result.success) {
      navigate(role === "worker" ? "/worker" : "/employer");
    } else {
      setError(result.error || "Login failed. Please try again.");
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
        <p className={styles.sub}>
          Log in to your <span style={{ color: "var(--cyan)" }}>HireSpace</span> account.
        </p>

        <div className={styles.roleToggle} style={{ marginBottom: "1.5rem" }}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${role === "worker" ? styles.active : ""}`}
            onClick={() => setRole("worker")}
          >
            👷 Worker
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${role === "employer" ? styles.active : ""}`}
            onClick={() => setRole("employer")}
          >
            🏢 Employer
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Log In →
          </Button>

          <p className={styles.switch}>
            No account?{" "}
            <Link to="/signup" className={styles.switchLink}>Sign up free</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
