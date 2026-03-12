// src/components/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requiredRole) {
    const userRole = user?.role;

    // Handle array of allowed roles
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        return <Navigate to="/401" replace />;
      }
    }
    // Handle single role
    else if (userRole !== requiredRole) {
      return <Navigate to="/401" replace />;
    }
  }

  // Redirect users to their specific dashboards if they try to access the main dashboard
  if (location.pathname === "/" && user?.role) {
    if (user.role === "TEACHER") {
      return <Navigate to="/teacher-dashboard" replace />;
    }
    if (user.role === "PARENT") {
      return <Navigate to="/parent-dashboard" replace />;
    }
    if (user.role === "STUDENT") {
      return <Navigate to="/student-dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
