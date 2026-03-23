// src/components/parent/ParentDetails.jsx
import React, { useEffect, useState } from "react";
import { useParent } from "../../contexts/ParentContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaInfoCircle,
  FaUsers,
  FaExclamationTriangle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaBuilding,
  FaUser,
  FaUserFriends,
  FaCalendarAlt,
  FaSpinner,
} from "react-icons/fa";

const ParentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const { fetchParentById, selectedParent, loading, error, deleteParent } =
    useParent();
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    fetchParentById(id);
  }, [id, fetchParentById]);

  const handleDelete = async () => {
    if (
      window.confirm(
        t?.parentDetails?.confirmDelete ||
          "Are you sure you want to delete this parent?",
      )
    ) {
      try {
        await deleteParent(id);
        toast.success(
          t?.parentDetails?.deleteSuccess || "Parent deleted successfully",
        );
        navigate("/parents");
      } catch (error) {
        toast.error(
          t?.parentDetails?.deleteError ||
            "Error deleting parent: " + (error.message || "Unknown error"),
        );
      }
    }
  };

  const getRelationshipBadge = (relationship) => {
    const badges = {
      FATHER: {
        class: "bg-primary",
        label: t?.parentDetails?.father || "Father",
      },
      MOTHER: {
        class: "bg-success",
        label: t?.parentDetails?.mother || "Mother",
      },
      GUARDIAN: {
        class: "bg-info",
        label: t?.parentDetails?.guardian || "Guardian",
      },
    };
    const badge = badges[relationship] || {
      class: "bg-secondary",
      label: relationship,
    };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <FaExclamationTriangle className="me-2" />
          {t?.parentDetails?.error || "Error"}: {error}
        </div>
      </div>
    );
  }

  if (!selectedParent) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <FaExclamationTriangle className="me-2" />
          {t?.parentDetails?.notFound || "Parent not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2>
            <FaUser className="me-2" />
            {t?.parentDetails?.title || "Parent Details"}:{" "}
            {selectedParent.firstName} {selectedParent.lastName}
          </h2>
        </div>
        <div className="col-md-4 text-end">
          <Link to="/parents" className="btn btn-secondary me-2">
            <FaArrowLeft className="me-2" />
            {t?.common?.backToList || "Back to List"}
          </Link>
          <Link to={`/parents/edit/${id}`} className="btn btn-warning me-2">
            <FaEdit className="me-2" />
            {t?.common?.edit || "Edit"}
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            <FaTrash className="me-2" />
            {t?.common?.delete || "Delete"}
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
                <FaInfoCircle className="me-2" />
                {t?.parentDetails?.personalInfo || "Personal Information"}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "wards" ? "active" : ""}`}
                onClick={() => setActiveTab("wards")}
              >
                <FaUsers className="me-2" />
                {t?.parentDetails?.wards || "Wards"} (
                {selectedParent.wardNames?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "emergency" ? "active" : ""}`}
                onClick={() => setActiveTab("emergency")}
              >
                <FaExclamationTriangle className="me-2" />
                {t?.parentDetails?.emergencyContact || "Emergency Contact"}
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === "info" && (
            <div className="row">
              <div className="col-md-6">
                <h5 className="border-bottom pb-2">
                  {t?.parentDetails?.basicInfo || "Basic Information"}
                </h5>
                <table className="table">
                  <tbody>
                    <tr>
                      <th style={{ width: "150px" }}>
                        {t?.parentDetails?.fullName || "Full Name"}:
                      </th>
                      <td>
                        {selectedParent.firstName} {selectedParent.middleName}{" "}
                        {selectedParent.lastName}
                      </td>
                    </tr>
                    <tr>
                      <th>{t?.common?.email || "Email"}:</th>
                      <td>
                        <a href={`mailto:${selectedParent.email}`}>
                          <FaEnvelope className="me-1" /> {selectedParent.email}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <th>{t?.common?.phone || "Phone Number"}:</th>
                      <td>
                        <a href={`tel:${selectedParent.phoneNumber}`}>
                          <FaPhone className="me-1" />{" "}
                          {selectedParent.phoneNumber}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        {t?.parentDetails?.alternatePhone || "Alternate Phone"}:
                      </th>
                      <td>
                        {selectedParent.alternatePhone ? (
                          <a href={`tel:${selectedParent.alternatePhone}`}>
                            {selectedParent.alternatePhone}
                          </a>
                        ) : (
                          t?.common?.notProvided || "Not provided"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>
                        {t?.parentDetails?.relationship || "Relationship"}:
                      </th>
                      <td>
                        {getRelationshipBadge(selectedParent.relationship)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h5 className="border-bottom pb-2">
                  {t?.parentDetails?.addressOccupation ||
                    "Address & Occupation"}
                </h5>
                <table className="table">
                  <tbody>
                    <tr>
                      <th style={{ width: "150px" }}>
                        {t?.parentDetails?.address || "Address"}:
                      </th>
                      <td>
                        <FaMapMarkerAlt className="me-1" />{" "}
                        {selectedParent.address ||
                          t?.common?.notProvided ||
                          "Not provided"}
                      </td>
                    </tr>
                    <tr>
                      <th>{t?.parentDetails?.occupation || "Occupation"}:</th>
                      <td>
                        <FaBriefcase className="me-1" />{" "}
                        {selectedParent.occupation ||
                          t?.common?.notProvided ||
                          "Not provided"}
                      </td>
                    </tr>
                    <tr>
                      <th>
                        {t?.parentDetails?.companyName || "Company Name"}:
                      </th>
                      <td>
                        <FaBuilding className="me-1" />{" "}
                        {selectedParent.companyName ||
                          t?.common?.notProvided ||
                          "Not provided"}
                      </td>
                    </tr>
                    <tr>
                      <th>
                        {t?.parentDetails?.officeAddress || "Office Address"}:
                      </th>
                      <td>
                        {selectedParent.officeAddress ||
                          t?.common?.notProvided ||
                          "Not provided"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "wards" && (
            <div>
              <h5 className="border-bottom pb-2">
                {t?.parentDetails?.childrenWards || "Children/Wards"}
              </h5>
              {selectedParent.wardNames &&
              selectedParent.wardNames.length > 0 ? (
                <div className="row">
                  {selectedParent.wardNames.map((ward, index) => (
                    <div className="col-md-4 mb-3" key={index}>
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">
                            <FaUserFriends className="me-2" />
                            {ward}
                          </h6>
                          <p className="card-text">
                            <small className="text-muted">
                              {t?.parentDetails?.studentId || "Student ID"}:{" "}
                              {selectedParent.wardIds[index]}
                            </small>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">
                  {t?.parentDetails?.noWardsAssigned || "No wards assigned"}
                </p>
              )}
            </div>
          )}

          {activeTab === "emergency" && (
            <div>
              <h5 className="border-bottom pb-2">
                {t?.parentDetails?.emergencyContactInfo ||
                  "Emergency Contact Information"}
              </h5>
              <table className="table">
                <tbody>
                  <tr>
                    <th style={{ width: "200px" }}>
                      {t?.parentDetails?.contactName || "Contact Name"}:
                    </th>
                    <td>
                      {selectedParent.emergencyContactName ||
                        t?.common?.notProvided ||
                        "Not provided"}
                    </td>
                  </tr>
                  <tr>
                    <th>
                      {t?.parentDetails?.contactPhone || "Contact Phone"}:
                    </th>
                    <td>
                      {selectedParent.emergencyContactPhone ? (
                        <a href={`tel:${selectedParent.emergencyContactPhone}`}>
                          {selectedParent.emergencyContactPhone}
                        </a>
                      ) : (
                        t?.common?.notProvided || "Not provided"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>{t?.parentDetails?.relationship || "Relationship"}:</th>
                    <td>
                      {selectedParent.emergencyContactRelationship ||
                        t?.common?.notProvided ||
                        "Not provided"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card-footer text-muted">
          <FaCalendarAlt className="me-1" />
          <small>
            {t?.parentDetails?.created || "Created"}:{" "}
            {new Date(selectedParent.createdAt).toLocaleString()} |
            {t?.parentDetails?.lastUpdated || "Last Updated"}:{" "}
            {new Date(selectedParent.updatedAt).toLocaleString()}
          </small>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ParentDetails;
