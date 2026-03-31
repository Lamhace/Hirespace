import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout, totalUnread } = useAuth();
  const navigate = useNavigate();
  const unread = totalUnread();
  const isEmployer = user?.role === "employer";

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <nav className={styles.nav}>
      <div className={styles.logo} onClick={() => navigate("/")}>HireSpace</div>
      <div className={styles.right}>
        {unread > 0 && (
          <div className={styles.notifBell} title={`${unread} unread message${unread > 1 ? "s" : ""}`}>
            <span className={styles.bellIcon}>🔔</span>
            <span className={styles.notifCount}>{unread > 9 ? "9+" : unread}</span>
          </div>
        )}
        <div className={styles.avatar} style={isEmployer ? { background:"var(--purple-dim)", borderColor:"var(--border-p)", color:"var(--purple)" } : {}}>
          {user?.initials || "U"}
        </div>
        <div>
          <div className={styles.name}>{user?.fullName || "User"}</div>
          <div className={styles.badge} style={isEmployer ? { color:"var(--purple)", background:"var(--purple-dim)", borderColor:"var(--border-p)" } : {}}>
            {isEmployer ? "EMPLOYER" : "WORKER"}
          </div>
        </div>
        <button className={styles.logout} onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
