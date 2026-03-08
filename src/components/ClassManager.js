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
  FaTimes,
  FaDownload,
  FaUpload,
  FaCheck,
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
    classTeacherId: "", // Added for teacher assignment
  });

  const categories = [
    { value: "NURSERY", label: "Nursery" },
    { value: "PRIMARY", label: "Primary" },
    { value: "JUNIOR_SECONDARY", label: "Junior Secondary (JSS)" },
    { value: "SENIOR_SECONDARY", label: "Senior Secondary (SSS)" },
    { value: "OTHER", label: "Other" },
  ];

  const arms = ["A", "B", "C", "D"];

  useEffect(() => {
    fetchClasses();
    fetchStatistics();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await classAPI.getAllClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await teacherAPI.getAllTeachers();
      setTeachers(response.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await classAPI.getClassStatistics();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate class code when both className and arm are set
    if (name === "className" || name === "arm") {
      const className = name === "className" ? value : formData.className;
      const arm = name === "arm" ? value : formData.arm;

      if (className && arm) {
        const classCode =
          `${className.replace(/\s+/g, "")}-${arm}`.toUpperCase();
        setFormData((prev) => ({
          ...prev,
          classCode: classCode,
        }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.className?.trim()) {
      toast.error("Class name is required");
      return false;
    }
    if (!formData.arm) {
      toast.error("Arm is required");
      return false;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return false;
    }
    if (!formData.capacity || formData.capacity < 1) {
      toast.error("Valid capacity is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const classData = {
        className: formData.className.trim(),
        arm: formData.arm,
        category: formData.category,
        capacity: parseInt(formData.capacity),
        classCode:
          formData.classCode ||
          `${formData.className.replace(/\s+/g, "")}-${formData.arm}`.toUpperCase(),
        description: formData.description?.trim() || "",
      };

      // Only add classTeacherId if it has a value
      if (formData.classTeacherId) {
        classData.classTeacherId = formData.classTeacherId;
      }

      if (editingClass) {
        await classAPI.updateClass(editingClass.id, classData);
        toast.success("Class updated successfully");
      } else {
        await classAPI.createClass(classData);
        toast.success("Class created successfully");
      }

      setShowForm(false);
      setEditingClass(null);
      resetForm();
      fetchClasses();
      fetchStatistics();
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
      classTeacherId: cls.classTeacherId || "", // Include teacher ID for editing
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this class? This action cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await classAPI.deleteClass(id);
      toast.success("Class deleted successfully");
      fetchClasses();
      fetchStatistics();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      className: "",
      arm: "",
      category: "PRIMARY",
      capacity: 35,
      classCode: "",
      description: "",
      classTeacherId: "",
    });
    setEditingClass(null);
  };

  const getCategoryColor = (category) => {
    const colors = {
      NURSERY: "info",
      PRIMARY: "success",
      JUNIOR_SECONDARY: "warning",
      SENIOR_SECONDARY: "danger",
      OTHER: "secondary",
    };
    return colors[category] || "secondary";
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

      {/* Statistics Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Classes</h5>
                <h2>{stats.totalClasses || classes.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Total Students</h5>
                <h2>{stats.totalStudents || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Classes with Teacher</h5>
                <h2>{stats.classesWithTeacher || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">Available Seats</h5>
                <h2>{stats.availableSeats || 0}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
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
                ></button>
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
                        placeholder="e.g., JSS 1, SSS 2"
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
                    <label className="form-label">Class Teacher</label>
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
                    <small className="text-muted">
                      Unique identifier (e.g., JSS1-A, SSS2-B)
                    </small>
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
                    ></textarea>
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
                        <FaSpinner className="spinner-border spinner-border-sm me-2" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />{" "}
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

      {/* Classes Grid */}
      {loading && !showForm ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading classes...</p>
        </div>
      ) : (
        <div className="row">
          {classes.map((cls) => (
            <div key={cls.id} className="col-md-4 mb-3">
              <div className="card h-100">
                <div
                  className={`card-header bg-${getCategoryColor(cls.category)} text-white d-flex justify-content-between align-items-center`}
                >
                  <div>
                    <FaLayerGroup className="me-2" /> {cls.category}
                  </div>
                  <small>{cls.classCode}</small>
                </div>
                <div className="card-body">
                  <h5 className="card-title">
                    {cls.className} - Arm {cls.arm}
                  </h5>
                  <div className="mb-2">
                    <span className="badge bg-info me-2">
                      <FaUsers className="me-1" /> {cls.currentEnrollment || 0}/
                      {cls.capacity} Students
                    </span>
                    {cls.classTeacherName ? (
                      <span className="badge bg-success">
                        <FaChalkboardTeacher className="me-1" />{" "}
                        {cls.classTeacherName}
                      </span>
                    ) : (
                      <span className="badge bg-warning">
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
                    Created: {new Date(cls.createdAt).toLocaleDateString()}
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
          ))}

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
