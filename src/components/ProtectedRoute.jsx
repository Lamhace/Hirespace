import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();

  // Still initialising Firebase auth
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        gap: "1rem",
      }}>
        <div style={{
          width: "36px", height: "36px",
          border: "2px solid rgba(0,229,255,0.2)",
          borderTop: "2px solid var(--cyan)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.1em" }}>
          Loading...
        </p>
      </div>
    );
  }

  // Not logged in at all
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but profile not loaded yet — wait a moment
  if (!profile) return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      fontFamily: "var(--mono)",
      fontSize: "0.72rem",
      color: "var(--muted)",
      letterSpacing: "0.1em",
    }}>
      Loading profile...
    </div>
  );

  // Wrong role — redirect to correct dashboard
  if (requiredRole && profile.role !== requiredRole) {
    return <Navigate to={profile.role === "worker" ? "/worker" : "/employer"} replace />;
  }

  return children;
}
