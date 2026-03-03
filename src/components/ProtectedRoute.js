// src/components/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FaSpinner } from "react-icons/fa";

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth(); // Note: loading not isLoading
  const location = useLocation();

  console.log("ProtectedRoute Debug:", {
    loading,
    isAuthenticated,
    user,
    userRole: user?.role,
    requiredRole,
  });

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-spinner">
        <FaSpinner className="spin" />
        <p>Loading...</p>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (requiredRole) {
    const userRole = user?.role;

    // Handle array of allowed roles
    if (Array.isArray(requiredRole)) {
      // Check if user role is in the allowed roles array OR user is ADMIN
      if (!requiredRole.includes(userRole) && userRole !== "ADMIN") {
        console.log(
          `Access denied. User role: ${userRole}, Required:`,
          requiredRole,
        );
        return <Navigate to="/401" replace />;
      }
    }
    // Handle single role
    else if (userRole !== requiredRole && userRole !== "ADMIN") {
      console.log(
        `Access denied. User role: ${userRole}, Required: ${requiredRole}`,
      );
      return <Navigate to="/401" replace />;
    }
  }

  console.log("Access granted to:", location.pathname);
  return children;
}

export default ProtectedRoute;
