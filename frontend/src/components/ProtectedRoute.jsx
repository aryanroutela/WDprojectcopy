import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * Guards routes based on authentication and role.
 * Shows a skeleton loader while auth state is being hydrated.
 */
const ProtectedRoute = ({ component: Component, requiredRole = null }) => {
  const { user, token, loading } = useAuth();

  // Show branded loader while auth state initialises
  if (loading) {
    return (
      <div className="page">
        {/* Dashboard header skeleton */}
        <div style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "28px 20px",
        }}>
          <div className="skeleton skeleton-title" style={{ maxWidth: 280 }} />
          <div className="skeleton skeleton-text" style={{ maxWidth: 200, marginTop: 8 }} />
        </div>

        {/* Stats skeleton */}
        <div className="dash-stats">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%", margin: "0 auto 10px" }} />
              <div className="skeleton" style={{ height: 28, width: "60%", margin: "0 auto 8px" }} />
              <div className="skeleton" style={{ height: 12, width: "80%", margin: "0 auto" }} />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="dash-content">
          <div className="card-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="skeleton skeleton-card" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to own dashboard
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === "admin")  return <Navigate to="/admin-dashboard"  replace />;
    if (user.role === "driver") return <Navigate to="/driver-dashboard" replace />;
    return <Navigate to="/user-dashboard" replace />;
  }

  return <Component />;
};

export default ProtectedRoute;
