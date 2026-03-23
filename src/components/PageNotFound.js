// src/components/PageNotFound.js
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { FaExclamationTriangle, FaHome } from "react-icons/fa";

export default function PageNotFound() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12 text-center">
          <div className="display-1 text-warning mb-4">
            <FaExclamationTriangle />
          </div>
          <h1 className="display-4 mb-4">
            {t?.pageNotFound?.title || "404 - Page Not Found"}
          </h1>
          <p className="lead text-muted mb-4">
            {t?.pageNotFound?.message ||
              "The page you're looking for doesn't exist."}
          </p>
          <Link to="/" className="btn btn-primary btn-lg">
            <FaHome className="me-2" />{" "}
            {t?.pageNotFound?.backToDashboard || "Back to Dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}
