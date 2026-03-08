// src/components/ClassManagement.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { classAPI, teacherAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaChalkboard,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaUsers,
  FaBookOpen,
  FaUserTie,
  FaSpinner,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDownload,
  FaFilter,
  FaSync,
  FaArrowLeft,
  FaArrowRight,
  FaBan,
} from "react-icons/fa";
import moment from "moment";
import "./ClassManagement.css";

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    className: "",
    arm: "",
    category: "",
    description: "",
    classTeacherId: "",
    capacity: 40,
    subjects: [],
  });

  const [newSubject, setNewSubject] = useState("");

  const categories = [
    "NURSERY",
    "PRIMARY",
    "JUNIOR_SECONDARY",
    "SENIOR_SECONDARY",
  ];

  const arms = ["A", "B", "C", "D"];

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
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    // No need to store filtered classes in state, just compute on render
  }, [searchTerm, selectedCategory, classes]);

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

  const filterClasses = () => {
    let filtered = [...classes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.className?.toLowerCase().includes(term) ||
          c.classCode?.toLowerCase().includes(term) ||
          c.arm?.toLowerCase().includes(term) ||
          c.classTeacherName?.toLowerCase().includes(term),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    return filtered;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSubject = () => {
    if (newSubject && !formData.subjects.includes(newSubject)) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, newSubject],
      });
      setNewSubject("");
    }
  };

  const handleRemoveSubject = (subject) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s !== subject),
    });
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
        description: formData.description?.trim() || "",
        subjects: formData.subjects || [],
      };

      if (formData.classTeacherId) {
        classData.classTeacherId = formData.classTeacherId;
      }

      console.log("Submitting class data:", classData);

      if (editingClass) {
        await classAPI.updateClass(editingClass.id, classData);
        toast.success("Class updated successfully");
      } else {
        await classAPI.createClass(classData);
        toast.success("Class created successfully");
      }

      resetForm();
      setShowForm(false);
      fetchClasses();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error(error.response?.data?.message || "Failed to save class");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!classToDelete) return;

    setLoading(true);
    try {
      await classAPI.deleteClass(classToDelete.id);
      toast.success("Class deleted successfully");
      setShowDeleteModal(false);
      setClassToDelete(null);
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cls) => {
    setFormData({
      className: cls.className || "",
      arm: cls.arm || "",
      category: cls.category || "",
      description: cls.description || "",
      classTeacherId: cls.classTeacherId || "",
      capacity: cls.capacity || 40,
      subjects: cls.subjects || [],
    });
    setEditingClass(cls);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      className: "",
      arm: "",
      category: "",
      description: "",
      classTeacherId: "",
      capacity: 40,
      subjects: [],
    });
    setEditingClass(null);
    setNewSubject("");
  };

  const handleExport = async (format) => {
    try {
      let response;
      if (format === "pdf") {
        response = await classAPI.exportToPDF();
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `classes_${moment().format("YYYY-MM-DD")}.pdf`;
        a.click();
      } else {
        response = await classAPI.exportToExcel();
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `classes_${moment().format("YYYY-MM-DD")}.xlsx`;
        a.click();
      }
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const getStatusBadge = (status) => {
    return status ? (
      <span className="badge bg-success">Active</span>
    ) : (
      <span className="badge bg-secondary">Inactive</span>
    );
  };

  const filteredClasses = filterClasses();
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  return (
    <div className="class-management">
      {/* Header */}
      <div className="header-section">
        <div className="header-top">
          <h1>
            <FaChalkboard /> Class Management
          </h1>
          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={fetchClasses}
              title="Refresh"
            >
              <FaSync />
            </button>
            <button
              className="btn-export"
              onClick={() => handleExport("pdf")}
              title="Export PDF"
            >
              <FaDownload /> PDF
            </button>
            <button
              className="btn-export"
              onClick={() => handleExport("excel")}
              title="Export Excel"
            >
              <FaDownload /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by name, code, arm, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> Add Class
            </button>
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="table-section">
        {loading ? (
          <div className="loading-spinner">
            <FaSpinner className="spin" />
            <p>Loading classes...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="class-table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Arm</th>
                    <th>Class Code</th>
                    <th>Category</th>
                    <th>Class Teacher</th>
                    <th>Students</th>
                    <th>Capacity</th>
                    <th>Subjects</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClasses.map((cls) => (
                    <tr key={cls.id}>
                      <td>
                        <strong>{cls.className}</strong>
                      </td>
                      <td>
                        <span className="badge bg-info">Arm {cls.arm}</span>
                      </td>
                      <td>
                        <code>{cls.classCode}</code>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${
                            cls.category === "NURSERY"
                              ? "info"
                              : cls.category === "PRIMARY"
                                ? "success"
                                : cls.category === "JUNIOR_SECONDARY"
                                  ? "warning"
                                  : "danger"
                          }`}
                        >
                          {cls.category}
                        </span>
                      </td>
                      <td>
                        {cls.classTeacherName ? (
                          <span className="text-success">
                            <FaUserTie className="me-1" />{" "}
                            {cls.classTeacherName}
                          </span>
                        ) : (
                          <span className="text-warning">
                            <FaBan className="me-1" /> Not Assigned
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${cls.currentEnrollment >= cls.capacity ? "bg-danger" : "bg-info"}`}
                        >
                          <FaUsers className="me-1" />{" "}
                          {cls.currentEnrollment || 0}/{cls.capacity}
                        </span>
                      </td>
                      <td>{cls.capacity}</td>
                      <td>
                        <div className="subject-tags">
                          {cls.subjects?.slice(0, 2).map((subject) => (
                            <span key={subject} className="tag">
                              {subject}
                            </span>
                          ))}
                          {cls.subjects?.length > 2 && (
                            <span className="tag">
                              +{cls.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/classes/${cls.id}`}
                            className="btn-view"
                            title="View Details"
                          >
                            <FaEye />
                          </Link>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(cls)}
                            title="Edit Class"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => {
                              setClassToDelete(cls);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Class"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredClasses.length === 0 && !loading && (
                    <tr>
                      <td colSpan="9" className="empty-state">
                        <FaChalkboard size={50} />
                        <h3>No Classes Found</h3>
                        <p>Click "Add Class" to create your first class.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

      {/* Class Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingClass ? <FaEdit /> : <FaPlus />}{" "}
                {editingClass ? "Edit Class" : "Add New Class"}
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
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    Class Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    placeholder="e.g., JSS 1, SSS 2"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Arm <span className="required">*</span>
                  </label>
                  <select
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

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Category <span className="required">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Capacity <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Class Teacher</label>
                  <select
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

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
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
                    ) : editingClass ? (
                      "Update Class"
                    ) : (
                      "Create Class"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && classToDelete && (
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
                <FaExclamationTriangle /> Delete Class
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
                Are you sure you want to delete class{" "}
                <strong>
                  {classToDelete.className} - Arm {classToDelete.arm}
                </strong>
                ?
              </p>
              <p className="text-danger">
                This will remove all associated data.
              </p>
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
}

export default ClassManagement;
