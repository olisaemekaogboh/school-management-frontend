// src/components/Login.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaSchool,
  FaArrowRight,
  FaShieldAlt,
} from "react-icons/fa";
import "./Auth.css";

function Login() {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Load saved credentials if remember me was checked
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setFormData((prev) => ({ ...prev, usernameOrEmail: savedUsername }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (loginError) setLoginError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    // Handle remember me
    if (rememberMe) {
      localStorage.setItem("rememberedUsername", formData.usernameOrEmail);
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    const success = await login(formData.usernameOrEmail, formData.password);

    if (success) {
      navigate(from, { replace: true });
    } else {
      setLoginError("Invalid username/email or password");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* Decorative background elements */}
      <div className="auth-bg-decoration">
        <div className="auth-circle auth-circle-1"></div>
        <div className="auth-circle auth-circle-2"></div>
        <div className="auth-circle auth-circle-3"></div>
      </div>

      <div className="auth-card-wrapper">
        {/* School logo/brand section */}
        <div className="auth-brand">
          <div className="auth-logo">
            <FaSchool className="auth-logo-icon" />
          </div>
          <h1 className="auth-school-name">Faith Foundation School</h1>
          <p className="auth-tagline">Nurturing Minds, Building Futures</p>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back!</h2>
            <p>Please sign in to access your dashboard</p>
          </div>

          {loginError && (
            <div className="auth-alert alert-error">
              <FaShieldAlt className="alert-icon" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="usernameOrEmail">
                <FaEnvelope className="input-icon" />
                Username or Email
              </label>
              <input
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                placeholder="Enter your username or email"
                required
                className={loginError ? "error" : ""}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <FaLock className="input-icon" />
                Password
              </label>
              <div className={`password-input ${loginError ? "error" : ""}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <FaSpinner className="spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FaArrowRight className="button-icon" />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>New to Faith Foundation?</span>
          </div>

          <div className="auth-footer">
            <Link to="/register" className="register-button">
              <FaUserGraduate className="register-icon" />
              <div className="register-text">
                <span className="register-label">Create Account</span>
                <span className="register-subtitle">
                  Join our school community
                </span>
              </div>
              <FaArrowRight className="register-arrow" />
            </Link>
          </div>

          {/* Demo credentials hint */}
          <div className="auth-demo-hint">
            <p>Demo Credentials:</p>
            <small>admin@faithschool.edu / password123</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
