// src/components/parent/ParentEmailVerification.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { toast } from "react-toastify";
import parentService from "../../services/ParentService";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaUserPlus,
  FaArrowLeft,
} from "react-icons/fa";

const ParentEmailVerification = () => {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const [email, setEmail] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [parentInfo, setParentInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setVerificationResult(null);
    setParentInfo(null);

    try {
      const result = await parentService.verifyParentEmail(email);
      setVerificationResult(result);

      if (result?.success) {
        if (result.parent) {
          setParentInfo(result.parent);
          toast.success(
            t?.parentVerification?.verified || "Email verified successfully!",
          );
        } else {
          try {
            const parent = await parentService.getParentByEmail(email);
            setParentInfo(parent);
            toast.success(
              t?.parentVerification?.verified || "Email verified successfully!",
            );
          } catch (err) {
            console.error("Error fetching parent details:", err);
            toast.success(
              t?.parentVerification?.verified || "Email verified successfully!",
            );
          }
        }
      } else {
        toast.info(
          result?.message ||
            t?.parentVerification?.notFound ||
            "Parent not found",
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(t?.parentVerification?.error || "Error verifying email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <FaEnvelope className="me-2" />
                {t?.parentVerification?.title || "Parent Email Verification"}
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleVerify}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    {t?.common?.email || "Email Address"}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        t?.parentVerification?.emailPlaceholder ||
                        "Enter parent email"
                      }
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spin me-2" />
                      {t?.common?.verifying || "Verifying..."}
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="me-2" />
                      {t?.parentVerification?.verifyButton || "Verify Email"}
                    </>
                  )}
                </button>
              </form>

              {verificationResult && (
                <div
                  className={`alert mt-4 ${verificationResult.success ? "alert-success" : "alert-warning"}`}
                >
                  <div className="d-flex align-items-center">
                    {verificationResult.success ? (
                      <FaCheckCircle className="fs-4 me-3 text-success" />
                    ) : (
                      <FaExclamationTriangle className="fs-4 me-3 text-warning" />
                    )}
                    <div>
                      <h5 className="alert-heading">
                        {verificationResult.message}
                      </h5>

                      {verificationResult.success && parentInfo && (
                        <div className="mt-3">
                          <h6>
                            {t?.parentVerification?.parentInfo ||
                              "Parent Information:"}
                          </h6>
                          <p className="mb-1">
                            <strong>
                              {t?.parentDetails?.fullName || "Name"}:
                            </strong>{" "}
                            {parentInfo.firstName} {parentInfo.lastName}
                          </p>
                          <p className="mb-1">
                            <strong>{t?.common?.email || "Email"}:</strong>{" "}
                            {parentInfo.email}
                          </p>
                          <p className="mb-1">
                            <strong>{t?.common?.phone || "Phone"}:</strong>{" "}
                            {parentInfo.phoneNumber}
                          </p>
                          {parentInfo.wardNames?.length > 0 && (
                            <p className="mb-1">
                              <strong>
                                {t?.parentDetails?.wards || "Wards"}:
                              </strong>{" "}
                              {parentInfo.wardNames.join(", ")}
                            </p>
                          )}
                        </div>
                      )}

                      {!verificationResult.success && (
                        <div className="mt-3">
                          <p>
                            {t?.parentVerification?.registerPrompt ||
                              "Would you like to register as a new parent?"}
                          </p>
                          <Link
                            to="/parents/register"
                            className="btn btn-primary btn-sm"
                          >
                            <FaUserPlus className="me-2" />
                            {t?.parentVerification?.registerButton ||
                              "Register Parent"}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ParentEmailVerification;
