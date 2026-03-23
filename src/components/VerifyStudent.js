// src/components/VerifyStudent.js
import React, { useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaIdCard,
  FaUserGraduate,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.trim() || "http://localhost:8080";

export default function VerifyStudent() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [admissionNumber, setAdmissionNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const canSearch = useMemo(
    () => admissionNumber.trim().length >= 3,
    [admissionNumber],
  );

  const verify = async (e) => {
    e?.preventDefault();
    if (!canSearch) {
      toast.info(
        t?.verifyStudent?.enterAdmissionNumber ||
          "Enter an admission number (e.g. NIS/2026/0004)",
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const url = `${API_BASE_URL}/api/public/verify-student?admissionNumber=${encodeURIComponent(
        admissionNumber.trim(),
      )}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setNotFound(true);
        const text = await res.text().catch(() => "");
        throw new Error(text || "Student not found");
      }

      const data = await res.json();
      setResult(data);
      toast.success(t?.verifyStudent?.verified || "Student verified ✅");
    } catch (err) {
      setNotFound(true);
      toast.error(
        t?.verifyStudent?.notFound ||
          "Student not found or could not be verified.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fullName =
    result?.firstName || result?.lastName
      ? `${result?.firstName ?? ""} ${result?.lastName ?? ""}`.trim()
      : null;

  const classDisplay = (() => {
    const cls = result?.className;
    const arm = result?.classArm;
    if (cls && arm) return `${cls} (${arm})`;
    if (cls) return cls;
    if (arm) return arm;
    return null;
  })();

  return (
    <div className="earth-pattern">
      <div className="hero-section">
        <div className="container">
          <h2 style={{ marginBottom: 10 }}>
            <FaUserGraduate style={{ marginRight: 10 }} />
            {t?.verifyStudent?.title || "Public Student Verification"}
          </h2>
          <p style={{ opacity: 0.9, marginBottom: 0 }}>
            {t?.verifyStudent?.subtitle ||
              "Enter an admission number to verify a student record."}
          </p>
          <div style={{ marginTop: 12 }}>
            <span className="nigeria-flag-badge">
              <FaIdCard style={{ marginRight: 8 }} />
              {t?.verifyStudent?.verificationPortal || "Verification Portal"}
            </span>
          </div>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={verify}>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "end",
            }}
          >
            <div style={{ flex: 1, minWidth: 240 }}>
              <label className="form-label">
                {t?.verifyStudent?.admissionNumber || "Admission Number"}
              </label>
              <input
                className="form-control"
                placeholder={
                  t?.verifyStudent?.admissionPlaceholder || "e.g. NIS/2026/0004"
                }
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-nigerian"
              disabled={loading || !canSearch}
              style={{ minWidth: 170 }}
            >
              {loading ? (
                <>
                  <FaSpinner className="spin me-2" />{" "}
                  {t?.common?.verifying || "Verifying..."}
                </>
              ) : (
                <>
                  <FaSearch style={{ marginRight: 8 }} />{" "}
                  {t?.verifyStudent?.verifyButton || "Verify Student"}
                </>
              )}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 20 }}>
          {result && (
            <div className="card school-card">
              <div className="card-header">
                <FaCheckCircle style={{ marginRight: 10 }} />
                {t?.verifyStudent?.verified || "Verified"}
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                <div style={{ display: "grid", gap: 10 }}>
                  {fullName && (
                    <div>
                      <strong>
                        {t?.verifyStudent?.fullName || "Full Name"}:{" "}
                      </strong>
                      {fullName}
                    </div>
                  )}
                  {result.admissionNumber && (
                    <div>
                      <strong>
                        {t?.verifyStudent?.admissionNumber ||
                          "Admission Number"}
                        :{" "}
                      </strong>
                      {result.admissionNumber}
                    </div>
                  )}
                  {classDisplay && (
                    <div>
                      <strong>{t?.verifyStudent?.class || "Class"}: </strong>
                      {classDisplay}
                    </div>
                  )}
                  {result.status && (
                    <div>
                      <strong>{t?.verifyStudent?.status || "Status"}: </strong>
                      {result.status}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!result && notFound && (
            <div className="card school-card">
              <div
                className="card-header"
                style={{
                  background: "linear-gradient(135deg, #dc3545, #8B4513)",
                }}
              >
                <FaTimesCircle style={{ marginRight: 10 }} />
                {t?.verifyStudent?.notFoundTitle || "Not Found"}
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                {t?.verifyStudent?.notFoundMessage ||
                  "We couldn't verify that admission number. Please check the format and try again."}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
