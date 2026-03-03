// src/components/parent/ParentManagement.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import parentService from "../../services/ParentService";

const ParentManagement = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredParents, setFilteredParents] = useState([]);

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const data = await parentService.getAllParents();
      setParents(data);
      setFilteredParents(data);
    } catch (error) {
      toast.error(
        "Error fetching parents: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = parents.filter(
      (parent) =>
        parent.firstName?.toLowerCase().includes(term) ||
        parent.lastName?.toLowerCase().includes(term) ||
        parent.email?.toLowerCase().includes(term) ||
        parent.phoneNumber?.includes(term),
    );
    setFilteredParents(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this parent?")) {
      try {
        await parentService.deleteParent(id);
        toast.success("Parent deleted successfully");
        fetchParents();
      } catch (error) {
        toast.error(
          "Error deleting parent: " + (error.message || "Unknown error"),
        );
      }
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2>
            <i className="bi bi-people-fill me-2"></i>
            Parent Management
          </h2>
        </div>
        <div className="col-md-4 text-end">
          <Link to="/parents/register" className="btn btn-primary">
            <i className="bi bi-person-plus-fill me-2"></i>
            Register New Parent
          </Link>
        </div>
      </div>

      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <div className="row">
            <div className="col-md-6">
              <h6 className="m-0 font-weight-bold text-primary">
                All Parents ({filteredParents.length})
              </h6>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          {filteredParents.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people display-1 text-muted"></i>
              <p className="mt-3 text-muted">No parents found</p>
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setFilteredParents(parents);
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="bg-light">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Relationship</th>
                    <th>Wards</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParents.map((parent, index) => (
                    <tr key={parent.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>
                          {parent.firstName} {parent.lastName}
                        </strong>
                        {parent.middleName && (
                          <div>
                            <small className="text-muted">
                              {parent.middleName}
                            </small>
                          </div>
                        )}
                      </td>
                      <td>
                        <a
                          href={`mailto:${parent.email}`}
                          className="text-decoration-none"
                        >
                          <i className="bi bi-envelope me-1"></i>
                          {parent.email}
                        </a>
                      </td>
                      <td>
                        <a
                          href={`tel:${parent.phoneNumber}`}
                          className="text-decoration-none"
                        >
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
                            {parent.wardNames.length === 1 ? "Ward" : "Wards"}
                          </span>
                        ) : (
                          <span className="badge bg-warning">No Wards</span>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentManagement;
