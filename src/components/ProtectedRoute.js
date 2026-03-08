// src/components/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FaSpinner } from "react-icons/fa";

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-spinner">
        <FaSpinner className="spin" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requiredRole) {
    return children;
  }

  const allowedRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/401" replace />;
  }

  return children;
}

export default ProtectedRoute;
