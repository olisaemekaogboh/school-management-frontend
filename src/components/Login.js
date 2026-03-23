import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
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
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const loginT = t?.login || {};
  const registerT = t?.register || {};

  useEffect(() => {
    if (user) {
      if (user.role === "ADMIN") navigate("/dashboard", { replace: true });
      else if (user.role === "TEACHER")
        navigate("/teacher-dashboard", { replace: true });
      else if (user.role === "STUDENT")
        navigate("/student-dashboard", { replace: true });
      else if (user.role === "PARENT")
        navigate("/parent-dashboard", { replace: true });
      else navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

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
    if (loginError) setLoginError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.usernameOrEmail.trim()) {
      setLoginError(
        loginT.enterUsername || "Please enter your username or email",
      );
      return;
    }

    if (!formData.password) {
      setLoginError(loginT.enterPassword || "Please enter your password");
      return;
    }

    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", formData.usernameOrEmail);
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      const result = await login(formData.usernameOrEmail, formData.password);

      if (result?.success === false) {
        setLoginError(
          result.message ||
            loginT.invalidCredentials ||
            "Invalid username/email or password. Please try again.",
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(
        error?.response?.data?.message ||
          loginT.loginError ||
          "An error occurred during login. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-decoration">
        <div className="auth-circle auth-circle-1"></div>
        <div className="auth-circle auth-circle-2"></div>
        <div className="auth-circle auth-circle-3"></div>
      </div>

      <div className="auth-card-wrapper">
        <div className="auth-brand">
          <div className="auth-logo">
            <FaSchool className="auth-logo-icon" />
          </div>
          <h1 className="auth-school-name">
            {loginT.schoolName || "Faith Foundation School"}
          </h1>
          <p className="auth-tagline">
            {loginT.tagline || "Nurturing Minds, Building Futures"}
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h2>{loginT.welcomeBack || "Welcome Back!"}</h2>
            <p>
              {loginT.signInPrompt || "Please sign in to access your dashboard"}
            </p>
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
                {loginT.usernameOrEmail || "Username or Email"}
              </label>
              <input
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                placeholder={
                  loginT.usernameOrEmailPlaceholder ||
                  "Enter your username or email"
                }
                required
                className={loginError ? "error" : ""}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <FaLock className="input-icon" />
                {loginT.password || "Password"}
              </label>
              <div className={`password-input ${loginError ? "error" : ""}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    loginT.passwordPlaceholder || "Enter your password"
                  }
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? loginT.hidePassword || "Hide password"
                      : loginT.showPassword || "Show password"
                  }
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
                {loginT.rememberMe || "Remember me"}
              </label>
              <Link to="/forgot-password" className="forgot-password">
                {loginT.forgotPassword || "Forgot Password?"}
              </Link>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <FaSpinner className="spin" />
                  <span>{loginT.signingIn || "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{loginT.signIn || "Sign In"}</span>
                  <FaArrowRight className="button-icon" />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>
              {registerT.joinCommunityShort || "New to Faith Foundation?"}
            </span>
          </div>

          <div className="auth-footer">
            <Link to="/register" className="register-button">
              <FaUserGraduate className="register-icon" />
              <div className="register-text">
                <span className="register-label">
                  {registerT.createAccount || "Create Account"}
                </span>
                <span className="register-subtitle">
                  {registerT.joinCommunity || "Join our school community"}
                </span>
              </div>
              <FaArrowRight className="register-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
