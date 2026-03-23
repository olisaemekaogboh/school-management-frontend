// src/components/ClassManager.js
import React, { useState, useEffect } from "react";
import { classAPI, teacherAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaSchool,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaSpinner,
  FaUsers,
  FaChalkboardTeacher,
  FaLayerGroup,
  FaBan,
} from "react-icons/fa";

function ClassManager() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState({
    className: "",
    arm: "",
    category: "PRIMARY",
    capacity: 35,
    classCode: "",
    description: "",
    classTeacherId: "",
  });

  const categories = [
    { value: "NURSERY", label: t?.classManager?.nursery || "Nursery" },
    { value: "PRIMARY", label: t?.classManager?.primary || "Primary" },
    {
      value: "JUNIOR_SECONDARY",
      label: t?.classManager?.juniorSecondary || "Junior Secondary (JSS)",
    },
    {
      value: "SENIOR_SECONDARY",
      label: t?.classManager?.seniorSecondary || "Senior Secondary (SSS)",
    },
  ];

  const arms = ["A", "B", "C", "D"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchClasses(), fetchStatistics(), fetchTeachers()]);
    } catch (error) {
      console.error("Error loading class manager data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getAllClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error(
        t?.classManager?.loadClassesFailed || "Failed to load classes",
      );
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await teacherAPI.getAllTeachers();
      setTeachers(response.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error(
        t?.classManager?.loadTeachersFailed || "Failed to load teachers",
      );
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await classAPI.getClassStatistics();
      setStats(response.data || {});
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error(
        t?.classManager?.loadStatsFailed || "Failed to load class statistics",
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      const className = name === "className" ? value : updated.className;
      const arm = name === "arm" ? value : updated.arm;

      if (className && arm) {
        updated.classCode =
          `${className.replace(/\s+/g, "")}-${arm}`.toUpperCase();
      }

      return updated;
    });
  };

  const validateForm = () => {
    if (!formData.className.trim()) {
      toast.error(
        t?.classManager?.classNameRequired || "Class name is required",
      );
      return false;
    }
    if (!formData.arm) {
      toast.error(t?.classManager?.armRequired || "Class arm is required");
      return false;
    }
    if (!formData.category) {
      toast.error(t?.classManager?.categoryRequired || "Category is required");
      return false;
    }
    if (!formData.capacity || Number(formData.capacity) < 1) {
      toast.error(
        t?.classManager?.capacityRequired || "Valid capacity is required",
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        className: formData.className.trim(),
        arm: formData.arm,
        category: formData.category,
        capacity: Number(formData.capacity),
        classCode:
          formData.classCode ||
          `${formData.className.replace(/\s+/g, "")}-${formData.arm}`.toUpperCase(),
        description: formData.description?.trim() || "",
        classTeacherId: formData.classTeacherId
          ? Number(formData.classTeacherId)
          : null,
      };

      if (editingClass) {
        await classAPI.updateClass(editingClass.id, payload);
        toast.success(
          t?.classManager?.updateSuccess || "Class updated successfully",
        );
      } else {
        await classAPI.createClass(payload);
        toast.success(
          t?.classManager?.createSuccess || "Class created successfully",
        );
      }

      resetForm();
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error(
        error.response?.data?.message ||
          t?.classManager?.saveFailed ||
          "Failed to save class",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      className: cls.className || "",
      arm: cls.arm || "",
      category: cls.category || "PRIMARY",
      capacity: cls.capacity || 35,
      classCode: cls.classCode || "",
      description: cls.description || "",
      classTeacherId: cls.classTeacherId ? String(cls.classTeacherId) : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      t?.classManager?.confirmDelete ||
        "Are you sure you want to delete this class? This action cannot be undone.",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await classAPI.deleteClass(id);
      toast.success(
        t?.classManager?.deleteSuccess || "Class deleted successfully",
      );
      await loadData();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error(
        error.response?.data?.message ||
          t?.classManager?.deleteFailed ||
          "Failed to delete class",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      className: "",
      arm: "",
      category: "PRIMARY",
      capacity: 35,
      classCode: "",
      description: "",
      classTeacherId: "",
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      NURSERY: "info",
      PRIMARY: "success",
      JUNIOR_SECONDARY: "warning",
      SENIOR_SECONDARY: "danger",
    };
    return colors[category] || "secondary";
  };

  const getTeacherName = (cls) => {
    if (cls.classTeacherName) return cls.classTeacherName;
    if (cls.classTeacher?.firstName || cls.classTeacher?.lastName) {
      return `${cls.classTeacher?.firstName || ""} ${cls.classTeacher?.lastName || ""}`.trim();
    }
    return null;
  };

  const getStudentCount = (cls) => {
    if (typeof cls.studentCount === "number") return cls.studentCount;
    if (Array.isArray(cls.students)) return cls.students.length;
    if (typeof cls.currentEnrollment === "number") return cls.currentEnrollment;
    return 0;
  };

  const formatCreatedAt = (cls) => {
    const dateValue = cls.createdAt || cls.updatedAt;
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };

  if (loading && !showForm && classes.length === 0) {
    return (
      <div className={`text-center py-5 ${darkMode ? "dark-mode" : ""}`}>
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div
      className={`class-manager container-fluid py-4 ${darkMode ? "dark-mode" : ""}`}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className={darkMode ? "text-light" : ""}>
          <FaSchool className="me-2" />{" "}
          {t?.classManager?.title || "Class Manager"}
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <FaPlus className="me-1" />{" "}
          {t?.classManager?.addNewClass || "Add New Class"}
        </button>
      </div>

      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="stat-card-primary">
              <div className="stat-icon">
                <FaLayerGroup />
              </div>
              <div className="stat-content">
                <h6>{t?.classManager?.totalClasses || "Total Classes"}</h6>
                <h3>{stats.totalClasses ?? classes.length ?? 0}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stat-card-success">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h6>{t?.classManager?.totalStudents || "Total Students"}</h6>
                <h3>{stats.totalStudents ?? stats.totalEnrollment ?? 0}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stat-card-info">
              <div className="stat-icon">
                <FaChalkboardTeacher />
              </div>
              <div className="stat-content">
                <h6>
                  {t?.classManager?.classesWithTeacher ||
                    "Classes with Teacher"}
                </h6>
                <h3>{stats.classesWithTeacher ?? 0}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stat-card-warning">
              <div className="stat-icon">
                <FaSchool />
              </div>
              <div className="stat-content">
                <h6>{t?.classManager?.availableSeats || "Available Seats"}</h6>
                <h3>{stats.availableSeats ?? stats.availableSpaces ?? 0}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg">
            <div
              className={`modal-content ${darkMode ? "bg-dark text-light" : ""}`}
            >
              <div
                className={`modal-header ${darkMode ? "bg-secondary" : "bg-primary"} text-white`}
              >
                <h5 className="modal-title">
                  {editingClass ? (
                    <FaEdit className="me-2" />
                  ) : (
                    <FaPlus className="me-2" />
                  )}
                  {editingClass
                    ? t?.classManager?.editClass || "Edit Class"
                    : t?.classManager?.createNewClass || "Create New Class"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {t?.classManager?.className || "Class Name"}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                        name="className"
                        value={formData.className}
                        onChange={handleInputChange}
                        required
                        placeholder={
                          t?.classManager?.classNamePlaceholder ||
                          "e.g. JSS 1, SSS 2"
                        }
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {t?.classManager?.arm || "Arm"}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                        name="arm"
                        value={formData.arm}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">
                          {t?.common?.select || "Select Arm"}
                        </option>
                        {arms.map((arm) => (
                          <option key={arm} value={arm}>
                            Arm {arm}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {t?.classManager?.category || "Category"}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {t?.classManager?.capacity || "Capacity"}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t?.classManager?.assignedTeacher || "Assigned Teacher"}
                    </label>
                    <select
                      className={`form-select ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                      name="classTeacherId"
                      value={formData.classTeacherId}
                      onChange={handleInputChange}
                    >
                      <option value="">
                        {t?.classManager?.selectTeacher ||
                          "Select Teacher (Optional)"}
                      </option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t?.classManager?.classCode || "Class Code"}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                      name="classCode"
                      value={formData.classCode}
                      onChange={handleInputChange}
                      placeholder={
                        t?.classManager?.classCodePlaceholder ||
                        "Auto-generated if left empty"
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t?.classManager?.description || "Description"}
                    </label>
                    <textarea
                      className={`form-control ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={
                        t?.classManager?.descriptionPlaceholder ||
                        "Optional description"
                      }
                    />
                  </div>
                </div>

                <div
                  className={`modal-footer ${darkMode ? "border-secondary" : ""}`}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    {t?.common?.cancel || "Cancel"}
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spinner-border spinner-border-sm me-2" />
                        {t?.common?.saving || "Saving..."}
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {editingClass
                          ? t?.common?.update || "Update"
                          : t?.common?.create || "Create"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading && !showForm ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">
              {t?.common?.loading || "Loading..."}
            </span>
          </div>
          <p className="mt-3">
            {t?.classManager?.loadingClasses || "Loading classes..."}
          </p>
        </div>
      ) : (
        <div className="row">
          {classes.map((cls) => {
            const teacherName = getTeacherName(cls);
            const studentCount = getStudentCount(cls);
            const categoryColor = getCategoryColor(cls.category);

            return (
              <div key={cls.id} className="col-md-4 mb-3">
                <div className={`class-card ${darkMode ? "dark-mode" : ""}`}>
                  <div className={`class-card-header ${categoryColor}`}>
                    <div className="class-category">
                      <FaLayerGroup className="me-2" /> {cls.category}
                    </div>
                    <div className="class-code">{cls.classCode || "N/A"}</div>
                  </div>

                  <div className="class-card-body">
                    <h5 className="class-title">
                      {cls.className} - Arm {cls.arm}
                    </h5>

                    <div className="class-badges">
                      <span className={`badge ${categoryColor}`}>
                        <FaUsers className="me-1" /> {studentCount}/
                        {cls.capacity || 0} Students
                      </span>

                      {teacherName ? (
                        <span className="badge teacher-badge">
                          <FaChalkboardTeacher className="me-1" /> {teacherName}
                        </span>
                      ) : (
                        <span className="badge no-teacher-badge">
                          <FaBan className="me-1" /> No Teacher
                        </span>
                      )}
                    </div>

                    {cls.description && (
                      <p className="class-description">{cls.description}</p>
                    )}
                  </div>

                  <div className="class-card-footer">
                    <small className="text-muted">
                      Created: {formatCreatedAt(cls)}
                    </small>

                    <div className="action-buttons">
                      <button
                        className="btn-action edit"
                        onClick={() => handleEdit(cls)}
                        title="Edit Class"
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="btn-action delete"
                        onClick={() => handleDelete(cls.id)}
                        title="Delete Class"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {classes.length === 0 && !loading && (
            <div className="col-12">
              <div className={`empty-state ${darkMode ? "dark-mode" : ""}`}>
                <FaSchool size={48} className="mb-3" />
                <h5>No Classes Found</h5>
                <p>Click "Add New Class" to create your first class.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .class-manager.dark-mode {
          background-color: #1a1a2e;
          min-height: 100vh;
        }

        /* Stat Cards */
        .stat-card-primary,
        .stat-card-success,
        .stat-card-info,
        .stat-card-warning {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 20px;
          color: white;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.2s;
        }

        .stat-card-success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }

        .stat-card-info {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-card-warning {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .dark-mode .stat-card-primary,
        .dark-mode .stat-card-success,
        .dark-mode .stat-card-info,
        .dark-mode .stat-card-warning {
          opacity: 0.9;
        }

        .stat-card-primary:hover,
        .stat-card-success:hover,
        .stat-card-info:hover,
        .stat-card-warning:hover {
          transform: translateY(-5px);
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-content h6 {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .stat-content h3 {
          margin: 5px 0 0;
          font-size: 1.8rem;
          font-weight: bold;
        }

        /* Class Cards */
        .class-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .class-card.dark-mode {
          background: #2d2d44;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .class-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .class-card-header {
          padding: 12px 16px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .class-card-header.nursery { background: #17a2b8; }
        .class-card-header.primary { background: #28a745; }
        .class-card-header.warning { background: #ffc107; color: #212529; }
        .class-card-header.danger { background: #dc3545; }
        .class-card-header.secondary { background: #6c757d; }

        .dark-mode .class-card-header {
          opacity: 0.9;
        }

        .class-card-body {
          padding: 16px;
          flex: 1;
        }

        .class-title {
          margin: 0 0 12px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .dark-mode .class-title {
          color: #e4e6eb;
        }

        .class-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .class-badges .badge {
          padding: 6px 12px;
          font-size: 0.75rem;
        }

        .badge.nursery { background: #17a2b8; color: white; }
        .badge.primary { background: #28a745; color: white; }
        .badge.warning { background: #ffc107; color: #212529; }
        .badge.danger { background: #dc3545; color: white; }
        .badge.secondary { background: #6c757d; color: white; }

        .teacher-badge {
          background: #17a2b8;
          color: white;
        }

        .no-teacher-badge {
          background: #ffc107;
          color: #212529;
        }

        .class-description {
          font-size: 0.85rem;
          color: #6c757d;
          margin: 12px 0 0;
          line-height: 1.4;
        }

        .dark-mode .class-description {
          color: #adb7be;
        }

        .class-card-footer {
          padding: 12px 16px;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }

        .dark-mode .class-card-footer {
          border-top-color: #3a3a55;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-action {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-action.edit {
          background: #ffc107;
          color: #212529;
        }

        .btn-action.delete {
          background: #dc3545;
          color: white;
        }

        .btn-action:hover {
          transform: scale(1.05);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          color: #6c757d;
        }

        .empty-state.dark-mode {
          background: #2d2d44;
          color: #adb7be;
        }

        .empty-state h5 {
          margin: 0 0 8px;
          font-size: 1.2rem;
        }

        .empty-state p {
          margin: 0;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ClassManager;
