import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./context/useAuthStore";
import {
  NotificationProvider,
  notify,
} from "./context/NotificationContext";
import { ConfirmationProvider } from "./context/ConfirmationContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MeasureForm from "./pages/MeasureForm";
import Settings from "./pages/Settings";
import PublicTrack from './pages/PublicTrack';

// Custom security wrapper to protect internal tracking dashboards
const ProtectedRoute = ({ children }: { children: React.JSX.Element }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { isAuthenticated, token, logout, updateActivity } = useAuthStore();

  // Keep the client session in sync with the JWT expiration, even without API traffic.
  useEffect(() => {
    if (!token) return;

    try {
      const payload = token.split(".")[1];
      if (!payload) {
        logout();
        return;
      }

      const normalizedPayload = payload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(payload.length / 4) * 4, "=");
      const claims = JSON.parse(window.atob(normalizedPayload)) as {
        exp?: number;
      };
      if (typeof claims.exp !== "number") {
        logout();
        return;
      }

      const remainingTime = claims.exp * 1000 - Date.now();
      if (remainingTime <= 0) {
        notify("Your session has expired. Please sign in again.", "warning");
        logout();
        return;
      }

      const expirationTimer = window.setTimeout(() => {
        notify("Your session has expired. Please sign in again.", "warning");
        logout();
      }, remainingTime);
      return () => window.clearTimeout(expirationTimer);
    } catch {
      logout();
    }
  }, [token, logout]);

  // Active user interaction listener system to monitor the 10-minute idle session bounds
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetIdleTimer = () => {
      updateActivity();
    };

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);
    window.addEventListener("scroll", resetIdleTimer);

    return () => {
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
      window.removeEventListener("scroll", resetIdleTimer);
    };
  }, [isAuthenticated, updateActivity]);

  return (
    <NotificationProvider>
      <ConfirmationProvider>
        <Router>
          <Routes>
            {/* Public Authentication Gate */}
            <Route path="/login" element={<Login />} />

            {/* Fallback routing matrix defaults to dashboard or login page */}
            <Route
              path="*"
              element={
                <Navigate
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  replace
                />
              }
            />

            {/* High-Security Protected Core Matrix Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Add Measure Form for New and Edit Operations */}
            <Route
              path="/dashboard/intake"
              element={
                <ProtectedRoute>
                  <MeasureForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/edit/:id"
              element={
                <ProtectedRoute>
                  <MeasureForm />
                </ProtectedRoute>
              }
            />
            {/* System Settings Administrative Module */}
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/public-track" element={<PublicTrack />} />
          </Routes>
        </Router>
      </ConfirmationProvider>
    </NotificationProvider>
  );
}
