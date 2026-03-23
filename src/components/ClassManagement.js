// src/components/ClassManagement.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { classAPI, teacherAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
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
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

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

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await classAPI.getAllClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error(t?.classManagement?.loadFailed || "Failed to load classes");
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
      toast.error(
        t?.classManagement?.classNameRequired || "Class name is required",
      );
      return false;
    }
    if (!formData.arm) {
      toast.error(t?.classManagement?.armRequired || "Arm is required");
      return false;
    }
    if (!formData.category) {
      toast.error(
        t?.classManagement?.categoryRequired || "Category is required",
      );
      return false;
    }
    if (!formData.capacity || formData.capacity < 1) {
      toast.error(
        t?.classManagement?.capacityRequired || "Valid capacity is required",
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
      const classData = {
        className: formData.className.trim(),
        arm: formData.arm,
        category: formData.category,
        capacity: parseInt(formData.capacity),
        description: formData.description?.trim() || "",
        subjects: formData.subjects || [],
      };
      if (formData.classTeacherId)
        classData.classTeacherId = formData.classTeacherId;
      if (editingClass) {
        await classAPI.updateClass(editingClass.id, classData);
        toast.success(
          t?.classManagement?.updateSuccess || "Class updated successfully",
        );
      } else {
        await classAPI.createClass(classData);
        toast.success(
          t?.classManagement?.createSuccess || "Class created successfully",
        );
      }
      resetForm();
      setShowForm(false);
      fetchClasses();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error(
        error.response?.data?.message ||
          t?.classManagement?.saveFailed ||
          "Failed to save class",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!classToDelete) return;
    setLoading(true);
    try {
      await classAPI.deleteClass(classToDelete.id);
      toast.success(
        t?.classManagement?.deleteSuccess || "Class deleted successfully",
      );
      setShowDeleteModal(false);
      setClassToDelete(null);
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error(t?.classManagement?.deleteFailed || "Failed to delete class");
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
      toast.success(
        `${format.toUpperCase()} ${t?.classManagement?.exportSuccess || "exported successfully"}`,
      );
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error(
        `${t?.classManagement?.exportFailed || "Failed to export"} ${format.toUpperCase()}`,
      );
    }
  };

  const filteredClasses = filterClasses();
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  if (loading && classes.length === 0) {
    return (
      <div className="class-management text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="class-management">
      <div className="header-section">
        <div className="header-top">
          <h1>
            <FaChalkboard /> {t?.classManagement?.title || "Class Management"}
          </h1>
          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={fetchClasses}
              title={t?.common?.refresh || "Refresh"}
            >
              <FaSync />
            </button>
            <button
              className="btn-export"
              onClick={() => handleExport("pdf")}
              title={t?.classManagement?.exportPDF || "Export PDF"}
            >
              <FaDownload /> PDF
            </button>
            <button
              className="btn-export"
              onClick={() => handleExport("excel")}
              title={t?.classManagement?.exportExcel || "Export Excel"}
            >
              <FaDownload /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>{t?.common?.search || "Search"}</label>
            <input
              type="text"
              placeholder={
                t?.classManagement?.searchPlaceholder ||
                "Search by name, code, arm, or teacher..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>{t?.classManagement?.category || "Category"}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">
                {t?.common?.allCategories || "All Categories"}
              </option>
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
              <FaPlus /> {t?.classManagement?.addClass || "Add Class"}
            </button>
          </div>
        </div>
      </div>

      <div className="table-section">
        <div className="table-responsive">
          <table className="class-table">
            <thead>
              <tr>
                <th>{t?.classManagement?.className || "Class Name"}</th>
                <th>{t?.classManagement?.arm || "Arm"}</th>
                <th>{t?.classManagement?.classCode || "Class Code"}</th>
                <th>{t?.classManagement?.category || "Category"}</th>
                <th>{t?.classManagement?.classTeacher || "Class Teacher"}</th>
                <th>{t?.classManagement?.students || "Students"}</th>
                <th>{t?.classManagement?.capacity || "Capacity"}</th>
                <th>{t?.classManagement?.subjects || "Subjects"}</th>
                <th>{t?.common?.actions || "Actions"}</th>
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
                      className={`badge bg-${cls.category === "NURSERY" ? "info" : cls.category === "PRIMARY" ? "success" : cls.category === "JUNIOR_SECONDARY" ? "warning" : "danger"}`}
                    >
                      {cls.category}
                    </span>
                  </td>
                  <td>
                    {cls.classTeacherName ? (
                      <span className="text-success">
                        <FaUserTie className="me-1" /> {cls.classTeacherName}
                      </span>
                    ) : (
                      <span className="text-warning">
                        <FaBan className="me-1" />{" "}
                        {t?.classManagement?.notAssigned || "Not Assigned"}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${cls.currentEnrollment >= cls.capacity ? "bg-danger" : "bg-info"}`}
                    >
                      <FaUsers className="me-1" /> {cls.currentEnrollment || 0}/
                      {cls.capacity}
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
                        <span className="tag">+{cls.subjects.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/classes/${cls.id}`}
                        className="btn-view"
                        title={t?.common?.view || "View Details"}
                      >
                        <FaEye />
                      </Link>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(cls)}
                        title={t?.common?.edit || "Edit Class"}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => {
                          setClassToDelete(cls);
                          setShowDeleteModal(true);
                        }}
                        title={t?.common?.delete || "Delete Class"}
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
                    <h3>
                      {t?.classManagement?.noClassesFound || "No Classes Found"}
                    </h3>
                    <p>
                      {t?.classManagement?.addFirstClass ||
                        'Click "Add Class" to create your first class.'}
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
              {t?.common?.page || "Page"} {currentPage} {t?.common?.of || "of"}{" "}
              {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <FaArrowRight />
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingClass ? <FaEdit /> : <FaPlus />}{" "}
                {editingClass
                  ? (t?.common?.edit || "Edit") +
                    " " +
                    (t?.classManagement?.class || "Class")
                  : (t?.common?.add || "Add") +
                    " " +
                    (t?.classManagement?.newClass || "New Class")}
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
                    {t?.classManagement?.className || "Class Name"}{" "}
                    <span className="required">*</span>
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
                    {t?.classManagement?.arm || "Arm"}{" "}
                    <span className="required">*</span>
                  </label>
                  <select
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
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      {t?.classManagement?.category || "Category"}{" "}
                      <span className="required">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">
                        {t?.common?.select || "Select Category"}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      {t?.classManagement?.capacity || "Capacity"}{" "}
                      <span className="required">*</span>
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
                  <label>
                    {t?.classManagement?.classTeacher || "Class Teacher"}
                  </label>
                  <select
                    name="classTeacherId"
                    value={formData.classTeacherId}
                    onChange={handleInputChange}
                  >
                    <option value="">
                      {t?.common?.select || "Select Teacher (Optional)"}
                    </option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    {t?.classManagement?.description || "Description"}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>{t?.classManagement?.subjects || "Subjects"}</label>
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
                        <option value="">
                          {t?.common?.select || "Select subject"}
                        </option>
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
                        {t?.common?.add || "Add"}
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
                    {t?.common?.cancel || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <FaSpinner className="spin" />
                    ) : editingClass ? (
                      t?.common?.update || "Update Class"
                    ) : (
                      t?.common?.create || "Create Class"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                <FaExclamationTriangle />{" "}
                {t?.classManagement?.deleteClass || "Delete Class"}
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
                {t?.classManagement?.confirmDelete ||
                  "Are you sure you want to delete class"}{" "}
                <strong>
                  {classToDelete.className} - Arm {classToDelete.arm}
                </strong>
                ?
              </p>
              <p className="text-danger">
                {t?.classManagement?.deleteWarning ||
                  "This will remove all associated data."}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                {t?.common?.cancel || "Cancel"}
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <FaSpinner className="spin" />
                ) : (
                  t?.common?.delete || "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassManagement;
