import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children, requiredRole, allowedRoles }) {
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

  const userRole = user?.role;

  const rolesToCheck =
    allowedRoles ??
    (Array.isArray(requiredRole)
      ? requiredRole
      : requiredRole
        ? [requiredRole]
        : null);

  if (rolesToCheck && !userRole) {
    return (
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (rolesToCheck && !rolesToCheck.includes(userRole)) {
    return <Navigate to="/401" replace />;
  }

  if (location.pathname === "/" && userRole && !requiredRole && !allowedRoles) {
    if (userRole === "TEACHER") {
      return <Navigate to="/teacher-dashboard" replace />;
    }
    if (userRole === "PARENT") {
      return <Navigate to="/parent-dashboard" replace />;
    }
    if (userRole === "STUDENT") {
      return <Navigate to="/student-dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
