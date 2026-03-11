import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { studentAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { FaSearch, FaEye, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

function StudentSearch() {
  const { user } = useAuth();
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
      toast.warning("Enter a search term");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await studentAPI.searchStudents(term);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error("Failed to search students");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-search container py-4">
      <h2 className="mb-4">Search Students</h2>

      <div className="row justify-content-center mb-4">
        <div className="col-md-9 col-lg-8">
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Search by name, admission number, or parent name..."
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
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch className="me-2" />
                  Search
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
              ? "Searching..."
              : searchResults.length > 0
                ? `Found ${searchResults.length} student(s)`
                : "No students found"}
          </h4>

          {!loading && searchResults.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Admission No.</th>
                    <th>Full Name</th>
                    <th>Class</th>
                    <th>Parent Name</th>
                    <th>Parent Phone</th>
                    <th>Status</th>
                    <th>Action</th>
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
                          <FaEye className="me-1" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && searched && searchResults.length === 0 && (
            <div className="alert alert-info">No students matched your search.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentSearch;