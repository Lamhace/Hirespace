import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const isEmployer = profile?.role === "employer";

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <nav className={styles.nav}>
      <div className={styles.logo} onClick={() => navigate("/")}>HireSpace</div>
      <div className={styles.right}>
        <div
          className={styles.avatar}
          style={isEmployer ? { borderColor:"var(--border-p)" } : {}}
        >
          {profile?.avatarBase64
            ? <img src={profile.avatarBase64} alt="avatar" className={styles.avatarImg} />
            : <span style={{ color: isEmployer ? "var(--purple)" : "var(--cyan)" }}>{profile?.initials || "U"}</span>
          }
        </div>
        <div>
          <div className={styles.name}>{profile?.fullName || "User"}</div>
          <div className={styles.badge} style={isEmployer ? { color:"var(--purple)", background:"var(--purple-dim)", borderColor:"var(--border-p)" } : {}}>
            {isEmployer ? "EMPLOYER" : "WORKER"}
          </div>
        </div>
        <button className={styles.logout} onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
