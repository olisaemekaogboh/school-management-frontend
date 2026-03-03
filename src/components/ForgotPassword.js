// src/components/ForgotPassword.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaEnvelope,
  FaSpinner,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";
import "./Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send email in the correct format
      await authAPI.forgotPassword({ email });
      setEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(
        error.response?.data?.message || "Failed to send reset email",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot Password</h2>
          <p>Enter your email to reset your password</p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>
                <FaEnvelope /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? <FaSpinner className="spin" /> : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <FaCheckCircle className="success-icon" />
            <h3>Email Sent!</h3>
            <p>
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions.
            </p>
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login" className="back-to-login">
            <FaArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
