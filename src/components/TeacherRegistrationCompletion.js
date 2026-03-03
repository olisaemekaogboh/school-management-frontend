// src/components/TeacherRegistrationCompletion.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { teacherAPI } from "../services/api";
import {
  FaLock,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaUser,
} from "react-icons/fa";
import "./Auth.css";

function TeacherRegistrationCompletion() {
  const [token, setToken] = useState("");
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    username: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [completed, setCompleted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get token from URL
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get("token");

    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    } else {
      toast.error("Invalid registration link");
      navigate("/");
    }
  }, [location, navigate]);

  const verifyToken = async (token) => {
    try {
      const response = await teacherAPI.verifyInvitationToken(token);
      setTeacherInfo(response.data);

      // Suggest username from email
      const email = response.data.email;
      const suggestedUsername = email.split("@")[0];
      setFormData((prev) => ({ ...prev, username: suggestedUsername }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired token");
      navigate("/");
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!formData.username || formData.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setLoading(true);

    try {
      const completeData = {
        token: token,
        username: formData.username,
        password: formData.password,
      };

      await teacherAPI.completeRegistration(completeData);

      setCompleted(true);
      toast.success("Registration completed successfully!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to complete registration",
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-spinner">
            <FaSpinner className="spin" />
            <p>Verifying invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-message">
            <FaCheckCircle className="success-icon" />
            <h2>Registration Complete!</h2>
            <p>Your teacher account has been created successfully.</p>
            <p>Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>
            <FaUser /> Complete Teacher Registration
          </h2>
          <p>
            Welcome, {teacherInfo?.firstName} {teacherInfo?.lastName}!
          </p>
          <p className="text-muted">Please set up your account credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={teacherInfo?.email || ""}
              disabled
              className="readonly-field"
            />
          </div>

          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              placeholder="Choose a username"
            />
            <small className="hint-text">
              3-20 characters (letters, numbers, underscore only)
            </small>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                placeholder="Enter password (min 6 characters)"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <FaSpinner className="spin" /> : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TeacherRegistrationCompletion;
