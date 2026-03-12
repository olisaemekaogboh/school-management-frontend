// src/components/ClassManager.js
import React, { useState, useEffect } from "react";
import { classAPI, teacherAPI } from "../services/api";
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
    { value: "NURSERY", label: "Nursery" },
    { value: "PRIMARY", label: "Primary" },
    { value: "JUNIOR_SECONDARY", label: "Junior Secondary (JSS)" },
    { value: "SENIOR_SECONDARY", label: "Senior Secondary (SSS)" },
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
      toast.error("Failed to load classes");
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await teacherAPI.getAllTeachers();
      setTeachers(response.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load teachers");
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await classAPI.getClassStatistics();
      setStats(response.data || {});
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to load class statistics");
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
      toast.error("Class name is required");
      return false;
    }
    if (!formData.arm) {
      toast.error("Class arm is required");
      return false;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return false;
    }
    if (!formData.capacity || Number(formData.capacity) < 1) {
      toast.error("Valid capacity is required");
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
        toast.success("Class updated successfully");
      } else {
        await classAPI.createClass(payload);
        toast.success("Class created successfully");
      }

      resetForm();
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error(error.response?.data?.message || "Failed to save class");
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
      "Are you sure you want to delete this class? This action cannot be undone.",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await classAPI.deleteClass(id);
      toast.success("Class deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error(error.response?.data?.message || "Failed to delete class");
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

  return (
    <div className="class-manager container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaSchool className="me-2" /> Class Manager
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <FaPlus className="me-1" /> Add New Class
        </button>
      </div>

      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Classes</h5>
                <h2>{stats.totalClasses ?? classes.length ?? 0}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Total Students</h5>
                <h2>{stats.totalStudents ?? stats.totalEnrollment ?? 0}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Classes with Teacher</h5>
                <h2>{stats.classesWithTeacher ?? 0}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">Available Seats</h5>
                <h2>{stats.availableSeats ?? stats.availableSpaces ?? 0}</h2>
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
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editingClass ? (
                    <FaEdit className="me-2" />
                  ) : (
                    <FaPlus className="me-2" />
                  )}
                  {editingClass ? "Edit Class" : "Create New Class"}
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
                        Class Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="className"
                        value={formData.className}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. JSS 1, SSS 2"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Arm <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="arm"
                        value={formData.arm}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Arm</option>
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
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
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
                        Capacity <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
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
                    <label className="form-label">Assigned Teacher</label>
                    <select
                      className="form-select"
                      name="classTeacherId"
                      value={formData.classTeacherId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Teacher (Optional)</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Class Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="classCode"
                      value={formData.classCode}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if left empty"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Optional description"
                    />
                  </div>
                </div>

                <div className="modal-footer">
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
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {editingClass ? "Update" : "Create"}
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
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading classes...</p>
        </div>
      ) : (
        <div className="row">
          {classes.map((cls) => {
            const teacherName = getTeacherName(cls);
            const studentCount = getStudentCount(cls);

            return (
              <div key={cls.id} className="col-md-4 mb-3">
                <div className="card h-100">
                  <div
                    className={`card-header bg-${getCategoryColor(cls.category)} text-white d-flex justify-content-between align-items-center`}
                  >
                    <div>
                      <FaLayerGroup className="me-2" /> {cls.category}
                    </div>
                    <small>{cls.classCode || "N/A"}</small>
                  </div>

                  <div className="card-body">
                    <h5 className="card-title">
                      {cls.className} - Arm {cls.arm}
                    </h5>

                    <div className="mb-2">
                      <span className="badge bg-info me-2">
                        <FaUsers className="me-1" /> {studentCount}/
                        {cls.capacity || 0} Students
                      </span>

                      {teacherName ? (
                        <span className="badge bg-success">
                          <FaChalkboardTeacher className="me-1" /> {teacherName}
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark">
                          <FaBan className="me-1" /> No Teacher
                        </span>
                      )}
                    </div>

                    {cls.description && (
                      <p className="card-text small text-muted">
                        {cls.description}
                      </p>
                    )}
                  </div>

                  <div className="card-footer bg-light d-flex justify-content-between">
                    <small className="text-muted">
                      Created: {formatCreatedAt(cls)}
                    </small>

                    <div>
                      <button
                        className="btn btn-sm btn-warning me-1"
                        onClick={() => handleEdit(cls)}
                        title="Edit Class"
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
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
              <div className="alert alert-info">
                <FaSchool className="me-2" />
                No classes found. Click "Add New Class" to create your first
                class.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClassManager;
