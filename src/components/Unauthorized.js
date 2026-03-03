// src/components/Unauthorized.js
import React from "react";
import { Link } from "react-router-dom";
import { FaLock, FaHome } from "react-icons/fa";

export default function Unauthorized() {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12 text-center">
          <div className="display-1 text-danger mb-4">
            <FaLock />
          </div>
          <h1 className="display-4 mb-4">401 - Unauthorized</h1>
          <p className="lead text-muted mb-4">
            You don't have permission to access this page.
          </p>
          <Link to="/" className="btn btn-primary btn-lg">
            <FaHome className="me-2" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
