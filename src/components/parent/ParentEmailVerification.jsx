// src/components/parent/ParentEmailVerification.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import parentService from "../../services/ParentService"; // Import the service directly

const ParentEmailVerification = () => {
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
      console.log("Verifying email:", email);

      // Use parentService directly instead of context
      const result = await parentService.verifyParentEmail(email);
      console.log("Verification result:", result);

      setVerificationResult(result);

      if (result?.success) {
        console.log("Success! Parent data:", result.parent);

        // The parent data might be in the result
        if (result.parent) {
          setParentInfo(result.parent);
          toast.success("Email verified successfully!");
        } else {
          // Try to fetch parent details if not included
          try {
            console.log("Fetching parent details separately...");
            const parent = await parentService.getParentByEmail(email);
            console.log("Parent details:", parent);
            setParentInfo(parent);
            toast.success("Email verified successfully!");
          } catch (err) {
            console.error("Error fetching parent details:", err);
            // Still show success since verification worked
            toast.success("Email verified successfully!");
          }
        }
      } else {
        console.log("Verification failed:", result?.message);
        toast.info(result?.message || "Parent not found");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Error verifying email");
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
                <i className="bi bi-envelope-check me-2"></i>
                Parent Email Verification
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleVerify}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter parent email"
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
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Verify Email
                    </>
                  )}
                </button>
              </form>

              {/* Verification Result */}
              {verificationResult && (
                <div
                  className={`alert mt-4 ${
                    verificationResult.success
                      ? "alert-success"
                      : "alert-warning"
                  }`}
                >
                  <div className="d-flex align-items-center">
                    <i
                      className={`bi ${
                        verificationResult.success
                          ? "bi-check-circle-fill"
                          : "bi-exclamation-triangle-fill"
                      } fs-4 me-3`}
                    ></i>
                    <div>
                      <h5 className="alert-heading">
                        {verificationResult.message}
                      </h5>

                      {verificationResult.success && parentInfo && (
                        <div className="mt-3">
                          <h6>Parent Information:</h6>
                          <p className="mb-1">
                            <strong>Name:</strong> {parentInfo.firstName}{" "}
                            {parentInfo.lastName}
                          </p>
                          <p className="mb-1">
                            <strong>Email:</strong> {parentInfo.email}
                          </p>
                          <p className="mb-1">
                            <strong>Phone:</strong> {parentInfo.phoneNumber}
                          </p>
                          {parentInfo.wardNames?.length > 0 && (
                            <p className="mb-1">
                              <strong>Wards:</strong>{" "}
                              {parentInfo.wardNames.join(", ")}
                            </p>
                          )}
                        </div>
                      )}

                      {!verificationResult.success && (
                        <div className="mt-3">
                          <p>Would you like to register as a new parent?</p>
                          <Link
                            to="/parents/register"
                            className="btn btn-primary btn-sm"
                          >
                            <i className="bi bi-person-plus me-2"></i>
                            Register Parent
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
    </div>
  );
};

export default ParentEmailVerification;
