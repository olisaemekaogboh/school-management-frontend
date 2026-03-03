// src/components/StudentList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { studentAPI } from "../services/api";
import { FaEdit, FaTrash, FaEye, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";

function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [currentPage, sortBy, sortDir, filterClass, filterStatus]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getPaginatedStudents(
        currentPage,
        pageSize,
        sortBy,
        sortDir,
      );
      setStudents(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await studentAPI.deleteStudent(id);
        toast.success("Student deleted successfully");
        fetchStudents();
      } catch (error) {
        console.error("Error deleting student:", error);
        toast.error("Failed to delete student");
      }
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-success";
      case "GRADUATED":
        return "bg-primary";
      case "TRANSFERRED":
        return "bg-info";
      case "SUSPENDED":
        return "bg-warning";
      case "WITHDRAWN":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="student-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Student Management</h2>
        <Link to="/students/new" className="btn btn-nigerian">
          <FaPlus className="me-2" /> Register New Student
        </Link>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-3">
          <select
            className="form-select"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All Classes</option>
            <option value="SSS 3">SSS 3</option>
            <option value="SSS 2">SSS 2</option>
            <option value="SSS 1">SSS 1</option>
            <option value="JSS 3">JSS 3</option>
            <option value="JSS 2">JSS 2</option>
            <option value="JSS 1">JSS 1</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="GRADUATED">Graduated</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-container">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th
                onClick={() => handleSort("id")}
                style={{ cursor: "pointer" }}
              >
                ID {sortBy === "id" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("firstName")}
                style={{ cursor: "pointer" }}
              >
                Name {sortBy === "firstName" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Admission No.</th>
              <th>Class</th>
              <th>Parent Name</th>
              <th>Parent Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.fullName}</td>
                <td>{student.admissionNumber}</td>
                <td>
                  {student.studentClass} {student.classArm}
                </td>
                <td>{student.parentName}</td>
                <td>{student.parentPhone}</td>
                <td>
                  <span
                    className={`badge ${getStatusBadgeClass(student.status)}`}
                  >
                    {student.status}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/students/view/${student.id}`}
                    className="btn btn-sm btn-info me-2"
                    title="View"
                  >
                    <FaEye />
                  </Link>
                  <Link
                    to={`/students/edit/${student.id}`}
                    className="btn btn-sm btn-warning me-2"
                    title="Edit"
                  >
                    <FaEdit />
                  </Link>
                  <button
                    onClick={() => handleDelete(student.id, student.fullName)}
                    className="btn btn-sm btn-danger"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </button>
            </li>
            {[...Array(totalPages).keys()].map((page) => (
              <li
                key={page}
                className={`page-item ${currentPage === page ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(page)}
                >
                  {page + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}
            >
              <button
                className="page-link"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default StudentList;
