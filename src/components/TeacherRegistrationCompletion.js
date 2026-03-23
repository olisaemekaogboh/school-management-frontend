// src/components/TeacherRegistrationCompletion.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
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
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
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
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get("token");

    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    } else {
      toast.error(
        t?.teacherRegistration?.invalidLink || "Invalid registration link",
      );
      navigate("/");
    }
  }, [location, navigate, t]);

  const verifyToken = async (token) => {
    try {
      const response = await teacherAPI.verifyInvitationToken(token);
      setTeacherInfo(response.data);

      const email = response.data.email;
      const suggestedUsername = email.split("@")[0];
      setFormData((prev) => ({ ...prev, username: suggestedUsername }));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          t?.teacherRegistration?.invalidToken ||
          "Invalid or expired token",
      );
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

    if (formData.password.length < 6) {
      toast.error(
        t?.teacherRegistration?.passwordMinLength ||
          "Password must be at least 6 characters",
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(
        t?.teacherRegistration?.passwordsMismatch || "Passwords do not match",
      );
      return;
    }

    if (!formData.username || formData.username.length < 3) {
      toast.error(
        t?.teacherRegistration?.usernameMinLength ||
          "Username must be at least 3 characters",
      );
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
      toast.success(
        t?.teacherRegistration?.registrationComplete ||
          "Registration completed successfully!",
      );

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          t?.teacherRegistration?.completeFailed ||
          "Failed to complete registration",
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
            <p>
              {t?.teacherRegistration?.verifying || "Verifying invitation..."}
            </p>
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
            <h2>
              {t?.teacherRegistration?.registrationCompleteTitle ||
                "Registration Complete!"}
            </h2>
            <p>
              {t?.teacherRegistration?.accountCreated ||
                "Your teacher account has been created successfully."}
            </p>
            <p>
              {t?.teacherRegistration?.redirecting ||
                "Redirecting to login page..."}
            </p>
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
            <FaUser />{" "}
            {t?.teacherRegistration?.completeRegistration ||
              "Complete Teacher Registration"}
          </h2>
          <p>
            {t?.teacherRegistration?.welcome || "Welcome"},{" "}
            {teacherInfo?.firstName} {teacherInfo?.lastName}!
          </p>
          <p className="text-muted">
            {t?.teacherRegistration?.setupCredentials ||
              "Please set up your account credentials"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t?.common?.email || "Email"}</label>
            <input
              type="email"
              value={teacherInfo?.email || ""}
              disabled
              className="readonly-field"
            />
          </div>

          <div className="form-group">
            <label>{t?.teacherRegistration?.username || "Username"} *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              placeholder={
                t?.teacherRegistration?.chooseUsername || "Choose a username"
              }
            />
            <small className="hint-text">
              {t?.teacherRegistration?.usernameHint ||
                "3-20 characters (letters, numbers, underscore only)"}
            </small>
          </div>

          <div className="form-group">
            <label>{t?.teacherRegistration?.password || "Password"} *</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                placeholder={
                  t?.teacherRegistration?.passwordPlaceholder ||
                  "Enter password (min 6 characters)"
                }
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
            <label>
              {t?.teacherRegistration?.confirmPassword || "Confirm Password"} *
            </label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder={
                  t?.teacherRegistration?.confirmPasswordPlaceholder ||
                  "Confirm password"
                }
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
            {loading ? (
              <FaSpinner className="spin" />
            ) : (
              t?.teacherRegistration?.completeRegistration ||
              "Complete Registration"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TeacherRegistrationCompletion;
