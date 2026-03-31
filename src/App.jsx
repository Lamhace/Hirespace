import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import WorkerDash from "./pages/WorkerDash";
import EmployerDash from "./pages/EmployerDash";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<Landing />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/login"   element={<Login />} />

          <Route
            path="/worker"
            element={
              <ProtectedRoute requiredRole="worker">
                <WorkerDash />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employer"
            element={
              <ProtectedRoute requiredRole="employer">
                <EmployerDash />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
