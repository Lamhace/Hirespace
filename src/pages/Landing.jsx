import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import styles from "./Landing.module.css";

const LOCAL_JOBS = ["Plumber","Electrician","House Cleaner","Interior Decorator","Mechanic","Laundry","Gas Filler","Carpenter","Painter","Driver"];

export default function Landing() {
  const navigate = useNavigate();
  const { user, profile, loginAsDemo } = useAuth();

  // Block homepage if already logged in
  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === "worker" ? "/worker" : "/employer", { replace: true });
    }
  }, [user, profile, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <div className={styles.logo}>HireSpace</div>
          <div className={styles.navRight}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { loginAsDemo("employer"); navigate("/employer"); }}
              style={{ color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)" }}
            >
              ⚡ Instant Demo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log in</Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/signup")}>Sign up</Button>
          </div>
        </nav>

        <div className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.dot} />
            Local workers, ready to hire
          </div>
          <h1 className={styles.title}>
            Find trusted local<br />
            <span>workers near you.</span>
          </h1>
          <p className={styles.sub}>
            HireSpace connects you with skilled local workers — plumbers, electricians, cleaners and more.
            Post a job, hire safely, pay securely through escrow.
          </p>
          <div className={styles.cta}>
            <Button variant="primary" size="lg" onClick={() => navigate("/signup?role=worker")}>Join as Worker</Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/signup?role=employer")}>Hire Someone</Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => { loginAsDemo("employer"); navigate("/employer"); }}
              style={{
                border: "1px dashed rgba(56,189,248,0.5)",
                color: "#38bdf8",
                background: "rgba(56,189,248,0.06)"
              }}
            >
              ⚡ Explore Demo →
            </Button>
          </div>
          <div className={styles.skillCloud}>
            {LOCAL_JOBS.map((s) => <span key={s} className={styles.cloudTag}>{s}</span>)}
          </div>
        </div>

        <div className={styles.roleSection}>
          <p className={styles.rolesLabel}>Choose your path</p>
          <div className={styles.roleCards}>
            <div className={styles.roleCard} onClick={() => navigate("/signup?role=worker")}>
              <div className={styles.roleIcon}>👷</div>
              <div className={styles.roleTitle}>I'm a Worker</div>
              <div className={styles.roleDesc}>Build your profile, showcase your skills, and connect with people who need your services.</div>
              <div className={styles.roleAction}>Get started →</div>
            </div>
            <div className={styles.roleCard} onClick={() => navigate("/signup?role=employer")}>
              <div className={styles.roleIcon}>🏠</div>
              <div className={styles.roleTitle}>I need help</div>
              <div className={styles.roleDesc}>Browse skilled local workers, send proposals, and pay safely through HireSpace escrow.</div>
              <div className={styles.roleAction}>Find help →</div>
            </div>
          </div>
        </div>

        <div className={styles.statsBar}>
          {[["12k+","Workers"],["3.4k+","Clients"],["98%","Satisfaction"],["24h","Avg. hire time"]].map(([n,l]) => (
            <div key={l} className={styles.stat}>
              <div className={styles.statNum}>{n}</div>
              <div className={styles.statLbl}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
