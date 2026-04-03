import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
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
  FaPen,
  FaUpload,
  FaTrash,
  FaCheck,
  FaTimes,
  FaBriefcase,
} from "react-icons/fa";
import SignatureCanvas from "react-signature-canvas";

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

  // Signature states
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureImageError, setSignatureImageError] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const sigPadRef = useRef(null);

  const labels = t?.profilePage || {};
  const common = t?.common || {};

  const dashboardPath = useMemo(() => {
    switch (user?.role) {
      case "ADMIN":
        return "/dashboard";
      case "TEACHER":
        return "/teacher-dashboard";
      case "STUDENT":
        return "/student-dashboard";
      case "PARENT":
        return "/parent-dashboard";
      default:
        return "/";
    }
  }, [user?.role]);

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
    setSignatureImageError(false);

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
    const nestedUser = raw.user || {};

    const profilePictureCandidate =
      raw.profilePictureUrl ||
      raw.profileImageUrl ||
      raw.photoUrl ||
      raw.imageUrl ||
      raw.passport ||
      raw.avatar ||
      nestedUser.profilePictureUrl ||
      nestedUser.profileImageUrl ||
      user?.profilePictureUrl ||
      "";

    const signatureCandidate =
      raw.signatureUrl ||
      raw.signature ||
      raw.user?.signatureUrl ||
      user?.signatureUrl ||
      "";

    const firstName =
      raw.firstName ||
      nestedUser.firstName ||
      user?.firstName ||
      raw.parentFirstName ||
      "";

    const middleName =
      raw.middleName || nestedUser.middleName || user?.middleName || "";

    const lastName =
      raw.lastName ||
      nestedUser.lastName ||
      user?.lastName ||
      raw.parentLastName ||
      "";

    const fullName =
      raw.fullName ||
      nestedUser.fullName ||
      user?.fullName ||
      [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

    return {
      firstName,
      middleName,
      lastName,
      fullName,
      email:
        raw.email || raw.parentEmail || nestedUser.email || user?.email || "",
      phone:
        raw.phone ||
        raw.phoneNumber ||
        raw.mobileNumber ||
        raw.parentPhone ||
        nestedUser.phone ||
        nestedUser.phoneNumber ||
        user?.phone ||
        user?.phoneNumber ||
        "",
      alternatePhone:
        raw.alternatePhone ||
        raw.alternatePhoneNumber ||
        raw.secondaryPhone ||
        "",
      address:
        raw.address ||
        raw.homeAddress ||
        nestedUser.address ||
        user?.address ||
        "",
      dateOfBirth:
        raw.dateOfBirth || nestedUser.dateOfBirth || user?.dateOfBirth || "",
      gender: raw.gender || nestedUser.gender || user?.gender || "",
      status: raw.status || nestedUser.status || user?.status || "",
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
      occupation:
        raw.occupation ||
        raw.jobTitle ||
        raw.profession ||
        nestedUser.occupation ||
        "",
      username: raw.username || nestedUser.username || user?.username || "",
      profilePictureUrl: buildImageUrl(profilePictureCandidate),

      signatureUrl: buildImageUrl(signatureCandidate),
      username: raw.username || user?.username || "",
      role: user?.role || raw.role || "",

      role: user?.role || raw.role || nestedUser.role || "",
      parentId: raw.parentId || raw.id || "",
      wardCount:
        raw.wardCount ||
        raw.childrenCount ||
        (Array.isArray(raw.children) ? raw.children.length : 0) ||
        (Array.isArray(raw.students) ? raw.students.length : 0) ||
        0,
    };
  }, [profileData, user]);

  // ================= SIGNATURE HANDLERS =================

  const handleSaveDrawnSignature = async () => {
    try {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        toast.error(
          labels.drawSignatureFirst || "Please draw your signature first",
        );
        return;
      }

      setUploadingSignature(true);
      const dataUrl = sigPadRef.current.toDataURL("image/png");

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "signature.png", {
        type: "image/png",
      });

      await userAPI.uploadSignature(file);

      toast.success(labels.signatureSaved || "Signature saved successfully");
      sigPadRef.current.clear();
      setShowSignaturePad(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      toast.error(labels.signatureSaveFailed || "Failed to save signature");
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleUploadSignature = async (file) => {
    if (!file) return;

    try {
      setUploadingSignature(true);
      await userAPI.uploadSignature(file);
      toast.success(
        labels.signatureUploaded || "Signature uploaded successfully",
      );
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      toast.error(labels.signatureUploadFailed || "Upload failed");
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleClearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  const handleCancelDrawing = () => {
    setShowSignaturePad(false);
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

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
                className={`${
                  darkMode ? "text-light-emphasis" : "text-muted"
                } small`}
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
            <Link
              to={dashboardPath}
              className="btn btn-outline-secondary btn-sm"
            >
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

                {user?.role === "PARENT" && mergedProfile.wardCount > 0 && (
                  <span className="badge text-bg-primary">
                    {labels.children || "Children"}: {mergedProfile.wardCount}
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
            className={`card border-0 shadow-sm h-100 ${
              darkMode ? "bg-dark text-light" : ""
            }`}
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
                    <>
                      <DetailCard
                        icon={<FaBriefcase />}
                        title={labels.occupation || "Occupation"}
                        value={mergedProfile.occupation}
                      />
                      <DetailCard
                        icon={<FaPhone />}
                        title={labels.alternatePhone || "Alternate Phone"}
                        value={mergedProfile.alternatePhone}
                      />
                      <DetailCard
                        icon={<FaUsers />}
                        title={labels.children || "Children"}
                        value={
                          mergedProfile.wardCount
                            ? String(mergedProfile.wardCount)
                            : labels.notAvailable || "Not available"
                        }
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Signature Card */}
          <div
            className={`card border-0 shadow-sm mb-4 ${darkMode ? "bg-dark text-light" : ""}`}
          >
            <div className="card-body p-4">
              <h4 className="mb-3 d-flex align-items-center gap-2">
                <FaPen />
                {labels.signature || "Signature"}
              </h4>

              {/* Current Signature Display */}
              <div className="text-center mb-3">
                {mergedProfile.signatureUrl && !signatureImageError ? (
                  <div className="border rounded p-2 bg-light">
                    <img
                      src={mergedProfile.signatureUrl}
                      alt="Signature"
                      style={{
                        maxHeight: "80px",
                        objectFit: "contain",
                      }}
                      onError={() => setSignatureImageError(true)}
                    />
                  </div>
                ) : (
                  <div
                    className={`border rounded p-3 text-center ${darkMode ? "border-secondary" : ""}`}
                  >
                    <div className="text-muted small">
                      {labels.noSignature || "No signature uploaded"}
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Buttons */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowSignaturePad(!showSignaturePad)}
                  disabled={uploadingSignature}
                >
                  <FaPen className="me-1" />
                  {showSignaturePad
                    ? labels.cancelDrawing || "Cancel Drawing"
                    : labels.drawSignature || "Draw Signature"}
                </button>

                <label
                  className={`btn btn-outline-secondary btn-sm mb-0 ${uploadingSignature ? "disabled" : ""}`}
                >
                  <FaUpload className="me-1" />
                  {labels.uploadSignature || "Upload"}
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadSignature(file);
                    }}
                    disabled={uploadingSignature}
                  />
                </label>
              </div>

              {/* Signature Drawing Pad */}
              {showSignaturePad && (
                <div
                  className={`border rounded p-2 ${darkMode ? "border-secondary" : ""}`}
                >
                  <SignatureCanvas
                    ref={sigPadRef}
                    penColor={darkMode ? "#ffffff" : "#000000"}
                    backgroundColor={darkMode ? "#1f2937" : "#ffffff"}
                    canvasProps={{
                      width: "100%",
                      height: 150,
                      className: "signature-canvas w-100",
                      style: {
                        border: `1px solid ${darkMode ? "#374151" : "#dee2e6"}`,
                        borderRadius: "4px",
                        background: darkMode ? "#1f2937" : "#ffffff",
                      },
                    }}
                  />
                  <div className="d-flex justify-content-between gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-warning"
                      onClick={handleClearSignature}
                      disabled={uploadingSignature}
                    >
                      <FaTrash className="me-1" />
                      {labels.clear || "Clear"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={handleCancelDrawing}
                      disabled={uploadingSignature}
                    >
                      <FaTimes className="me-1" />
                      {labels.cancel || "Cancel"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={handleSaveDrawnSignature}
                      disabled={uploadingSignature}
                    >
                      {uploadingSignature ? (
                        <span className="spinner-border spinner-border-sm me-1" />
                      ) : (
                        <FaCheck className="me-1" />
                      )}
                      {labels.save || "Save"}
                    </button>
                  </div>
                </div>
              )}

              {uploadingSignature && (
                <div className="text-center mt-2">
                  <div className="spinner-border spinner-border-sm text-primary me-2" />
                  <span className="small">
                    {common.uploading || "Uploading..."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preferences Card */}
          <div
            className={`card border-0 shadow-sm mb-4 ${
              darkMode ? "bg-dark text-light" : ""
            }`}
          >
            <div className="card-body p-4">
              <h4 className="mb-3">{labels.preferences || "Preferences"}</h4>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <FaLanguage className="me-2" />
                  {common.language || "Language"}
                </label>
                <select
                  className={`form-select ${
                    darkMode ? "bg-dark text-light border-secondary" : ""
                  }`}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">{labels.english || "English"}</option>
                  <option value="fr">{labels.french || "French"}</option>
                  <option value="ig">{labels.igbo || "Igbo"}</option>
                </select>
              </div>

              <div
                className={`d-flex align-items-center justify-content-between border rounded p-3 ${
                  darkMode ? "border-secondary" : ""
                }`}
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

          {/* Account Summary Card */}
          <div
            className={`card border-0 shadow-sm ${
              darkMode ? "bg-dark text-light" : ""
            }`}
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
              <div className="fw-semibold mb-3">
                {mergedProfile.fullName || labels.noName || "No name available"}
              </div>

              {user?.role === "PARENT" && (
                <>
                  <div
                    className={
                      darkMode
                        ? "small text-light-emphasis mb-2"
                        : "small text-muted mb-2"
                    }
                  >
                    {labels.children || "Children"}
                  </div>
                  <div className="fw-semibold">
                    {mergedProfile.wardCount || 0}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
