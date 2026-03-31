import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import styles from "./Landing.module.css";

const SKILLS = ["React", "TypeScript", "UI/UX", "Node.js", "Python", "Figma", "Copywriting", "SEO"];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.grid} />

      <div className={styles.inner}>
        {/* NAV */}
        <nav className={styles.nav}>
          <div className={styles.logo}>HireSpace</div>
          <div className={styles.navRight}>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log in</Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/signup")}>Sign up</Button>
          </div>
        </nav>

        {/* HERO */}
        <div className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.dot} />
            Now live — find talent fast
          </div>

          <h1 className={styles.title}>
            Where great work<br />
            <span>finds its people.</span>
          </h1>

          <p className={styles.sub}>
            HireSpace connects skilled workers with employers who need them.
            Post your skills, browse talent, and get hired — all in one place.
          </p>

          <div className={styles.cta}>
            <Button variant="primary" size="lg" onClick={() => navigate("/signup?role=worker")}>
              Join as Worker
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/signup?role=employer")}>
              Hire Talent
            </Button>
          </div>

          {/* Floating skill tags */}
          <div className={styles.skillCloud}>
            {SKILLS.map((s) => (
              <span key={s} className={styles.cloudTag}>{s}</span>
            ))}
          </div>
        </div>

        {/* ROLE CARDS */}
        <div className={styles.roleSection}>
          <p className={styles.rolesLabel}>Choose your path</p>
          <div className={styles.roleCards}>
            <div className={styles.roleCard} onClick={() => navigate("/signup?role=worker")}>
              <div className={styles.roleIcon}>👷</div>
              <div className={styles.roleTitle}>I'm a Worker</div>
              <div className={styles.roleDesc}>Build your profile, showcase your skills, and connect with employers looking for your expertise.</div>
              <div className={styles.roleAction}>Get started →</div>
            </div>
            <div className={styles.roleCard} onClick={() => navigate("/signup?role=employer")}>
              <div className={styles.roleIcon}>🏢</div>
              <div className={styles.roleTitle}>I'm an Employer</div>
              <div className={styles.roleDesc}>Browse skilled workers, post jobs, and find the perfect match for your project or company.</div>
              <div className={styles.roleAction}>Find talent →</div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className={styles.statsBar}>
          {[["12k+","Workers"],["3.4k+","Employers"],["98%","Match rate"],["24h","Avg. hire time"]].map(([n, l]) => (
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
