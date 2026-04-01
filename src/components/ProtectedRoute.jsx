import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", fontFamily:"var(--mono)", color:"var(--cyan)", fontSize:"0.8rem", letterSpacing:"0.1em" }}>
      Loading...
    </div>
  );

  if (!user)    return <Navigate to="/login" replace />;
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === "worker" ? "/worker" : "/employer"} replace />;
  }

  return children;
}
