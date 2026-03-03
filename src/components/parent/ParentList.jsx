// src/components/parent/ParentList.jsx
import React, { useEffect, useState } from "react";
import { useParent } from "../../context/ParentContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const ParentList = () => {
  const {
    parents,
    loading,
    error,
    fetchParentsPaginated,
    deleteParent,
    searchParents,
    pagination,
  } = useParent();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchParentsPaginated(currentPage, 10, "id", "asc");
  }, [currentPage, fetchParentsPaginated]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this parent?")) {
      try {
        await deleteParent(id);
        toast.success("Parent deleted successfully");
        fetchParentsPaginated(currentPage, 10, "id", "asc");
      } catch (error) {
        toast.error(
          "Error deleting parent: " + (error.message || "Unknown error"),
        );
      }
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchParents(searchTerm);
      setSearchResults(results);
    } catch (error) {
      toast.error("Error searching parents");
    }
  };

  const displayParents = isSearching ? searchResults : parents;

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2>
            <i className="bi bi-people-fill me-2"></i>
            Parents Management
          </h2>
        </div>
        <div className="col-md-4 text-end">
          <Link to="/parents/register" className="btn btn-success">
            <i className="bi bi-person-plus-fill me-2"></i>
            Add New Parent
          </Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search parents by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={!searchTerm.trim()}
            >
              <i className="bi bi-search"></i> Search
            </button>
            {isSearching && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsSearching(false);
                  setSearchTerm("");
                }}
              >
                <i className="bi bi-x-circle"></i> Clear
              </button>
            )}
          </div>
        </div>
        <div className="col-md-6 text-end">
          <span className="badge bg-info p-2">
            Total Parents: {pagination.totalElements || 0}
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Error: {error}
        </div>
      )}

      {!loading && !error && displayParents.length === 0 && (
        <div className="alert alert-info">
          <i className="bi bi-info-circle-fill me-2"></i>
          {isSearching
            ? "No parents found matching your search."
            : 'No parents found. Click "Add New Parent" to create one.'}
        </div>
      )}

      {!loading && !error && displayParents.length > 0 && (
        <>
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Relationship</th>
                  <th>Wards</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayParents.map((parent) => (
                  <tr key={parent.id}>
                    <td>{parent.id}</td>
                    <td>
                      {parent.firstName} {parent.lastName}
                      {parent.middleName && ` ${parent.middleName}`}
                    </td>
                    <td>
                      <a href={`mailto:${parent.email}`}>
                        <i className="bi bi-envelope me-1"></i>
                        {parent.email}
                      </a>
                    </td>
                    <td>
                      <a href={`tel:${parent.phoneNumber}`}>
                        <i className="bi bi-telephone me-1"></i>
                        {parent.phoneNumber}
                      </a>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          parent.relationship === "FATHER"
                            ? "bg-primary"
                            : parent.relationship === "MOTHER"
                              ? "bg-success"
                              : "bg-info"
                        }`}
                      >
                        {parent.relationship}
                      </span>
                    </td>
                    <td>
                      {parent.wardNames ? (
                        <span className="badge bg-secondary">
                          {parent.wardNames.length}{" "}
                          {parent.wardNames.length === 1 ? "ward" : "wards"}
                        </span>
                      ) : (
                        <span className="badge bg-warning">No wards</span>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/parents/${parent.id}`}
                        className="btn btn-sm btn-info me-2"
                        title="View Details"
                      >
                        <i className="bi bi-eye"></i>
                      </Link>
                      <Link
                        to={`/parents/edit/${parent.id}`}
                        className="btn btn-sm btn-warning me-2"
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        onClick={() => handleDelete(parent.id)}
                        className="btn btn-sm btn-danger"
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isSearching && pagination.totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li
                  className={`page-item ${currentPage === 0 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(0, prev - 1))
                    }
                  >
                    Previous
                  </button>
                </li>
                {[...Array(pagination.totalPages).keys()].map((page) => (
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
                  className={`page-item ${currentPage === pagination.totalPages - 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(pagination.totalPages - 1, prev + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default ParentList;
