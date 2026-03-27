import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaIdCard,
  FaUserShield,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUsers,
  FaMoon,
  FaSun,
  FaLanguage,
  FaSyncAlt,
  FaCog,
  FaArrowLeft,
} from "react-icons/fa";

import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  userAPI,
  studentAPI,
  teacherAPI,
  parentPortalAPI,
} from "../services/api";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "https://localhost:8443";

const buildImageUrl = (value) => {
  if (!value) return "";

  const cleaned = String(value).trim();
  if (!cleaned) return "";

  if (
    cleaned.startsWith("http://") ||
    cleaned.startsWith("https://") ||
    cleaned.startsWith("data:image/")
  ) {
    return cleaned;
  }

  if (cleaned.startsWith("/uploads/")) {
    return `${API_BASE}${cleaned}`;
  }

  if (cleaned.startsWith("uploads/")) {
    return `${API_BASE}/${cleaned}`;
  }

  const filename = cleaned.split("/").pop();
  return `${API_BASE}/uploads/${filename}`;
};

function Profile() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const labels = t?.profilePage || {};
  const common = t?.common || {};

  const roleLabel = useMemo(() => {
    switch (user?.role) {
      case "ADMIN":
        return labels.admin || "Administrator";
      case "TEACHER":
        return labels.teacher || "Teacher";
      case "STUDENT":
        return labels.student || "Student";
      case "PARENT":
        return labels.parent || "Parent";
      default:
        return user?.role || labels.user || "User";
    }
  }, [user?.role, labels]);

  const profileIcon = useMemo(() => {
    switch (user?.role) {
      case "ADMIN":
        return <FaUserShield size={24} />;
      case "TEACHER":
        return <FaChalkboardTeacher size={24} />;
      case "STUDENT":
        return <FaGraduationCap size={24} />;
      case "PARENT":
        return <FaUsers size={24} />;
      default:
        return <FaUserCircle size={24} />;
    }
  }, [user?.role]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setImageError(false);

    try {
      let response;

      if (user?.role === "STUDENT") {
        response = await studentAPI.getMyProfile();
      } else if (user?.role === "TEACHER") {
        response = await teacherAPI.getMyTeacherProfile();
      } else if (user?.role === "PARENT") {
        response = await parentPortalAPI.getMyProfile();
      } else {
        response = await userAPI.getCurrentUser();
      }

      setProfileData(response?.data || null);
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfileData(null);
      toast.error(
        error?.response?.data?.message ||
          labels.loadFailed ||
          "Failed to load profile details",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.role, labels.loadFailed]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile, refreshKey]);

  const mergedProfile = useMemo(() => {
    const raw = profileData || {};

    const profilePictureCandidate =
      raw.profilePictureUrl ||
      raw.profileImageUrl ||
      raw.photoUrl ||
      raw.imageUrl ||
      raw.passport ||
      raw.user?.profilePictureUrl ||
      user?.profilePictureUrl ||
      "";

    return {
      firstName: raw.firstName || user?.firstName || "",
      middleName: raw.middleName || user?.middleName || "",
      lastName: raw.lastName || user?.lastName || "",
      fullName:
        raw.fullName ||
        user?.fullName ||
        [
          raw.firstName || user?.firstName,
          raw.middleName || user?.middleName,
          raw.lastName || user?.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      email: raw.email || user?.email || "",
      phone:
        raw.phone ||
        raw.phoneNumber ||
        raw.user?.phoneNumber ||
        user?.phone ||
        user?.phoneNumber ||
        "",
      address: raw.address || raw.user?.address || user?.address || "",
      dateOfBirth: raw.dateOfBirth || user?.dateOfBirth || "",
      gender: raw.gender || user?.gender || "",
      status: raw.status || user?.status || "",
      admissionNumber:
        raw.admissionNumber || raw.admissionNo || user?.admissionNumber || "",
      employeeId: raw.employeeId || raw.staffId || raw.teacherId || "",
      className:
        raw.studentClass ||
        raw.className ||
        raw.schoolClass?.className ||
        raw.classCode ||
        user?.studentClass ||
        "",
      classArm:
        raw.classArm || raw.arm || raw.schoolClass?.arm || user?.classArm || "",
      classCode:
        raw.classCode ||
        (raw.schoolClass?.className && raw.schoolClass?.arm
          ? `${raw.schoolClass.className} ${raw.schoolClass.arm}`
          : "") ||
        user?.classCode ||
        "",
      department: raw.department || "",
      qualification:
        raw.qualification ||
        (Array.isArray(raw.qualifications)
          ? raw.qualifications.join(", ")
          : ""),
      occupation: raw.occupation || "",
      profilePictureUrl: buildImageUrl(profilePictureCandidate),
      username: raw.username || user?.username || "",
      role: user?.role || raw.role || "",
    };
  }, [profileData, user]);

  const classDisplay =
    mergedProfile.classCode ||
    [mergedProfile.className, mergedProfile.classArm].filter(Boolean).join(" ");

  const formatDate = (value) => {
    if (!value) return labels.notAvailable || "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const DetailCard = ({ icon, title, value }) => (
    <div className="col-md-6 col-xl-4">
      <div
        className={`card h-100 shadow-sm border-0 ${
          darkMode ? "bg-dark text-light" : ""
        }`}
      >
        <div className="card-body">
          <div className="d-flex align-items-start gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 48,
                height: 48,
                background: "rgba(13, 110, 253, 0.12)",
              }}
            >
              {icon}
            </div>
            <div>
              <div
                className={`${darkMode ? "text-light-emphasis" : "text-muted"} small`}
              >
                {title}
              </div>
              <div className="fw-semibold">
                {value || labels.notAvailable || "Not available"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`container py-4 ${darkMode ? "text-light" : ""}`}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
              <FaArrowLeft className="me-2" />
              {common.back || "Back"}
            </Link>
          </div>
          <h2 className="mb-1">{labels.title || "My Profile"}</h2>
          <p
            className={
              darkMode ? "text-light-emphasis mb-0" : "text-muted mb-0"
            }
          >
            {labels.subtitle ||
              "View your account details, language preference, and appearance settings"}
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            <FaSyncAlt className="me-2" />
            {common.refresh || "Refresh"}
          </button>
          <Link to="/settings" className="btn btn-primary">
            <FaCog className="me-2" />
            {common.settings || "Settings"}
          </Link>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4 overflow-hidden">
        <div
          className="p-4"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, #1f2937, #111827)"
              : "linear-gradient(135deg, #0d6efd, #6610f2)",
            color: "#fff",
          }}
        >
          <div className="row align-items-center g-4">
            <div className="col-md-auto">
              {mergedProfile.profilePictureUrl && !imageError ? (
                <img
                  src={mergedProfile.profilePictureUrl}
                  alt={mergedProfile.fullName || "Profile"}
                  className="rounded-circle border border-3 border-white"
                  style={{ width: 110, height: 110, objectFit: "cover" }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div
                  className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center"
                  style={{ width: 110, height: 110, fontSize: 56 }}
                >
                  <FaUserCircle />
                </div>
              )}
            </div>

            <div className="col">
              <div className="d-flex align-items-center gap-2 mb-2">
                {profileIcon}
                <span className="badge text-bg-light">{roleLabel}</span>
              </div>
              <h3 className="mb-1">
                {mergedProfile.fullName || labels.noName || "No name available"}
              </h3>
              <p className="mb-2 opacity-75">
                {mergedProfile.email || labels.noEmail || "No email available"}
              </p>
              <div className="d-flex flex-wrap gap-2">
                {mergedProfile.status && (
                  <span className="badge text-bg-success">
                    {labels.status || "Status"}: {mergedProfile.status}
                  </span>
                )}
                {user?.role === "STUDENT" && classDisplay && (
                  <span className="badge text-bg-info">
                    {labels.classLabel || "Class"}: {classDisplay}
                  </span>
                )}
                {mergedProfile.admissionNumber && (
                  <span className="badge text-bg-warning">
                    {labels.admissionNumber || "Admission Number"}:{" "}
                    {mergedProfile.admissionNumber}
                  </span>
                )}
                {mergedProfile.employeeId && (
                  <span className="badge text-bg-secondary">
                    {labels.employeeId || "Employee ID"}:{" "}
                    {mergedProfile.employeeId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div
            className={`card border-0 shadow-sm h-100 ${darkMode ? "bg-dark text-light" : ""}`}
          >
            <div className="card-body p-4">
              <h4 className="mb-3">
                {labels.personalInformation || "Personal Information"}
              </h4>

              {loading ? (
                <div
                  className={darkMode ? "text-light-emphasis" : "text-muted"}
                >
                  {common.loading || "Loading..."}
                </div>
              ) : (
                <div className="row g-3">
                  <DetailCard
                    icon={<FaEnvelope />}
                    title={labels.email || "Email"}
                    value={mergedProfile.email}
                  />
                  <DetailCard
                    icon={<FaPhone />}
                    title={labels.phone || "Phone"}
                    value={mergedProfile.phone}
                  />
                  <DetailCard
                    icon={<FaMapMarkerAlt />}
                    title={labels.address || "Address"}
                    value={mergedProfile.address}
                  />
                  <DetailCard
                    icon={<FaCalendarAlt />}
                    title={labels.dateOfBirth || "Date of Birth"}
                    value={formatDate(mergedProfile.dateOfBirth)}
                  />
                  <DetailCard
                    icon={<FaUserCircle />}
                    title={labels.gender || "Gender"}
                    value={mergedProfile.gender}
                  />
                  <DetailCard
                    icon={<FaIdCard />}
                    title={labels.username || "Username"}
                    value={mergedProfile.username}
                  />

                  {user?.role === "STUDENT" && (
                    <>
                      <DetailCard
                        icon={<FaGraduationCap />}
                        title={labels.admissionNumber || "Admission Number"}
                        value={mergedProfile.admissionNumber}
                      />
                      <DetailCard
                        icon={<FaGraduationCap />}
                        title={labels.classLabel || "Class"}
                        value={classDisplay}
                      />
                    </>
                  )}

                  {user?.role === "TEACHER" && (
                    <>
                      <DetailCard
                        icon={<FaChalkboardTeacher />}
                        title={labels.employeeId || "Staff ID"}
                        value={mergedProfile.employeeId}
                      />
                      <DetailCard
                        icon={<FaChalkboardTeacher />}
                        title={labels.qualification || "Qualification"}
                        value={mergedProfile.qualification}
                      />
                    </>
                  )}

                  {user?.role === "PARENT" && (
                    <DetailCard
                      icon={<FaUsers />}
                      title={labels.occupation || "Occupation"}
                      value={mergedProfile.occupation}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div
            className={`card border-0 shadow-sm mb-4 ${darkMode ? "bg-dark text-light" : ""}`}
          >
            <div className="card-body p-4">
              <h4 className="mb-3">{labels.preferences || "Preferences"}</h4>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <FaLanguage className="me-2" />
                  {common.language || "Language"}
                </label>
                <select
                  className={`form-select ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">{labels.english || "English"}</option>
                  <option value="fr">{labels.french || "French"}</option>
                  <option value="ig">{labels.igbo || "Igbo"}</option>
                </select>
              </div>

              <div
                className={`d-flex align-items-center justify-content-between border rounded p-3 ${darkMode ? "border-secondary" : ""}`}
              >
                <div>
                  <div className="fw-semibold">{labels.theme || "Theme"}</div>
                  <div
                    className={
                      darkMode
                        ? "text-light-emphasis small"
                        : "text-muted small"
                    }
                  >
                    {darkMode
                      ? labels.darkModeEnabled || "Dark mode is enabled"
                      : labels.lightModeEnabled || "Light mode is enabled"}
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn ${darkMode ? "btn-warning" : "btn-dark"}`}
                  onClick={toggleDarkMode}
                >
                  {darkMode ? (
                    <>
                      <FaSun className="me-2" />
                      {labels.lightMode || "Light"}
                    </>
                  ) : (
                    <>
                      <FaMoon className="me-2" />
                      {labels.darkMode || "Dark"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div
            className={`card border-0 shadow-sm ${darkMode ? "bg-dark text-light" : ""}`}
          >
            <div className="card-body p-4">
              <h4 className="mb-3">
                {labels.accountSummary || "Account Summary"}
              </h4>

              <div
                className={
                  darkMode
                    ? "small text-light-emphasis mb-2"
                    : "small text-muted mb-2"
                }
              >
                {labels.role || "Role"}
              </div>
              <div className="fw-semibold mb-3">{roleLabel}</div>

              <div
                className={
                  darkMode
                    ? "small text-light-emphasis mb-2"
                    : "small text-muted mb-2"
                }
              >
                {labels.status || "Status"}
              </div>
              <div className="fw-semibold mb-3">
                {mergedProfile.status || labels.notAvailable || "Not available"}
              </div>

              <div
                className={
                  darkMode
                    ? "small text-light-emphasis mb-2"
                    : "small text-muted mb-2"
                }
              >
                {labels.fullName || "Full Name"}
              </div>
              <div className="fw-semibold">
                {mergedProfile.fullName || labels.noName || "No name available"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
