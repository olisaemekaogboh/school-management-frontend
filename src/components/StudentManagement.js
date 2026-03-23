// src/components/StudentManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { studentAPI, teacherAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaUsers,
  FaUserCheck,
  FaSchool,
  FaUserPlus,
  FaSpinner,
} from "react-icons/fa";

function StudentManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const [searchParams] = useSearchParams();

  const mine = searchParams.get("mine");
  const classId = searchParams.get("classId");

  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";
  const teacherScoped = isTeacher && mine === "true" && !!classId;

  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState(
    t?.studentManagement?.title || "Student Management",
  );
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

  const itemsPerPage = 10;

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
    if (isAdmin && !teacherScoped) {
      fetchStatistics();
    } else {
      setStatistics(null);
    }
  }, [mine, classId, user?.role]);

  const fetchStudents = async () => {
    setLoading(true);

    try {
      if (teacherScoped) {
        const teacherClassesRes = await teacherAPI.getMyClasses();
        const teacherClasses = teacherClassesRes.data || [];

        const myClass = teacherClasses.find(
          (cls) => String(cls.id) === String(classId),
        );

        if (!myClass) {
          setStudents([]);
          setPageTitle(t?.studentManagement?.myStudents || "My Students");
          toast.error(
            t?.studentManagement?.notAssigned ||
              "You are not assigned to this class",
          );
          return;
        }

        const studentsRes = await teacherAPI.getMyClassStudents(classId);
        const teacherStudents = studentsRes.data || [];

        setStudents(teacherStudents);
        setPageTitle(
          `${t?.studentManagement?.myStudents || "My Students"} - ${myClass.className} ${myClass.arm}`,
        );
        return;
      }

      const response = await studentAPI.getAllStudents();
      setStudents(response.data || []);
      setPageTitle(t?.studentManagement?.title || "Student Management");
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
      toast.error(
        error?.response?.data?.message ||
          t?.studentManagement?.loadFailed ||
          "Failed to load students",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await studentAPI.getStatistics();
      setStatistics(response?.data || {});
    } catch (error) {
      console.error("Error fetching student statistics:", error);
      setStatistics(null);
      toast.error(
        error?.response?.data?.message ||
          t?.studentManagement?.statsFailed ||
          "Failed to load student statistics",
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((s) => {
        const fullName =
          s.fullName || `${s.firstName || ""} ${s.lastName || ""}`.trim();

        return (
          fullName.toLowerCase().includes(term) ||
          (s.firstName || "").toLowerCase().includes(term) ||
          (s.lastName || "").toLowerCase().includes(term) ||
          (s.admissionNumber || "").toLowerCase().includes(term) ||
          (s.parentName || "").toLowerCase().includes(term) ||
          (s.parentPhone || "").includes(term)
        );
      });
    }

    if (filters.class) {
      filtered = filtered.filter((s) => s.studentClass === filters.class);
    }

    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    if (filters.gender) {
      filtered = filtered.filter((s) => s.gender === filters.gender);
    }

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "fullName") {
        aValue =
          a.fullName || `${a.firstName || ""} ${a.lastName || ""}`.trim();
        bValue =
          b.fullName || `${b.firstName || ""} ${b.lastName || ""}`.trim();
      }

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchTerm, filters, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortConfig, students]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;

    if (
      !window.confirm(
        t?.studentManagement?.confirmDelete ||
          "Are you sure you want to delete this student?",
      )
    ) {
      return;
    }

    try {
      await studentAPI.deleteStudent(id);
      toast.success(
        t?.studentManagement?.deleteSuccess || "Student deleted successfully",
      );
      fetchStudents();
      if (isAdmin && !teacherScoped) {
        fetchStatistics();
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error(
        t?.studentManagement?.deleteFailed || "Failed to delete student",
      );
    }
  };

  const clearFilters = () => {
    setFilters({ class: "", status: "", gender: "" });
    setSearchTerm("");
  };

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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const classBreakdownCount = Array.isArray(statistics?.studentsByClass)
    ? statistics.studentsByClass.length
    : 0;

  const recentAdmissionsCount = Array.isArray(statistics?.recentAdmissions)
    ? statistics.recentAdmissions.length
    : 0;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{pageTitle}</h2>

        {isAdmin && (
          <Link to="/students/new" className="btn btn-primary">
            <FaPlus className="me-2" />
            {t?.studentManagement?.registerNew || "Register New Student"}
          </Link>
        )}
      </div>

      {isAdmin && !teacherScoped && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="fs-3 text-primary">
                  <FaUsers />
                </div>
                <div>
                  <h4 className="mb-0">
                    {statsLoading ? (
                      <FaSpinner className="spin" />
                    ) : (
                      (statistics?.totalStudents ?? 0)
                    )}
                  </h4>
                  <small className="text-muted">
                    {t?.studentManagement?.totalStudents || "Total Students"}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="fs-3 text-success">
                  <FaUserCheck />
                </div>
                <div>
                  <h4 className="mb-0">
                    {statsLoading ? (
                      <FaSpinner className="spin" />
                    ) : (
                      (statistics?.activeStudents ?? 0)
                    )}
                  </h4>
                  <small className="text-muted">
                    {t?.studentManagement?.activeStudents || "Active Students"}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="fs-3 text-warning">
                  <FaSchool />
                </div>
                <div>
                  <h4 className="mb-0">
                    {statsLoading ? (
                      <FaSpinner className="spin" />
                    ) : (
                      classBreakdownCount
                    )}
                  </h4>
                  <small className="text-muted">
                    {t?.studentManagement?.classGroups || "Class Groups"}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="fs-3 text-info">
                  <FaUserPlus />
                </div>
                <div>
                  <h4 className="mb-0">
                    {statsLoading ? (
                      <FaSpinner className="spin" />
                    ) : (
                      recentAdmissionsCount
                    )}
                  </h4>
                  <small className="text-muted">
                    {t?.studentManagement?.recentAdmissions ||
                      "Recent Admissions"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                {t?.common?.search || "Search"}
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    t?.studentManagement?.searchPlaceholder ||
                    "Search by name, admission no, parent..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                {t?.studentManagement?.class || "Class"}
              </label>
              <select
                className="form-select"
                value={filters.class}
                onChange={(e) =>
                  setFilters({ ...filters, class: e.target.value })
                }
                disabled={teacherScoped}
              >
                <option value="">{t?.common?.all || "All Classes"}</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                {t?.studentManagement?.status || "Status"}
              </label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">{t?.common?.allStatus || "All Status"}</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                {t?.studentManagement?.gender || "Gender"}
              </label>
              <select
                className="form-select"
                value={filters.gender}
                onChange={(e) =>
                  setFilters({ ...filters, gender: e.target.value })
                }
              >
                <option value="">
                  {t?.common?.allGenders || "All Genders"}
                </option>
                {genders.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                {t?.common?.clearFilters || "Clear Filters"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spin" size={30} />
              <p className="mt-2">{t?.common?.loading || "Loading..."}</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("admissionNumber")}
                        style={{ cursor: "pointer" }}
                      >
                        {t?.studentManagement?.admissionNo || "Admission No."}{" "}
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
                        {t?.studentManagement?.studentName || "Student Name"}{" "}
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
                        {t?.studentManagement?.class || "Class"}{" "}
                        {sortConfig.key === "studentClass" &&
                          (sortConfig.direction === "asc" ? (
                            <FaArrowUp />
                          ) : (
                            <FaArrowDown />
                          ))}
                      </th>
                      <th>{t?.studentManagement?.arm || "Arm"}</th>
                      <th>{t?.studentManagement?.gender || "Gender"}</th>
                      <th>
                        {t?.studentManagement?.parentName || "Parent Name"}
                      </th>
                      <th>
                        {t?.studentManagement?.parentPhone || "Parent Phone"}
                      </th>
                      <th>{t?.studentManagement?.status || "Status"}</th>
                      <th>{t?.common?.actions || "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((student) => (
                      <tr key={student.id}>
                        <td>{student.admissionNumber}</td>
                        <td>
                          {student.fullName ||
                            `${student.firstName || ""} ${student.lastName || ""}`.trim()}
                        </td>
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
                              state={{
                                from: `/students${window.location.search}`,
                              }}
                              className="btn btn-outline-info"
                              title={t?.common?.view || "View"}
                            >
                              <FaEye />
                            </Link>

                            {isAdmin && (
                              <>
                                <Link
                                  to={`/students/edit/${student.id}`}
                                  state={{
                                    from: `/students${window.location.search}`,
                                  }}
                                  className="btn btn-outline-primary"
                                  title={t?.common?.edit || "Edit"}
                                >
                                  <FaEdit />
                                </Link>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDelete(student.id)}
                                  title={t?.common?.delete || "Delete"}
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center py-4">
                          {t?.studentManagement?.noStudents ||
                            "No students found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <nav className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li
                      className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        {t?.common?.previous || "Previous"}
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
                        disabled={currentPage === totalPages}
                      >
                        {t?.common?.next || "Next"}
                      </button>
                    </li>
                  </ul>
                </nav>
              )}

              <div className="text-muted mt-2">
                {t?.studentManagement?.showing || "Showing"}{" "}
                {filteredStudents.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredStudents.length)} of{" "}
                {filteredStudents.length}{" "}
                {t?.studentManagement?.students || "students"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentManagement;
