import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import { useLanguage } from "../contexts/LanguageContext";
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
  const { t } = useLanguage();

  const roles = [
    { value: "STUDENT", label: t.register.student, icon: <FaGraduationCap /> },
    { value: "PARENT", label: t.register.parent, icon: <FaUsers /> },
    { value: "TEACHER", label: t.register.teacher, icon: <FaUser /> },
  ];

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleVerificationChange = (e) => {
    setVerificationData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const verifyStudent = async () => {
    if (!verificationData.admissionNumber) {
      toast.error(t.register.enterAdmissionNumber);
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/public/verify-student?admissionNumber=${encodeURIComponent(
          verificationData.admissionNumber.trim(),
        )}`,
      );

      if (!response.ok) throw new Error("Student not found");

      const student = await response.json();

      setVerifiedData({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        studentClass: student.studentClass,
        classArm: student.classArm,
      });

      setFormData((prev) => ({
        ...prev,
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        email: student.email || "",
        phoneNumber: student.phoneNumber || "",
        username: (
          student.admissionNumber || verificationData.admissionNumber
        ).replace(/\//g, "_"),
      }));

      setStep(3);
      toast.success(
        `Student ${student.firstName} ${student.lastName} ${t.register.studentVerified}`,
      );
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(t.register.studentNotFound);
    } finally {
      setVerifying(false);
    }
  };

  const verifyParent = async () => {
    if (!verificationData.parentEmail && !verificationData.parentPhone) {
      toast.error(t.register.enterEmailOrPhone);
      return;
    }

    setVerifying(true);
    try {
      let response;
      if (verificationData.parentEmail) {
        response = await fetch(
          `http://localhost:8080/api/public/verify-parent/email?email=${encodeURIComponent(
            verificationData.parentEmail,
          )}`,
        );
      } else {
        response = await fetch(
          `http://localhost:8080/api/public/verify-parent/phone?phone=${encodeURIComponent(
            verificationData.parentPhone,
          )}`,
        );
      }

      const data = await response.json();

      if (data.success && data.parent) {
        const parent = data.parent;

        setVerifiedData({
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          phoneNumber: parent.phoneNumber,
        });

        setFormData((prev) => ({
          ...prev,
          firstName: parent.firstName || "",
          lastName: parent.lastName || "",
          email: parent.email || "",
          phoneNumber: parent.phoneNumber || "",
          username: parent.email
            ? parent.email.split("@")[0]
            : `parent_${parent.id}`,
        }));

        setStep(3);
        toast.success(
          `Parent ${parent.firstName} ${parent.lastName} ${t.register.parentVerified}`,
        );
      } else {
        toast.error(data.message || t.register.parentNotFound);
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(t.register.parentNotFound);
    } finally {
      setVerifying(false);
    }
  };

  const verifyTeacher = () => {
    toast.info(t.register.teacherApproval);
    setRole("");
    setStep(1);
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    if (role === "STUDENT") verifyStudent();
    else if (role === "PARENT") verifyParent();
    else if (role === "TEACHER") verifyTeacher();
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t.register.passwordsMismatch);
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t.register.passwordTooShort);
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
        role,
      };

      if (role === "STUDENT" && verifiedData)
        registerData.studentId = verifiedData.id;
      else if (role === "PARENT" && verifiedData)
        registerData.parentId = verifiedData.id;

      const response = await authAPI.register(registerData);

      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        toast.success(t.register.registrationSuccess);
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message || t.register.registrationFailed,
      );
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
            <FaUserPlus /> {t.register.createAccount}
          </h2>
          <p>{t.register.joinCommunity}</p>
        </div>

        {step === 1 && (
          <div className="role-selection">
            <h3>{t.register.iAmA}</h3>
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
            <h3>{t.register.verifyStudentRecord}</h3>
            <p className="text-muted">{t.register.verifyAdmissionPrompt}</p>

            <div className="form-group">
              <label>
                <FaGraduationCap /> {t.register.admissionNumber}
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
              <FaArrowLeft /> {t.common.back}
            </button>
          </form>
        )}

        {step === 2 && role === "PARENT" && (
          <form onSubmit={handleVerificationSubmit} className="auth-form">
            <h3>{t.register.verifyParentRecord}</h3>
            <p className="text-muted">{t.register.verifyParentPrompt}</p>

            <div className="form-group">
              <label>
                <FaEnvelope /> {t.register.email}
              </label>
              <input
                type="email"
                name="parentEmail"
                value={verificationData.parentEmail}
                onChange={handleVerificationChange}
                placeholder={t.register.enterEmail}
              />
            </div>

            <div className="form-group">
              <label>
                <FaPhone /> {t.register.phoneNumber}
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={verificationData.parentPhone}
                onChange={handleVerificationChange}
                placeholder={t.register.enterPhone}
              />
            </div>

            <button type="submit" className="auth-button" disabled={verifying}>
              {verifying ? <FaSpinner className="spin" /> : t.common.verify}
            </button>

            <button type="button" className="back-button" onClick={goBack}>
              <FaArrowLeft /> {t.common.back}
            </button>
          </form>
        )}

        {step === 2 && role === "TEACHER" && (
          <div className="auth-form">
            <div className="info-message">
              <FaUser size={40} />
              <h3>{t.register.teacherRegistration}</h3>
              <p>{t.register.teacherApprovalShort}</p>
              <p>{t.register.contactAdmin}</p>
            </div>
            <button type="button" className="back-button" onClick={goBack}>
              <FaArrowLeft /> {t.common.back}
            </button>
          </div>
        )}

        {step === 3 && verifiedData && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="verified-badge">
              <FaCheckCircle /> {t.register.verified}: {verifiedData.firstName}{" "}
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
                <label>{t.register.firstName}</label>
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
                <label>{t.register.lastName}</label>
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
              <label>{t.register.username}</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                minLength="3"
                placeholder={t.register.chooseUsername}
              />
            </div>

            <div className="form-group">
              <label>{t.register.email}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder={t.register.enterEmail}
              />
            </div>

            <div className="form-group">
              <label>
                {t.register.phoneNumber} ({t.register.optional})
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder={t.register.enterPhone}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.register.password}</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                    placeholder={t.register.enterPassword}
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
                <label>{t.register.confirmPassword}</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder={t.register.confirmPasswordPlaceholder}
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

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <FaSpinner className="spin" /> {t.common.loading}
                </>
              ) : (
                <>
                  <FaUserPlus /> {t.register.createAccount}
                </>
              )}
            </button>

            <button type="button" className="back-button" onClick={goBack}>
              <FaArrowLeft /> {t.common.back}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Register;
