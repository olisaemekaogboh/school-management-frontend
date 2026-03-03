// src/components/Login.js
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
} from "react-icons/fa";
import "./Auth.css";

function Login() {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(formData.usernameOrEmail, formData.password);

    if (success) {
      navigate(from, { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to Faith Foundation School</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              <FaEnvelope /> Username or Email
            </label>
            <input
              type="text"
              name="usernameOrEmail"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <FaLock /> Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
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
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <FaSpinner className="spin" /> : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>

        <div className="demo-credentials">
          <p className="text-muted mb-2">Demo Credentials:</p>
          <div className="demo-row">
            <span className="badge bg-primary me-2">👑 Admin:</span>
            admin@school.com / admin123
          </div>
          <div className="demo-row">
            <span className="badge bg-success me-2">👨‍🏫 Teacher:</span>
            teacher@school.com / teacher123
          </div>
          <div className="demo-row">
            <span className="badge bg-info me-2">👪 Parent:</span>
            parent@school.com / parent123
          </div>
          <div className="demo-row">
            <span className="badge bg-warning me-2" style={{ color: "#333" }}>
              <FaUserGraduate className="me-1" /> Student:
            </span>
            student@school.com / student123
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
