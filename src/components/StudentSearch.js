// src/components/StudentSearch.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { studentAPI } from "../services/api";
import { FaSearch, FaEye } from "react-icons/fa";

function StudentSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await studentAPI.searchStudents(searchTerm);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="student-search">
      <h2 className="mb-4">Search Students</h2>

      <div className="row justify-content-center mb-4">
        <div className="col-md-8">
          <form onSubmit={handleSearch} className="d-flex">
            <input
              type="text"
              className="form-control form-control-lg me-2"
              placeholder="Search by name, admission number, or parent name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-nigerian"
              disabled={loading}
            >
              <FaSearch className="me-2" />
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </div>

      {searched && (
        <div className="search-results">
          <h4 className="mb-3">
            {searchResults.length > 0
              ? `Found ${searchResults.length} student(s)`
              : "No students found"}
          </h4>

          {searchResults.length > 0 && (
            <div className="table-container">
              <table className="table table-striped">
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
                      <td>{student.fullName}</td>
                      <td>
                        {student.studentClass} {student.classArm}
                      </td>
                      <td>{student.parentName}</td>
                      <td>{student.parentPhone}</td>
                      <td>
                        <span
                          className={`badge ${student.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}
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
        </div>
      )}
    </div>
  );
}

export default StudentSearch;
