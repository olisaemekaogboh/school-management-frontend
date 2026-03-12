import React, { useState, useEffect } from "react";
import { teacherAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaChalkboardTeacher,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaSync,
  FaFilePdf,
  FaFileExcel,
  FaUserGraduate,
  FaEnvelope,
  FaPhone,
  FaBookOpen,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaArrowLeft,
  FaArrowRight,
  FaUpload,
  FaUsers,
  FaClock,
  FaTimesCircle,
  FaUser,
} from "react-icons/fa";
import moment from "moment";
import "./TeacherManagement.css";

const TeacherManagement = () => {
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
    employeeId: "",
    employmentStatus: "ACTIVE",
    dateOfJoining: moment().format("YYYY-MM-DD"),
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    maritalStatus: "",
    subjects: [],
    qualifications: [],
  };

  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [newSubject, setNewSubject] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");

  const employmentStatuses = [
    "ACTIVE",
    "ON_LEAVE",
    "TERMINATED",
    "RETIRED",
    "RESIGNED",
  ];

  const genders = ["MALE", "FEMALE"];
  const maritalStatuses = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];

  const subjectList = [
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

  useEffect(() => {
    fetchTeachers();
    fetchStatistics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, filterSubject, teachers]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await teacherAPI.getAllTeachers();
      const data = Array.isArray(response.data) ? response.data : [];
      setTeachers(data);
      setFilteredTeachers(data);
      setImageErrors({});
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await teacherAPI.getTeacherStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...teachers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.firstName?.toLowerCase().includes(term) ||
          t.lastName?.toLowerCase().includes(term) ||
          t.teacherId?.toLowerCase().includes(term) ||
          t.employeeId?.toLowerCase().includes(term) ||
          t.email?.toLowerCase().includes(term) ||
          t.phoneNumber?.includes(term),
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.employmentStatus === filterStatus);
    }

    if (filterSubject !== "all") {
      filtered = filtered.filter((t) => t.subjects?.includes(filterSubject));
    }

    setFilteredTeachers(filtered);
    setCurrentPage(1);
  };

  const handleImageError = (teacherId) => {
    setImageErrors((prev) => ({ ...prev, [teacherId]: true }));
  };

  const getProfileImageUrl = (teacher) => {
    if (!teacher.profilePictureUrl) return null;

    if (teacher.profilePictureUrl.startsWith("http")) {
      return teacher.profilePictureUrl;
    }

    if (teacher.profilePictureUrl.startsWith("uploads/")) {
      return `http://localhost:8080/${teacher.profilePictureUrl}`;
    }

    return `http://localhost:8080/uploads/teachers/${teacher.profilePictureUrl}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and GIF images are allowed");
      return;
    }

    setProfilePicture(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicturePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddSubject = () => {
    if (newSubject && !formData.subjects.includes(newSubject)) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, newSubject],
      }));
      setNewSubject("");
    }
  };

  const handleRemoveSubject = (subject) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject),
    }));
  };

  const handleAddQualification = () => {
    if (
      newQualification &&
      !formData.qualifications.includes(newQualification)
    ) {
      setFormData((prev) => ({
        ...prev,
        qualifications: [...prev.qualifications, newQualification],
      }));
      setNewQualification("");
    }
  };

  const handleRemoveQualification = (qualification) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((q) => q !== qualification),
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingTeacher(null);
    setProfilePicture(null);
    setProfilePicturePreview("");
  };

  const buildTeacherPayload = () => {
    return {
      ...formData,
      phoneNumber: formData.phoneNumber?.trim() || "",
      alternatePhone: formData.alternatePhone?.trim() || "",
      firstName: formData.firstName?.trim() || "",
      lastName: formData.lastName?.trim() || "",
      middleName: formData.middleName?.trim() || "",
      email: formData.email?.trim() || "",
      address: formData.address?.trim() || "",
      qualification: formData.qualification?.trim() || "",
      specialization: formData.specialization?.trim() || "",
      employeeId: formData.employeeId?.trim() || "",
      emergencyContactName: formData.emergencyContactName?.trim() || "",
      emergencyContactPhone: formData.emergencyContactPhone?.trim() || "",
      emergencyContactRelationship:
        formData.emergencyContactRelationship?.trim() || "",
      subjects: formData.subjects || [],
      qualifications: formData.qualifications || [],
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = buildTeacherPayload();
      const multipart = new FormData();
      const teacherBlob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });

      multipart.append("teacher", teacherBlob);

      if (profilePicture) {
        multipart.append("profilePicture", profilePicture);
      }

      if (editingTeacher) {
        await teacherAPI.updateTeacher(editingTeacher.id, multipart);
        toast.success("Teacher updated successfully");
      } else {
        await teacherAPI.createTeacher(multipart);
        toast.success("Teacher created successfully");
      }

      resetForm();
      setShowForm(false);
      fetchTeachers();
      fetchStatistics();
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast.error(error.response?.data?.message || "Failed to save teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;

    setLoading(true);
    try {
      await teacherAPI.deleteTeacher(teacherToDelete.id);
      toast.success("Teacher deleted successfully");
      setShowDeleteModal(false);
      setTeacherToDelete(null);
      fetchTeachers();
      fetchStatistics();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("Failed to delete teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (teacher) => {
    setViewingTeacher(teacher);
    setShowViewModal(true);
  };

  const handleEdit = (teacher) => {
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
      employeeId: teacher.employeeId || "",
      employmentStatus: teacher.employmentStatus || "ACTIVE",
      dateOfJoining: teacher.dateOfJoining || moment().format("YYYY-MM-DD"),
      emergencyContactName: teacher.emergencyContactName || "",
      emergencyContactPhone: teacher.emergencyContactPhone || "",
      emergencyContactRelationship: teacher.emergencyContactRelationship || "",
      maritalStatus: teacher.maritalStatus || "",
      subjects: teacher.subjects || [],
      qualifications: teacher.qualifications || [],
    });

    setEditingTeacher(teacher);

    if (teacher.profilePictureUrl) {
      setProfilePicturePreview(getProfileImageUrl(teacher));
    } else {
      setProfilePicturePreview("");
    }

    setShowForm(true);
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
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
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
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel");
    }
  };

  const toggleRowExpansion = (teacherId) => {
    setExpandedRows((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId],
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: {
        class: "badge-success",
        icon: <FaCheckCircle />,
        label: "Active",
      },
      ON_LEAVE: {
        class: "badge-warning",
        icon: <FaClock />,
        label: "On Leave",
      },
      TERMINATED: {
        class: "badge-danger",
        icon: <FaTimesCircle />,
        label: "Terminated",
      },
      RETIRED: {
        class: "badge-secondary",
        icon: <FaUserGraduate />,
        label: "Retired",
      },
      RESIGNED: {
        class: "badge-info",
        icon: <FaUserGraduate />,
        label: "Resigned",
      },
    };

    return badges[status] || badges.ACTIVE;
  };

  const paginatedTeachers = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTeachers.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  return (
    <div className="teacher-management">
      <div className="header-section">
        <div className="header-top">
          <h1>
            <FaChalkboardTeacher /> Teacher Management
          </h1>
          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={fetchTeachers}
              title="Refresh"
            >
              <FaSync />
            </button>
            <button
              className="btn-export"
              onClick={handleExportPDF}
              title="Export PDF"
            >
              <FaFilePdf />
            </button>
            <button
              className="btn-export"
              onClick={handleExportExcel}
              title="Export Excel"
            >
              <FaFileExcel />
            </button>
          </div>
        </div>

        {statistics && (
          <div className="stats-grid">
            <div className="stat-card primary">
              <FaUsers />
              <div>
                <h3>{statistics.totalTeachers || 0}</h3>
                <p>Total Teachers</p>
              </div>
            </div>
            <div className="stat-card success">
              <FaCheckCircle />
              <div>
                <h3>{statistics.activeTeachers || 0}</h3>
                <p>Active Teachers</p>
              </div>
            </div>
            <div className="stat-card warning">
              <FaExclamationTriangle />
              <div>
                <h3>{statistics.inactiveTeachers || 0}</h3>
                <p>Inactive</p>
              </div>
            </div>
            <div className="stat-card info">
              <FaBookOpen />
              <div>
                <h3>
                  {Object.keys(statistics.specializationBreakdown || {}).length}
                </h3>
                <p>Specializations</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        className="mobile-filter-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <FaFilter /> {showMobileFilters ? "Hide Filters" : "Show Filters"}
      </button>

      <div className={`filters-section ${showMobileFilters ? "show" : ""}`}>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by name, ID, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {employmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjectList.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button
              className="btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <FaPlus /> Add Teacher
            </button>
          </div>
        </div>
      </div>

      <div className="table-section">
        {loading ? (
          <div className="loading-spinner">
            <FaSpinner className="spin" />
            <p>Loading teachers...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Specialization</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeachers().map((teacher) => (
                    <React.Fragment key={teacher.id}>
                      <tr>
                        <td>
                          <button
                            className="btn-expand"
                            onClick={() => toggleRowExpansion(teacher.id)}
                          >
                            {expandedRows.includes(teacher.id) ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </button>
                        </td>
                        <td>
                          <strong>
                            {teacher.employeeId || teacher.teacherId || "-"}
                          </strong>
                        </td>
                        <td>
                          <div className="teacher-name">
                            {teacher.profilePictureUrl &&
                            !imageErrors[teacher.id] ? (
                              <img
                                src={getProfileImageUrl(teacher)}
                                alt={`${teacher.firstName} ${teacher.lastName}`}
                                className="teacher-avatar-small"
                                onError={() => handleImageError(teacher.id)}
                              />
                            ) : (
                              <div className="teacher-avatar-placeholder">
                                <FaUser size={20} />
                              </div>
                            )}
                            <div>
                              <strong>
                                {teacher.firstName} {teacher.lastName}
                              </strong>
                              {teacher.middleName && <br />}
                              <small>{teacher.middleName}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <a
                            href={`mailto:${teacher.email}`}
                            className="email-link"
                          >
                            <FaEnvelope /> {teacher.email}
                          </a>
                        </td>
                        <td>
                          <a
                            href={`tel:${teacher.phoneNumber}`}
                            className="phone-link"
                          >
                            <FaPhone /> {teacher.phoneNumber}
                          </a>
                        </td>
                        <td>{teacher.specialization || "-"}</td>
                        <td>
                          <span
                            className={`status-badge ${getStatusBadge(teacher.employmentStatus).class}`}
                          >
                            {getStatusBadge(teacher.employmentStatus).icon}
                            {getStatusBadge(teacher.employmentStatus).label}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-view"
                              onClick={() => handleView(teacher)}
                              title="View"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="btn-edit"
                              onClick={() => handleEdit(teacher)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => {
                                setTeacherToDelete(teacher);
                                setShowDeleteModal(true);
                              }}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedRows.includes(teacher.id) && (
                        <tr className="expanded-row">
                          <td colSpan="8">
                            <div className="expanded-content">
                              <div className="detail-grid">
                                <div>
                                  <h4>Personal Info</h4>
                                  <p>
                                    <strong>Gender:</strong>{" "}
                                    {teacher.gender || "-"}
                                  </p>
                                  <p>
                                    <strong>DOB:</strong>{" "}
                                    {teacher.dateOfBirth
                                      ? moment(teacher.dateOfBirth).format(
                                          "DD/MM/YYYY",
                                        )
                                      : "-"}
                                  </p>
                                  <p>
                                    <strong>Marital:</strong>{" "}
                                    {teacher.maritalStatus || "-"}
                                  </p>
                                </div>

                                <div>
                                  <h4>Location</h4>
                                  <p>
                                    <strong>Address:</strong>{" "}
                                    {teacher.address || "-"}
                                  </p>
                                </div>

                                <div>
                                  <h4>Employment</h4>
                                  <p>
                                    <strong>Qualification:</strong>{" "}
                                    {teacher.qualification || "-"}
                                  </p>
                                  <p>
                                    <strong>Specialization:</strong>{" "}
                                    {teacher.specialization || "-"}
                                  </p>
                                  <p>
                                    <strong>Joined:</strong>{" "}
                                    {teacher.dateOfJoining
                                      ? moment(teacher.dateOfJoining).format(
                                          "DD/MM/YYYY",
                                        )
                                      : "-"}
                                  </p>
                                </div>

                                <div>
                                  <h4>Emergency</h4>
                                  <p>
                                    <strong>Name:</strong>{" "}
                                    {teacher.emergencyContactName || "-"}
                                  </p>
                                  <p>
                                    <strong>Phone:</strong>{" "}
                                    {teacher.emergencyContactPhone || "-"}
                                  </p>
                                  <p>
                                    <strong>Relationship:</strong>{" "}
                                    {teacher.emergencyContactRelationship ||
                                      "-"}
                                  </p>
                                </div>
                              </div>

                              {teacher.subjects?.length > 0 && (
                                <div className="subjects-section">
                                  <h4>Subjects</h4>
                                  <div className="tags">
                                    {teacher.subjects.map((subject) => (
                                      <span key={subject} className="tag">
                                        {subject}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {teacher.qualifications?.length > 0 && (
                                <div className="subjects-section">
                                  <h4>Qualifications</h4>
                                  <div className="tags">
                                    {teacher.qualifications.map((qual) => (
                                      <span key={qual} className="tag">
                                        {qual}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-state">
                        <FaUserGraduate size={50} />
                        <h3>No Teachers Found</h3>
                        <p>
                          Click "Add Teacher" to create your first teacher
                          record.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <FaArrowLeft />
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <FaArrowRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div
          className="modal-overlay"
          onClick={() => {
            resetForm();
            setShowForm(false);
          }}
        >
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {editingTeacher ? <FaEdit /> : <FaPlus />}
                {editingTeacher ? " Edit Teacher" : " Add New Teacher"}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body scrollable">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>Personal Information</h3>

                  <div className="profile-upload">
                    <div className="profile-preview">
                      {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt="Preview" />
                      ) : (
                        <div className="profile-placeholder">
                          <FaUserGraduate size={40} />
                        </div>
                      )}
                    </div>
                    <div className="profile-upload-controls">
                      <label htmlFor="profilePicture" className="btn-upload">
                        <FaUpload /> Upload Photo
                      </label>
                      <input
                        type="file"
                        id="profilePicture"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <small>Max size: 5MB (JPG, PNG, GIF)</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Middle Name</label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Alt. Phone</label>
                      <input
                        type="tel"
                        name="alternatePhone"
                        value={formData.alternatePhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Gender</option>
                        {genders.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Marital Status</label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                      >
                        <option value="">Select</option>
                        {maritalStatuses.map((ms) => (
                          <option key={ms} value={ms}>
                            {ms}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Professional Information</h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Employee ID *</label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Qualification</label>
                      <input
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        placeholder="e.g., B.Sc. Education"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        placeholder="Main subject"
                      />
                    </div>
                    <div className="form-group">
                      <label>Employment Status</label>
                      <select
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleInputChange}
                      >
                        {employmentStatuses.map((es) => (
                          <option key={es} value={es}>
                            {es.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date Joined</label>
                      <input
                        type="date"
                        name="dateOfJoining"
                        value={formData.dateOfJoining}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Subjects</label>
                    <div className="tags-input">
                      <div className="tags-list">
                        {formData.subjects.map((subject) => (
                          <span key={subject} className="tag">
                            {subject}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(subject)}
                            >
                              <FaTimes />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="tag-add">
                        <select
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                        >
                          <option value="">Select subject</option>
                          {subjectList.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-add-tag"
                          onClick={handleAddSubject}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Qualifications</label>
                    <div className="tags-input">
                      <div className="tags-list">
                        {formData.qualifications.map((qual) => (
                          <span key={qual} className="tag">
                            {qual}
                            <button
                              type="button"
                              onClick={() => handleRemoveQualification(qual)}
                            >
                              <FaTimes />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="tag-add">
                        <input
                          type="text"
                          value={newQualification}
                          onChange={(e) => setNewQualification(e.target.value)}
                          placeholder="Add qualification"
                        />
                        <button
                          type="button"
                          className="btn-add-tag"
                          onClick={handleAddQualification}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Emergency Contact</h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Relationship</label>
                    <input
                      type="text"
                      name="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <FaSpinner className="spin" />
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
        </div>
      )}

      {showViewModal && viewingTeacher && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                <FaEye /> Teacher Details
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body scrollable">
              <div className="teacher-profile">
                <div className="profile-header">
                  <div className="profile-image">
                    {viewingTeacher.profilePictureUrl &&
                    !imageErrors[viewingTeacher.id] ? (
                      <img
                        src={getProfileImageUrl(viewingTeacher)}
                        alt={`${viewingTeacher.firstName} ${viewingTeacher.lastName}`}
                        onError={() => handleImageError(viewingTeacher.id)}
                      />
                    ) : (
                      <div className="profile-placeholder">
                        <FaUserGraduate size={60} />
                      </div>
                    )}
                  </div>

                  <div className="profile-title">
                    <h2>
                      {viewingTeacher.firstName} {viewingTeacher.lastName}
                    </h2>
                    <p className="teacher-id">
                      ID:{" "}
                      {viewingTeacher.employeeId ||
                        viewingTeacher.teacherId ||
                        "-"}
                    </p>
                    <span
                      className={`status-badge ${getStatusBadge(viewingTeacher.employmentStatus).class}`}
                    >
                      {getStatusBadge(viewingTeacher.employmentStatus).icon}
                      {getStatusBadge(viewingTeacher.employmentStatus).label}
                    </span>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-section">
                    <h3>Personal Information</h3>
                    <div className="detail-grid">
                      <div>
                        <label>Full Name:</label>{" "}
                        <span>
                          {viewingTeacher.firstName} {viewingTeacher.middleName}{" "}
                          {viewingTeacher.lastName}
                        </span>
                      </div>
                      <div>
                        <label>Gender:</label>{" "}
                        <span>{viewingTeacher.gender || "-"}</span>
                      </div>
                      <div>
                        <label>Date of Birth:</label>{" "}
                        <span>
                          {viewingTeacher.dateOfBirth
                            ? moment(viewingTeacher.dateOfBirth).format(
                                "DD/MM/YYYY",
                              )
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <label>Marital Status:</label>{" "}
                        <span>{viewingTeacher.maritalStatus || "-"}</span>
                      </div>
                      <div className="full-width">
                        <label>Address:</label>{" "}
                        <span>{viewingTeacher.address || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Contact Information</h3>
                    <div className="detail-grid">
                      <div>
                        <label>Email:</label>{" "}
                        <span>
                          <a href={`mailto:${viewingTeacher.email}`}>
                            {viewingTeacher.email}
                          </a>
                        </span>
                      </div>
                      <div>
                        <label>Phone:</label>{" "}
                        <span>
                          <a href={`tel:${viewingTeacher.phoneNumber}`}>
                            {viewingTeacher.phoneNumber}
                          </a>
                        </span>
                      </div>
                      <div>
                        <label>Alt. Phone:</label>{" "}
                        <span>{viewingTeacher.alternatePhone || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Professional Information</h3>
                    <div className="detail-grid">
                      <div>
                        <label>Qualification:</label>{" "}
                        <span>{viewingTeacher.qualification || "-"}</span>
                      </div>
                      <div>
                        <label>Specialization:</label>{" "}
                        <span>{viewingTeacher.specialization || "-"}</span>
                      </div>
                      <div>
                        <label>Date Joined:</label>{" "}
                        <span>
                          {viewingTeacher.dateOfJoining
                            ? moment(viewingTeacher.dateOfJoining).format(
                                "DD/MM/YYYY",
                              )
                            : "-"}
                        </span>
                      </div>
                    </div>

                    {viewingTeacher.subjects?.length > 0 && (
                      <>
                        <label>Subjects:</label>
                        <div className="tags">
                          {viewingTeacher.subjects.map((subject) => (
                            <span key={subject} className="tag">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    {viewingTeacher.qualifications?.length > 0 && (
                      <>
                        <label>Qualifications:</label>
                        <ul>
                          {viewingTeacher.qualifications.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  <div className="detail-section">
                    <h3>Emergency Contact</h3>
                    <div className="detail-grid">
                      <div>
                        <label>Name:</label>{" "}
                        <span>
                          {viewingTeacher.emergencyContactName || "-"}
                        </span>
                      </div>
                      <div>
                        <label>Phone:</label>{" "}
                        <span>
                          {viewingTeacher.emergencyContactPhone || "-"}
                        </span>
                      </div>
                      <div>
                        <label>Relationship:</label>{" "}
                        <span>
                          {viewingTeacher.emergencyContactRelationship || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewingTeacher);
                }}
              >
                <FaEdit /> Edit Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && teacherToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-content small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header danger">
              <h2>
                <FaExclamationTriangle /> Delete Teacher
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>
                  {teacherToDelete.firstName} {teacherToDelete.lastName}
                </strong>
                ?
              </p>
              <p className="text-danger">This action cannot be undone.</p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? <FaSpinner className="spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
