import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute component to guard routes based on authentication and role
 */
const ProtectedRoute = ({ component: Component, requiredRole = null }) => {
  const { user, token } = useAuth();

  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === "driver") {
      return <Navigate to="/driver-dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  return <Component />;
};

export default ProtectedRoute;
