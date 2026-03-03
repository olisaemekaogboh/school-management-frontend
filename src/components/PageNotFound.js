// src/components/PageNotFound.js
import React from "react";
import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaHome } from "react-icons/fa";

export default function PageNotFound() {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12 text-center">
          <div className="display-1 text-warning mb-4">
            <FaExclamationTriangle />
          </div>
          <h1 className="display-4 mb-4">404 - Page Not Found</h1>
          <p className="lead text-muted mb-4">
            The page you're looking for doesn't exist.
          </p>
          <Link to="/" className="btn btn-primary btn-lg">
            <FaHome className="me-2" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
