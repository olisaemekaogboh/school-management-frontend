// src/components/Register.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, setAuthToken } from "../services/api";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaPhone,
  FaUserPlus,
  FaGraduationCap,
  FaUsers,
  FaSearch,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";
import "./Auth.css";

function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [verificationData, setVerificationData] = useState({
    admissionNumber: "",
    parentEmail: "",
    parentPhone: "",
  });
  const [verifiedData, setVerifiedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { value: "STUDENT", label: "Student", icon: <FaGraduationCap /> },
    { value: "PARENT", label: "Parent", icon: <FaUsers /> },
    { value: "TEACHER", label: "Teacher", icon: <FaUser /> },
  ];

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleVerificationChange = (e) => {
    setVerificationData({
      ...verificationData,
      [e.target.name]: e.target.value,
    });
  };

  const verifyStudent = async () => {
    if (!verificationData.admissionNumber) {
      toast.error("Please enter your admission number");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/public/verify-student?admissionNumber=${encodeURIComponent(verificationData.admissionNumber)}`,
      );

      const data = await response.json();
      console.log("Student verification response:", data);

      if (data.success && data.data) {
        const student = data.data;
        setVerifiedData({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber,
          studentClass: student.studentClass,
          classArm: student.classArm,
        });

        setFormData({
          ...formData,
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          email: student.email || "",
          phoneNumber: student.phoneNumber || "",
          username: student.admissionNumber
            ? student.admissionNumber.replace(/\//g, "_")
            : verificationData.admissionNumber.replace(/\//g, "_"),
        });

        setStep(3);
        toast.success(
          `Student ${student.firstName} ${student.lastName} verified successfully!`,
        );
      } else {
        toast.error(data.message || "Student not found");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Student not found with this admission number");
    } finally {
      setVerifying(false);
    }
  };

  const verifyParent = async () => {
    if (!verificationData.parentEmail && !verificationData.parentPhone) {
      toast.error("Please enter either email or phone number");
      return;
    }

    setVerifying(true);
    try {
      let response;
      if (verificationData.parentEmail) {
        response = await fetch(
          `http://localhost:8080/api/public/verify-parent/email?email=${encodeURIComponent(verificationData.parentEmail)}`,
        );
      } else {
        response = await fetch(
          `http://localhost:8080/api/public/verify-parent/phone?phone=${encodeURIComponent(verificationData.parentPhone)}`,
        );
      }

      const data = await response.json();
      console.log("Parent verification response:", data);

      // FIXED: Check for data.parent instead of data.data
      if (data.success && data.parent) {
        const parent = data.parent;
        setVerifiedData({
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          phoneNumber: parent.phoneNumber,
        });

        setFormData({
          ...formData,
          firstName: parent.firstName || "",
          lastName: parent.lastName || "",
          email: parent.email || "",
          phoneNumber: parent.phoneNumber || "",
          username: parent.email
            ? parent.email.split("@")[0]
            : `parent_${parent.id}`,
        });

        setStep(3);
        toast.success(
          `Parent ${parent.firstName} ${parent.lastName} verified successfully!`,
        );
      } else {
        toast.error(data.message || "Parent not found");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Parent not found with the provided information");
    } finally {
      setVerifying(false);
    }
  };

  const verifyTeacher = () => {
    toast.info(
      "Teacher registration requires admin approval. Please contact the school administration.",
    );
    setRole("");
    setStep(1);
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    if (role === "STUDENT") {
      verifyStudent();
    } else if (role === "PARENT") {
      verifyParent();
    } else if (role === "TEACHER") {
      verifyTeacher();
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // In Register.js, replace the handleSubmit function with this:

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        role: role,
      };

      if (role === "STUDENT" && verifiedData) {
        registerData.studentId = verifiedData.id;
      } else if (role === "PARENT" && verifiedData) {
        registerData.parentId = verifiedData.id;
      }

      console.log("Registering with data:", registerData);

      const response = await authAPI.register(registerData);

      console.log("Registration response:", response.data);

      if (response.data.accessToken) {
        // Set the token in localStorage
        localStorage.setItem("accessToken", response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        // Also set in axios defaults
        import("../services/api").then((module) => {
          module.setAuthToken(
            response.data.accessToken,
            response.data.refreshToken,
            response.data.user,
          );
        });

        toast.success(
          "Registration successful! Welcome to Faith Foundation School.",
        );

        // Force a hard reload to home page
        // This ensures the AuthContext re-initializes with the new token
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setRole("");
      setVerifiedData(null);
    } else if (step === 3) {
      setStep(2);
      setVerifiedData(null);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>
            <FaUserPlus /> Create Account
          </h2>
          <p>Join Faith Foundation School Community</p>
        </div>

        {step === 1 && (
          <div className="role-selection">
            <h3>I am a:</h3>
            <div className="role-buttons">
              {roles.map((r) => (
                <button
                  key={r.value}
                  className="role-button"
                  onClick={() => handleRoleSelect(r.value)}
                  type="button"
                >
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && role === "STUDENT" && (
          <form onSubmit={handleVerificationSubmit} className="auth-form">
            <h3>Verify Student Record</h3>
            <p className="text-muted">Enter your admission number to verify</p>

            <div className="form-group">
              <label>
                <FaGraduationCap /> Admission Number
              </label>
              <div className="verification-input">
                <input
                  type="text"
                  name="admissionNumber"
                  value={verificationData.admissionNumber}
                  onChange={handleVerificationChange}
                  placeholder="e.g., NIS/2026/0004"
                  required
                />
                <button
                  type="submit"
                  className="verify-button"
                  disabled={verifying}
                >
                  {verifying ? <FaSpinner className="spin" /> : <FaSearch />}
                </button>
              </div>
            </div>

            <button type="button" className="back-button" onClick={goBack}>
              <FaArrowLeft /> Back
            </button>
          </form>
        )}

        {step === 2 && role === "PARENT" && (
          <form onSubmit={handleVerificationSubmit} className="auth-form">
            <h3>Verify Parent Record</h3>
            <p className="text-muted">
              Enter your email or phone number to verify
            </p>

            <div className="form-group">
              <label>
                <FaEnvelope /> Email
              </label>
              <input
                type="email"
                name="parentEmail"
                value={verificationData.parentEmail}
                onChange={handleVerificationChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>
                <FaPhone /> Phone Number
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={verificationData.parentPhone}
                onChange={handleVerificationChange}
                placeholder="Enter your phone number"
              />
            </div>

            <button type="submit" className="auth-button" disabled={verifying}>
              {verifying ? <FaSpinner className="spin" /> : "Verify"}
            </button>

            <button type="button" className="back-button" onClick={goBack}>
              <FaArrowLeft /> Back
            </button>
          </form>
        )}

        {step === 2 && role === "TEACHER" && (
          <div className="auth-form">
            <div className="info-message">
              <FaUser size={40} />
              <h3>Teacher Registration</h3>
              <p>
                Teacher accounts must be created by the school administration.
              </p>
              <p>Please contact the admin to create your account.</p>
            </div>
            <button type="button" className="back-button" onClick={goBack}>
              <FaArrowLeft /> Back
            </button>
          </div>
        )}

        {step === 3 && verifiedData && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="verified-badge">
              <FaCheckCircle /> Verified: {verifiedData.firstName}{" "}
              {verifiedData.lastName}
              {verifiedData.studentClass && (
                <span className="verified-detail">
                  {" "}
                  - {verifiedData.studentClass} {verifiedData.classArm || ""}
                </span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  readOnly={!!verifiedData}
                  className={verifiedData ? "readonly-field" : ""}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  readOnly={!!verifiedData}
                  className={verifiedData ? "readonly-field" : ""}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                minLength="3"
                placeholder="Choose a username"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                    placeholder="Enter password"
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
                <label>Confirm Password</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
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
            </div>

            <div className="form-actions">
              <button type="button" className="back-button" onClick={goBack}>
                <FaArrowLeft /> Back
              </button>
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? <FaSpinner className="spin" /> : "Register"}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
