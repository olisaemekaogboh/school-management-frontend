import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import {
  FaChalkboardTeacher,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaSync,
  FaFilePdf,
  FaFileExcel,
  FaTimes,
  FaSpinner,
  FaUser,
} from "react-icons/fa";
import { teacherAPI, subjectAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import "./TeacherManagement.css";

const initialFormState = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  phoneNumber: "",
  alternatePhone: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  qualification: "",
  specialization: "",
  department: "",
  designation: "",
  yearsOfExperience: "",
  employeeId: "",
  employmentStatus: "ACTIVE",
  employmentType: "FULL_TIME",
  dateOfJoining: moment().format("YYYY-MM-DD"),
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  maritalStatus: "",
  subjects: [],
  qualifications: [],
};

const employmentStatuses = [
  "ACTIVE",
  "ON_LEAVE",
  "INACTIVE",
  "TERMINATED",
  "RETIRED",
  "RESIGNED",
];

const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"];
const genders = ["MALE", "FEMALE"];
const maritalStatuses = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];

function TeacherManagement() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [teachers, setTeachers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);

  const [formData, setFormData] = useState(initialFormState);
  const [profilePicture, setProfilePicture] = useState(null);
  const [newQualification, setNewQualification] = useState("");

  const API_BASE =
    process.env.REACT_APP_API_BASE_URL?.replace("/api", "") ||
    "https://localhost:8443";

  const getTeacherImageSrc = useCallback(
    (teacher) => {
      if (!teacher) return "";

      const raw =
        teacher.profilePictureUrl ||
        teacher.profileImageUrl ||
        teacher.imageUrl ||
        teacher.photoUrl ||
        "";

      if (!raw) return "";

      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return raw;
      }

      if (raw.startsWith("/uploads/")) {
        return `${API_BASE}${raw}`;
      }

      return `${API_BASE}/uploads/${raw.replace(/^.*[\\/]/, "")}`;
    },
    [API_BASE],
  );

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teacherAPI.getAllTeachers();
      setTeachers(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error(
        t?.teacherManagement?.loadFailed || "Failed to load teachers",
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await teacherAPI.getTeacherStatistics();
      setStatistics(response?.data || null);
    } catch (error) {
      console.error(error);
      setStatistics(null);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    try {
      const response = await subjectAPI.getAllSubjects();
      const rawSubjects = Array.isArray(response?.data) ? response.data : [];

      const normalizedSubjects = rawSubjects
        .map((subject) => {
          if (typeof subject === "string") return subject;

          return (
            subject?.name ||
            subject?.subjectName ||
            subject?.title ||
            subject?.code ||
            ""
          );
        })
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      setSubjects(normalizedSubjects);
    } catch (error) {
      console.error(error);
      setSubjects([]);
      toast.error(
        t?.teacherManagement?.subjectLoadFailed || "Failed to load subjects",
      );
    } finally {
      setSubjectsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTeachers();
    fetchStatistics();
    fetchSubjects();
  }, [fetchTeachers, fetchStatistics, fetchSubjects]);

  const filteredTeachers = useMemo(() => {
    let data = [...teachers];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((teacher) => {
        const values = [
          teacher.firstName,
          teacher.lastName,
          teacher.middleName,
          teacher.email,
          teacher.phoneNumber,
          teacher.employeeId,
          teacher.teacherId,
          teacher.specialization,
          teacher.department,
          teacher.designation,
          ...(Array.isArray(teacher.subjects) ? teacher.subjects : []),
        ]
          .filter(Boolean)
          .map(String)
          .map((v) => v.toLowerCase());

        return values.some((v) => v.includes(term));
      });
    }

    if (filterStatus !== "all") {
      data = data.filter(
        (teacher) =>
          (teacher.employmentStatus || teacher.status || "").toUpperCase() ===
          filterStatus,
      );
    }

    return data;
  }, [teachers, searchTerm, filterStatus]);

  const resetForm = () => {
    setFormData(initialFormState);
    setProfilePicture(null);
    setNewQualification("");
    setEditingTeacher(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      middleName: teacher.middleName || "",
      email: teacher.email || "",
      phoneNumber: teacher.phoneNumber || "",
      alternatePhone: teacher.alternatePhone || "",
      gender: teacher.gender || "",
      dateOfBirth: teacher.dateOfBirth || "",
      address: teacher.address || "",
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
      department: teacher.department || "",
      designation: teacher.designation || "",
      yearsOfExperience:
        teacher.yearsOfExperience === null ||
        teacher.yearsOfExperience === undefined
          ? ""
          : String(teacher.yearsOfExperience),
      employeeId: teacher.employeeId || "",
      employmentStatus: teacher.employmentStatus || teacher.status || "ACTIVE",
      employmentType: teacher.employmentType || "FULL_TIME",
      dateOfJoining: teacher.dateOfJoining || moment().format("YYYY-MM-DD"),
      emergencyContactName: teacher.emergencyContactName || "",
      emergencyContactPhone: teacher.emergencyContactPhone || "",
      emergencyContactRelationship: teacher.emergencyContactRelationship || "",
      maritalStatus: teacher.maritalStatus || "",
      subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
      qualifications: Array.isArray(teacher.qualifications)
        ? teacher.qualifications
        : [],
    });
    setProfilePicture(null);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value, options } = e.target;

    if (name === "subjects") {
      const selectedValues = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);

      setFormData((prev) => ({
        ...prev,
        subjects: selectedValues,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicture(file);
  };

  const addQualification = () => {
    const value = newQualification.trim();
    if (!value) return;
    if (formData.qualifications.includes(value)) return;

    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, value],
    }));
    setNewQualification("");
  };

  const removeQualification = (qualification) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((q) => q !== qualification),
    }));
  };

  const buildTeacherPayload = () => ({
    ...formData,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    middleName: formData.middleName.trim(),
    email: formData.email.trim(),
    phoneNumber: formData.phoneNumber.trim(),
    alternatePhone: formData.alternatePhone.trim(),
    address: formData.address.trim(),
    qualification: formData.qualification.trim(),
    specialization: formData.specialization.trim(),
    department: formData.department.trim(),
    designation: formData.designation.trim(),
    employeeId: formData.employeeId.trim(),
    emergencyContactName: formData.emergencyContactName.trim(),
    emergencyContactPhone: formData.emergencyContactPhone.trim(),
    emergencyContactRelationship: formData.emergencyContactRelationship.trim(),
    yearsOfExperience: formData.yearsOfExperience
      ? Number(formData.yearsOfExperience)
      : null,
    subjects: formData.subjects || [],
    qualifications: formData.qualifications || [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = buildTeacherPayload();
      const multipart = new FormData();

      multipart.append(
        "teacher",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );

      if (profilePicture) {
        multipart.append("profilePicture", profilePicture);
      }

      if (editingTeacher) {
        await teacherAPI.updateTeacher(editingTeacher.id, multipart);
        toast.success(
          t?.teacherManagement?.updateSuccess || "Teacher updated successfully",
        );
      } else {
        await teacherAPI.createTeacher(multipart);
        toast.success(
          t?.teacherManagement?.createSuccess || "Teacher created successfully",
        );
      }

      setShowForm(false);
      resetForm();
      await fetchTeachers();
      await fetchStatistics();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          t?.teacherManagement?.saveFailed ||
          "Failed to save teacher",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teacher) => {
    const confirmed = window.confirm(
      `Delete ${teacher.firstName || ""} ${teacher.lastName || ""}?`,
    );
    if (!confirmed) return;

    try {
      await teacherAPI.deleteTeacher(teacher.id);
      toast.success(
        t?.teacherManagement?.deleteSuccess || "Teacher deleted successfully",
      );
      await fetchTeachers();
      await fetchStatistics();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          t?.teacherManagement?.deleteFailed ||
          "Failed to delete teacher",
      );
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await teacherAPI.exportToPDF();
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teachers_${moment().format("YYYY-MM-DD")}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await teacherAPI.exportToExcel();
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teachers_${moment().format("YYYY-MM-DD")}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel");
    }
  };

  return (
    <div className={`teacher-management ${darkMode ? "dark-mode" : ""}`}>
      <div className="page-header">
        <div>
          <h2>
            <FaChalkboardTeacher />{" "}
            {t?.teacherManagement?.title || "Teacher Management"}
          </h2>
          <p>{t?.teacherManagement?.subtitle || "Manage staff records"}</p>
        </div>

        <div
          className="header-actions"
          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          <button className="btn btn-secondary" onClick={fetchTeachers}>
            <FaSync /> {t?.common?.refresh || "Refresh"}
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FaFilePdf /> PDF
          </button>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <FaFileExcel /> Excel
          </button>
          <button className="btn btn-primary" onClick={openCreateForm}>
            <FaPlus /> {t?.teacherManagement?.addTeacher || "Add Teacher"}
          </button>
        </div>
      </div>

      {statistics && (
        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div className="stat-card">
            <h3>{statistics.totalTeachers ?? 0}</h3>
            <p>{t?.teacherManagement?.totalTeachers || "Total Teachers"}</p>
          </div>
          <div className="stat-card">
            <h3>{statistics.activeTeachers ?? 0}</h3>
            <p>{t?.teacherManagement?.activeTeachers || "Active Teachers"}</p>
          </div>
          <div className="stat-card">
            <h3>
              {statistics.inactiveTeachers ??
                statistics.inactive ??
                statistics.totalInactiveTeachers ??
                0}
            </h3>
            <p>{t?.teacherManagement?.inactive || "Inactive"}</p>
          </div>
        </div>
      )}

      <div
        className="toolbar"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder={t?.common?.search || "Search teacher..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">{t?.common?.all || "All Statuses"}</option>
          {employmentStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container" style={{ overflowX: "auto" }}>
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spin" /> Loading...
          </div>
        ) : (
          <table className="table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>{t?.teacherManagement?.employeeId || "Employee ID"}</th>
                <th>{t?.teacherManagement?.teacherId || "Teacher ID"}</th>
                <th style={{ minWidth: 260 }}>
                  {t?.teacherManagement?.name || "Name"}
                </th>
                <th>{t?.common?.email || "Email"}</th>
                <th>{t?.common?.phone || "Phone"}</th>
                <th>
                  {t?.teacherManagement?.specialization || "Specialization"}
                </th>
                <th>{t?.teacherManagement?.status || "Status"}</th>
                <th>{t?.common?.actions || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                    No teachers found
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => {
                  const teacherImage = getTeacherImageSrc(teacher);

                  return (
                    <tr key={teacher.id}>
                      <td>
                        <strong>{teacher.employeeId || "-"}</strong>
                      </td>
                      <td>{teacher.teacherId || "-"}</td>
                      <td>
                        <div
                          className="teacher-name"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            minWidth: 220,
                          }}
                        >
                          {teacherImage ? (
                            <img
                              src={teacherImage}
                              alt={`${teacher.firstName || ""} ${teacher.lastName || ""}`}
                              className="teacher-avatar-small"
                              style={{
                                width: 52,
                                height: 52,
                                minWidth: 52,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: darkMode
                                  ? "2px solid #374151"
                                  : "2px solid #e5e7eb",
                              }}
                            />
                          ) : (
                            <div
                              className="teacher-avatar-placeholder"
                              style={{
                                width: 52,
                                height: 52,
                                minWidth: 52,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: darkMode ? "#1f2937" : "#f3f4f6",
                                border: darkMode
                                  ? "2px solid #374151"
                                  : "2px solid #e5e7eb",
                              }}
                            >
                              <FaUser />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {`${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                opacity: 0.75,
                                marginTop: 2,
                              }}
                            >
                              {(teacher.subjects || [])
                                .slice(0, 2)
                                .join(", ") ||
                                teacher.specialization ||
                                "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{teacher.email || "-"}</td>
                      <td>{teacher.phoneNumber || "-"}</td>
                      <td>{teacher.specialization || "-"}</td>
                      <td>
                        {teacher.employmentStatus || teacher.status || "-"}
                      </td>
                      <td>
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => setViewingTeacher(teacher)}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => openEditForm(teacher)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(teacher)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className={`tm-modal-overlay ${darkMode ? "dark-mode" : ""}`}>
          <div className="tm-modal-content large-modal">
            <div className="tm-modal-header">
              <h3>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h3>
              <button
                type="button"
                className="tm-icon-button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="tm-form-shell">
              <div className="tm-modal-body">
                <div className="profile-upload">
                  <div className="profile-preview">
                    {profilePicture ? (
                      <img
                        src={URL.createObjectURL(profilePicture)}
                        alt="Selected profile preview"
                      />
                    ) : getTeacherImageSrc(editingTeacher) ? (
                      <img
                        src={getTeacherImageSrc(editingTeacher)}
                        alt="Teacher profile"
                      />
                    ) : (
                      <div className="profile-placeholder">
                        <FaUser />
                      </div>
                    )}
                  </div>

                  <div className="profile-upload-controls">
                    <label className="btn-upload">
                      Choose Profile Picture
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </label>
                    <small>
                      JPG, PNG or JPEG. Leave empty if you do not want to change
                      it.
                    </small>
                  </div>
                </div>

                <div className="tm-form-grid">
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    required
                  />
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    required
                  />
                  <input
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Middle Name"
                  />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    required
                  />
                  <input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                  />
                  <input
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleInputChange}
                    placeholder="Alternate Phone"
                  />
                  <input
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    placeholder="Employee ID (optional)"
                  />
                  <input
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    placeholder="Qualification"
                  />
                  <input
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Specialization"
                  />
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Department"
                  />
                  <input
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="Designation"
                  />
                  <input
                    name="yearsOfExperience"
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    placeholder="Years of Experience"
                  />
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                  <input
                    name="dateOfJoining"
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={handleInputChange}
                  />

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Gender</option>
                    {genders.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                  >
                    <option value="">Marital Status</option>
                    {maritalStatuses.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleInputChange}
                  >
                    {employmentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                  >
                    {employmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <input
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Emergency Contact Name"
                  />
                  <input
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="Emergency Contact Phone"
                  />
                  <input
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    placeholder="Emergency Contact Relationship"
                  />
                </div>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                  rows="3"
                  className="tm-full-width"
                />

                <div className="tm-section">
                  <label>{t?.teacherManagement?.subjects || "Subjects"}</label>
                  <select
                    name="subjects"
                    multiple
                    value={formData.subjects}
                    onChange={handleInputChange}
                    className="tm-full-width"
                    style={{ minHeight: 180, marginTop: 8 }}
                  >
                    {subjectsLoading ? (
                      <option value="" disabled>
                        Loading subjects...
                      </option>
                    ) : subjects.length === 0 ? (
                      <option value="" disabled>
                        No subjects found in Subject Management
                      </option>
                    ) : (
                      subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))
                    )}
                  </select>
                  <small
                    style={{ display: "block", marginTop: 8, opacity: 0.75 }}
                  >
                    Hold Ctrl (or Cmd on Mac) to select multiple subjects.
                  </small>

                  <div className="tm-chip-wrap" style={{ marginTop: 12 }}>
                    {formData.subjects.map((subject) => (
                      <span key={subject} className="tm-chip">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="tm-section">
                  <label>Qualifications</label>
                  <div className="tm-inline-row">
                    <input
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      placeholder="Add qualification"
                    />
                    <button
                      type="button"
                      className="tm-secondary-button"
                      onClick={addQualification}
                    >
                      Add Qualification
                    </button>
                  </div>

                  <div className="tm-chip-wrap">
                    {formData.qualifications.map((qualification) => (
                      <span key={qualification} className="tm-chip alt">
                        {qualification}
                        <button
                          type="button"
                          onClick={() => removeQualification(qualification)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tm-modal-footer">
                <button
                  type="button"
                  className="tm-secondary-button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tm-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="spin" /> Saving...
                    </>
                  ) : editingTeacher ? (
                    "Update Teacher"
                  ) : (
                    "Create Teacher"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingTeacher && (
        <div className={`modal-overlay ${darkMode ? "dark-mode" : ""}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Teacher Details</h3>
              <button
                className="btn btn-icon"
                onClick={() => setViewingTeacher(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="teacher-profile">
                <div className="profile-header">
                  <div className="profile-image">
                    {getTeacherImageSrc(viewingTeacher) ? (
                      <img
                        src={getTeacherImageSrc(viewingTeacher)}
                        alt={`${viewingTeacher.firstName || ""} ${viewingTeacher.lastName || ""}`}
                      />
                    ) : (
                      <div className="profile-placeholder">
                        <FaUser />
                      </div>
                    )}
                  </div>

                  <div className="profile-title">
                    <h2>
                      {`${viewingTeacher.firstName || ""} ${viewingTeacher.lastName || ""}`.trim()}
                    </h2>
                    <div className="teacher-id">
                      {viewingTeacher.employeeId || "-"} /{" "}
                      {viewingTeacher.teacherId || "-"}
                    </div>
                  </div>
                </div>

                <div
                  className="details-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>Name:</strong>{" "}
                    {`${viewingTeacher.firstName || ""} ${viewingTeacher.lastName || ""}`.trim()}
                  </div>
                  <div>
                    <strong>Employee ID:</strong>{" "}
                    {viewingTeacher.employeeId || "-"}
                  </div>
                  <div>
                    <strong>Teacher ID:</strong>{" "}
                    {viewingTeacher.teacherId || "-"}
                  </div>
                  <div>
                    <strong>Email:</strong> {viewingTeacher.email || "-"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {viewingTeacher.phoneNumber || "-"}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {viewingTeacher.employmentStatus ||
                      viewingTeacher.status ||
                      "-"}
                  </div>
                  <div>
                    <strong>Specialization:</strong>{" "}
                    {viewingTeacher.specialization || "-"}
                  </div>
                  <div>
                    <strong>Qualification:</strong>{" "}
                    {viewingTeacher.qualification || "-"}
                  </div>
                  <div>
                    <strong>Department:</strong>{" "}
                    {viewingTeacher.department || "-"}
                  </div>
                  <div>
                    <strong>Designation:</strong>{" "}
                    {viewingTeacher.designation || "-"}
                  </div>
                  <div>
                    <strong>Date Joined:</strong>{" "}
                    {viewingTeacher.dateOfJoining || "-"}
                  </div>
                  <div>
                    <strong>Subjects:</strong>{" "}
                    {(viewingTeacher.subjects || []).join(", ") || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherManagement;
