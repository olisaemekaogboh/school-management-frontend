// src/components/Placeholder.js
import React from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

function Placeholder({ title, message }) {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <h1 className="display-4 mb-4">{title}</h1>
              <p className="lead text-muted mb-4">
                {message || "This page is under construction."}
              </p>
              <Link to="/" className="btn btn-primary">
                <FaArrowLeft className="me-2" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Placeholder;
