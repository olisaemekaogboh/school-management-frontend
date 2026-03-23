// src/components/StudentSearch.js
import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { studentAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useDarkMode } from "../context/DarkModeContext";
import { FaSearch, FaEye, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

function StudentSearch() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";

  if (!isAdmin && !isTeacher) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSearch = async (e) => {
    e.preventDefault();

    const term = searchTerm.trim();
    if (!term) {
      toast.warning(t?.studentSearch?.enterTerm || "Enter a search term");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await studentAPI.searchStudents(term);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error(
        t?.studentSearch?.searchFailed || "Failed to search students",
      );
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-search container py-4">
      <h2 className="mb-4">{t?.studentSearch?.title || "Search Students"}</h2>

      <div className="row justify-content-center mb-4">
        <div className="col-md-9 col-lg-8">
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder={
                t?.studentSearch?.placeholder ||
                "Search by name, admission number, or parent name..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-nigerian"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="me-2 spin" />
                  {t?.common?.searching || "Searching..."}
                </>
              ) : (
                <>
                  <FaSearch className="me-2" />
                  {t?.common?.search || "Search"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {searched && (
        <div className="search-results">
          <h4 className="mb-3">
            {loading
              ? t?.common?.searching || "Searching..."
              : searchResults.length > 0
                ? t?.studentSearch?.foundResults?.replace(
                    "{count}",
                    searchResults.length,
                  ) || `Found ${searchResults.length} student(s)`
                : t?.studentSearch?.noResults || "No students found"}
          </h4>

          {!loading && searchResults.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>{t?.studentSearch?.admissionNo || "Admission No."}</th>
                    <th>{t?.studentSearch?.fullName || "Full Name"}</th>
                    <th>{t?.studentSearch?.class || "Class"}</th>
                    <th>{t?.studentSearch?.parentName || "Parent Name"}</th>
                    <th>{t?.studentSearch?.parentPhone || "Parent Phone"}</th>
                    <th>{t?.studentSearch?.status || "Status"}</th>
                    <th>{t?.common?.action || "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((student) => (
                    <tr key={student.id}>
                      <td>{student.admissionNumber}</td>
                      <td>
                        {student.fullName ||
                          `${student.firstName || ""} ${student.lastName || ""}`.trim()}
                      </td>
                      <td>
                        {student.studentClass} {student.classArm}
                      </td>
                      <td>{student.parentName}</td>
                      <td>{student.parentPhone}</td>
                      <td>
                        <span
                          className={`badge ${
                            student.status === "ACTIVE"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/students/view/${student.id}`}
                          className="btn btn-sm btn-info"
                        >
                          <FaEye className="me-1" /> {t?.common?.view || "View"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && searched && searchResults.length === 0 && (
            <div className="alert alert-info">
              {t?.studentSearch?.noMatch || "No students matched your search."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentSearch;
