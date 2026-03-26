import React, { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fa";
import { teacherAPI } from "../services/api";
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

const subjectOptions = [
  "Mathematics",
  "English",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "Government",
  "Literature",
  "History",
  "Geography",
  "Agricultural Science",
  "Further Mathematics",
  "Computer Science",
  "Civic Education",
  "CRS",
  "Islamic Studies",
  "Yoruba",
  "Igbo",
  "Hausa",
  "French",
  "Physical Education",
  "Basic Science",
  "Basic Technology",
  "Business Studies",
  "Home Economics",
  "Music",
  "Fine Arts",
];

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);

  const [formData, setFormData] = useState(initialFormState);
  const [profilePicture, setProfilePicture] = useState(null);
  const [newSubject, setNewSubject] = useState("");
  const [newQualification, setNewQualification] = useState("");

  const fetchTeachers = async () => {
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
  };

  const fetchStatistics = async () => {
    try {
      const response = await teacherAPI.getTeacherStatistics();
      setStatistics(response?.data || null);
    } catch (error) {
      console.error(error);
      setStatistics(null);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchStatistics();
  }, []);

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
    setNewSubject("");
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
    const { name, value } = e.target;
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

  const addSubject = () => {
    const value = newSubject.trim();
    if (!value) return;
    if (formData.subjects.includes(value)) return;

    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, value],
    }));
    setNewSubject("");
  };

  const removeSubject = (subject) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject),
    }));
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

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spin" /> Loading...
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t?.teacherManagement?.employeeId || "Employee ID"}</th>
                <th>{t?.teacherManagement?.teacherId || "Teacher ID"}</th>
                <th>{t?.teacherManagement?.name || "Name"}</th>
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
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>
                      <strong>{teacher.employeeId || "-"}</strong>
                    </td>
                    <td>{teacher.teacherId || "-"}</td>
                    <td>
                      {`${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()}
                    </td>
                    <td>{teacher.email || "-"}</td>
                    <td>{teacher.phoneNumber || "-"}</td>
                    <td>{teacher.specialization || "-"}</td>
                    <td>{teacher.employmentStatus || teacher.status || "-"}</td>
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
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h3>
              <button
                className="btn btn-icon"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="teacher-form">
              <div
                className="form-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 14,
                }}
              >
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

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address"
                rows="3"
                style={{ width: "100%", marginTop: 14 }}
              />

              <div style={{ marginTop: 16 }}>
                <label>Subjects</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  >
                    <option value="">Select subject</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addSubject}
                  >
                    Add Subject
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 10,
                  }}
                >
                  {formData.subjects.map((subject) => (
                    <span key={subject} className="badge badge-info">
                      {subject}{" "}
                      <button
                        type="button"
                        onClick={() => removeSubject(subject)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label>Qualifications</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <input
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    placeholder="Add qualification"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addQualification}
                  >
                    Add Qualification
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 10,
                  }}
                >
                  {formData.qualifications.map((qualification) => (
                    <span key={qualification} className="badge badge-secondary">
                      {qualification}{" "}
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

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
        <div className="modal-overlay">
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
                <strong>Employee ID:</strong> {viewingTeacher.employeeId || "-"}
              </div>
              <div>
                <strong>Teacher ID:</strong> {viewingTeacher.teacherId || "-"}
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
                <strong>Department:</strong> {viewingTeacher.department || "-"}
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
      )}
    </div>
  );
}

export default TeacherManagement;
