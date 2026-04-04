import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { profile, logout, totalUnread } = useAuth();
  const navigate   = useNavigate();
  const isEmployer = profile?.role === "employer";

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <nav className={styles.nav}>
      <div className={styles.logo} onClick={() => navigate("/")}>HireSpace</div>
      <div className={styles.right}>

        {/* Notification bell */}
        {totalUnread > 0 && (
          <div className={styles.bell} title={`${totalUnread} unread message${totalUnread > 1 ? "s" : ""}`}>
            <span className={styles.bellIcon}>🔔</span>
            <span className={styles.bellCount}>{totalUnread > 9 ? "9+" : totalUnread}</span>
          </div>
        )}

        <Avatar
          avatarBase64={profile?.avatarBase64}
          initials={profile?.initials || "U"}
          size={36}
          isEmployer={isEmployer}
        />

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
