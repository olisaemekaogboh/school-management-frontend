// src/components/parent/ParentDetails.jsx
import React, { useEffect, useState } from "react";
import { useParent } from "../../contexts/ParentContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ParentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchParentById, selectedParent, loading, error, deleteParent } =
    useParent();
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    fetchParentById(id);
  }, [id, fetchParentById]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this parent?")) {
      try {
        await deleteParent(id);
        toast.success("Parent deleted successfully");
        navigate("/parents");
      } catch (error) {
        toast.error(
          "Error deleting parent: " + (error.message || "Unknown error"),
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!selectedParent) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          Parent not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2>
            <i className="bi bi-person-circle me-2"></i>
            Parent Details: {selectedParent.firstName} {selectedParent.lastName}
          </h2>
        </div>
        <div className="col-md-4 text-end">
          <Link to="/parents" className="btn btn-secondary me-2">
            <i className="bi bi-arrow-left me-2"></i>
            Back to List
          </Link>
          <Link to={`/parents/edit/${id}`} className="btn btn-warning me-2">
            <i className="bi bi-pencil me-2"></i>
            Edit
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            <i className="bi bi-trash me-2"></i>
            Delete
          </button>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "info" ? "active" : ""}`}
                onClick={() => setActiveTab("info")}
              >
                <i className="bi bi-info-circle me-2"></i>
                Personal Information
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "wards" ? "active" : ""}`}
                onClick={() => setActiveTab("wards")}
              >
                <i className="bi bi-people me-2"></i>
                Wards ({selectedParent.wardNames?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "emergency" ? "active" : ""}`}
                onClick={() => setActiveTab("emergency")}
              >
                <i className="bi bi-exclamation-triangle me-2"></i>
                Emergency Contact
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === "info" && (
            <div className="row">
              <div className="col-md-6">
                <h5 className="border-bottom pb-2">Basic Information</h5>
                <table className="table">
                  <tr>
                    <th>Full Name:</th>
                    <td>
                      {selectedParent.firstName} {selectedParent.middleName}{" "}
                      {selectedParent.lastName}
                    </td>
                  </tr>
                  <tr>
                    <th>Email:</th>
                    <td>
                      <a href={`mailto:${selectedParent.email}`}>
                        {selectedParent.email}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th>Phone Number:</th>
                    <td>
                      <a href={`tel:${selectedParent.phoneNumber}`}>
                        {selectedParent.phoneNumber}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th>Alternate Phone:</th>
                    <td>
                      {selectedParent.alternatePhone ? (
                        <a href={`tel:${selectedParent.alternatePhone}`}>
                          {selectedParent.alternatePhone}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Relationship:</th>
                    <td>
                      <span
                        className={`badge ${
                          selectedParent.relationship === "FATHER"
                            ? "bg-primary"
                            : selectedParent.relationship === "MOTHER"
                              ? "bg-success"
                              : "bg-info"
                        }`}
                      >
                        {selectedParent.relationship}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
              <div className="col-md-6">
                <h5 className="border-bottom pb-2">Address & Occupation</h5>
                <table className="table">
                  <tr>
                    <th>Address:</th>
                    <td>{selectedParent.address || "Not provided"}</td>
                  </tr>
                  <tr>
                    <th>Occupation:</th>
                    <td>{selectedParent.occupation || "Not provided"}</td>
                  </tr>
                  <tr>
                    <th>Company Name:</th>
                    <td>{selectedParent.companyName || "Not provided"}</td>
                  </tr>
                  <tr>
                    <th>Office Address:</th>
                    <td>{selectedParent.officeAddress || "Not provided"}</td>
                  </tr>
                </table>
              </div>
            </div>
          )}

          {activeTab === "wards" && (
            <div>
              <h5 className="border-bottom pb-2">Children/Wards</h5>
              {selectedParent.wardNames &&
              selectedParent.wardNames.length > 0 ? (
                <div className="row">
                  {selectedParent.wardNames.map((ward, index) => (
                    <div className="col-md-4 mb-3" key={index}>
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">
                            <i className="bi bi-person-square me-2"></i>
                            {ward}
                          </h6>
                          <p className="card-text">
                            <small className="text-muted">
                              Student ID: {selectedParent.wardIds[index]}
                            </small>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No wards assigned</p>
              )}
            </div>
          )}

          {activeTab === "emergency" && (
            <div>
              <h5 className="border-bottom pb-2">
                Emergency Contact Information
              </h5>
              <table className="table">
                <tr>
                  <th style={{ width: "200px" }}>Contact Name:</th>
                  <td>
                    {selectedParent.emergencyContactName || "Not provided"}
                  </td>
                </tr>
                <tr>
                  <th>Contact Phone:</th>
                  <td>
                    {selectedParent.emergencyContactPhone ? (
                      <a href={`tel:${selectedParent.emergencyContactPhone}`}>
                        {selectedParent.emergencyContactPhone}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Relationship:</th>
                  <td>
                    {selectedParent.emergencyContactRelationship ||
                      "Not provided"}
                  </td>
                </tr>
              </table>
            </div>
          )}
        </div>
        <div className="card-footer text-muted">
          <small>
            Created: {new Date(selectedParent.createdAt).toLocaleString()} |
            Last Updated: {new Date(selectedParent.updatedAt).toLocaleString()}
          </small>
        </div>
      </div>
    </div>
  );
};

export default ParentDetails;
