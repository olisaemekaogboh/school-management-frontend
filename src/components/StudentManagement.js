import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { studentAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaFilter,
  FaSort,
  FaDownload,
  FaPrint,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import moment from "moment";

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    class: "",
    status: "",
    gender: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "admissionNumber",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const classes = [
    "Nursery",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
    "JSS 1",
    "JSS 2",
    "JSS 3",
    "SSS 1",
    "SSS 2",
    "SSS 3",
  ];
  const statuses = [
    "ACTIVE",
    "GRADUATED",
    "TRANSFERRED",
    "SUSPENDED",
    "WITHDRAWN",
  ];
  const genders = ["MALE", "FEMALE"];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, filters, sortConfig]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(term) ||
          s.admissionNumber?.toLowerCase().includes(term) ||
          s.parentName?.toLowerCase().includes(term) ||
          s.parentPhone?.includes(term),
      );
    }

    // Apply class filter
    if (filters.class) {
      filtered = filtered.filter((s) => s.studentClass === filters.class);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    // Apply gender filter
    if (filters.gender) {
      filtered = filtered.filter((s) => s.gender === filters.gender);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "fullName") {
        aValue = a.fullName || "";
        bValue = b.fullName || "";
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredStudents(filtered);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
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

  const clearFilters = () => {
    setFilters({ class: "", status: "", gender: "" });
    setSearchTerm("");
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const getStatusBadge = (status) => {
    const colors = {
      ACTIVE: "success",
      GRADUATED: "primary",
      TRANSFERRED: "info",
      SUSPENDED: "warning",
      WITHDRAWN: "danger",
    };
    return `badge bg-${colors[status] || "secondary"}`;
  };

  return (
    <div className="student-management container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Student Management</h2>
        <Link to="/students/new" className="btn btn-nigerian">
          <FaPlus className="me-2" /> Register New Student
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, admission number, parent name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <select
                className="form-select"
                value={filters.class}
                onChange={(e) =>
                  setFilters({ ...filters, class: e.target.value })
                }
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 mb-3">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Status</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 mb-3">
              <select
                className="form-select"
                value={filters.gender}
                onChange={(e) =>
                  setFilters({ ...filters, gender: e.target.value })
                }
              >
                <option value="">All Genders</option>
                {genders.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-outline-secondary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-nigerian" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="bg-light">
                <tr>
                  <th
                    onClick={() => handleSort("admissionNumber")}
                    style={{ cursor: "pointer" }}
                  >
                    Admission No.{" "}
                    {sortConfig.key === "admissionNumber" &&
                      (sortConfig.direction === "asc" ? (
                        <FaArrowUp />
                      ) : (
                        <FaArrowDown />
                      ))}
                  </th>
                  <th
                    onClick={() => handleSort("fullName")}
                    style={{ cursor: "pointer" }}
                  >
                    Student Name{" "}
                    {sortConfig.key === "fullName" &&
                      (sortConfig.direction === "asc" ? (
                        <FaArrowUp />
                      ) : (
                        <FaArrowDown />
                      ))}
                  </th>
                  <th
                    onClick={() => handleSort("studentClass")}
                    style={{ cursor: "pointer" }}
                  >
                    Class{" "}
                    {sortConfig.key === "studentClass" &&
                      (sortConfig.direction === "asc" ? (
                        <FaArrowUp />
                      ) : (
                        <FaArrowDown />
                      ))}
                  </th>
                  <th>Arm</th>
                  <th>Gender</th>
                  <th>Parent Name</th>
                  <th>Parent Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((student) => (
                  <tr key={student.id}>
                    <td className="fw-bold">{student.admissionNumber}</td>
                    <td>{student.fullName}</td>
                    <td>{student.studentClass}</td>
                    <td>{student.classArm}</td>
                    <td>{student.gender}</td>
                    <td>{student.parentName}</td>
                    <td>{student.parentPhone}</td>
                    <td>
                      <span className={getStatusBadge(student.status)}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link
                          to={`/students/view/${student.id}`}
                          className="btn btn-info"
                          title="View"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          to={`/students/edit/${student.id}`}
                          className="btn btn-warning"
                          title="Edit"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(student.id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <p className="text-muted mb-0">No students found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li
                    key={i + 1}
                    className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}

          <div className="text-muted mt-2">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredStudents.length)} of{" "}
            {filteredStudents.length} students
          </div>
        </>
      )}
    </div>
  );
}

export default StudentManagement;
