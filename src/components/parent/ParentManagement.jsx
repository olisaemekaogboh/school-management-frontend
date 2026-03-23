// src/components/parent/ParentManagement.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { toast } from "react-toastify";
import parentService from "../../services/ParentService";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaPhone,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import "./ParentManagement.css";

const ParentManagement = () => {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
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
        t?.parentManagement?.fetchError ||
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
    if (
      window.confirm(
        t?.parentManagement?.confirmDelete ||
          "Are you sure you want to delete this parent?",
      )
    ) {
      try {
        await parentService.deleteParent(id);
        toast.success(
          t?.parentManagement?.deleteSuccess || "Parent deleted successfully",
        );
        fetchParents();
      } catch (error) {
        toast.error(
          t?.parentManagement?.deleteError ||
            "Error deleting parent: " + (error.message || "Unknown error"),
        );
      }
    }
  };

  const getRelationshipBadge = (relationship) => {
    const badges = {
      FATHER: {
        class: "badge-primary",
        label: t?.parentManagement?.father || "Father",
      },
      MOTHER: {
        class: "badge-success",
        label: t?.parentManagement?.mother || "Mother",
      },
      GUARDIAN: {
        class: "badge-info",
        label: t?.parentManagement?.guardian || "Guardian",
      },
    };
    const badge = badges[relationship] || {
      class: "badge-secondary",
      label: relationship || t?.parentManagement?.other || "Other",
    };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <div
        className={`loading-container ${darkMode ? "dark-mode" : ""}`}
        style={{
          height: "400px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FaSpinner className="spin" size={40} />
        <p className="ms-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className={`parent-management ${darkMode ? "dark-mode" : ""}`}>
      <div className="container-fluid py-4">
        <div className="row mb-4">
          <div className="col-md-8">
            <h2 className={darkMode ? "text-light" : ""}>
              <FaUsers className="me-2" />
              {t?.parentManagement?.title || "Parent Management"}
            </h2>
          </div>
          <div className="col-md-4 text-end">
            <Link to="/parents/register" className="btn btn-primary">
              <FaUserPlus className="me-2" />
              {t?.parentManagement?.registerNew || "Register New Parent"}
            </Link>
          </div>
        </div>

        <div
          className={`card shadow mb-4 ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
        >
          <div
            className={`card-header py-3 ${darkMode ? "bg-secondary border-secondary" : ""}`}
          >
            <div className="row">
              <div className="col-md-6">
                <h6
                  className={`m-0 font-weight-bold ${darkMode ? "text-light" : "text-primary"}`}
                >
                  {t?.parentManagement?.allParents || "All Parents"} (
                  {filteredParents.length})
                </h6>
              </div>
              <div className="col-md-6">
                <div className="input-group">
                  <span
                    className={`input-group-text ${darkMode ? "bg-dark text-light border-secondary" : "bg-white"}`}
                  >
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className={`form-control ${darkMode ? "bg-dark text-light border-secondary" : ""}`}
                    placeholder={
                      t?.parentManagement?.searchPlaceholder ||
                      "Search by name, email, or phone..."
                    }
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  {searchTerm && (
                    <button
                      className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"}`}
                      onClick={() => {
                        setSearchTerm("");
                        setFilteredParents(parents);
                      }}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {filteredParents.length === 0 ? (
              <div className="text-center py-5">
                <FaUsers className="display-1 text-muted" size={60} />
                <p className="mt-3 text-muted">
                  {t?.parentManagement?.noParentsFound || "No parents found"}
                </p>
                {searchTerm && (
                  <button
                    className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"}`}
                    onClick={() => {
                      setSearchTerm("");
                      setFilteredParents(parents);
                    }}
                  >
                    <FaTimes className="me-2" />{" "}
                    {t?.common?.clearSearch || "Clear Search"}
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table
                  className={`table table-hover ${darkMode ? "table-dark" : ""}`}
                >
                  <thead className={darkMode ? "table-secondary" : "bg-light"}>
                    <tr>
                      <th>#</th>
                      <th>{t?.parentManagement?.name || "Name"}</th>
                      <th>{t?.common?.email || "Email"}</th>
                      <th>{t?.common?.phone || "Phone"}</th>
                      <th>
                        {t?.parentManagement?.relationship || "Relationship"}
                      </th>
                      <th>{t?.parentManagement?.wards || "Wards"}</th>
                      <th>{t?.common?.actions || "Actions"}</th>
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
                            className={`text-decoration-none ${darkMode ? "text-info" : ""}`}
                          >
                            <FaEnvelope className="me-1" />
                            {parent.email}
                          </a>
                        </td>
                        <td>
                          <a
                            href={`tel:${parent.phoneNumber}`}
                            className={`text-decoration-none ${darkMode ? "text-info" : ""}`}
                          >
                            <FaPhone className="me-1" />
                            {parent.phoneNumber}
                          </a>
                        </td>
                        <td>{getRelationshipBadge(parent.relationship)}</td>
                        <td>
                          {parent.wardNames ? (
                            <span className="badge bg-secondary">
                              {parent.wardNames.length}{" "}
                              {parent.wardNames.length === 1
                                ? t?.parentManagement?.ward || "Ward"
                                : t?.parentManagement?.wards || "Wards"}
                            </span>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              {t?.parentManagement?.noWards || "No Wards"}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/parents/${parent.id}`}
                              className="btn-action view"
                              title={t?.common?.view || "View Details"}
                            >
                              <FaEye />
                            </Link>
                            <Link
                              to={`/parents/edit/${parent.id}`}
                              className="btn-action edit"
                              title={t?.common?.edit || "Edit"}
                            >
                              <FaEdit />
                            </Link>
                            <button
                              onClick={() => handleDelete(parent.id)}
                              className="btn-action delete"
                              title={t?.common?.delete || "Delete"}
                            >
                              <FaTrash />
                            </button>
                          </div>
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

      <style>{`
        .parent-management {
          transition: background-color 0.3s ease;
        }
        
        .parent-management.dark-mode {
          background-color: #0f172a;
          min-height: 100vh;
        }
        
        .parent-management .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .parent-management .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .parent-management .btn-action {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .parent-management .btn-action.view {
          background-color: #3b82f6;
          color: white;
        }
        
        .parent-management .btn-action.edit {
          background-color: #f59e0b;
          color: white;
        }
        
        .parent-management .btn-action.delete {
          background-color: #ef4444;
          color: white;
        }
        
        .parent-management .btn-action:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .parent-management .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .parent-management .badge-primary {
          background-color: #3b82f6;
          color: white;
        }
        
        .parent-management .badge-success {
          background-color: #10b981;
          color: white;
        }
        
        .parent-management .badge-info {
          background-color: #06b6d4;
          color: white;
        }
        
        .parent-management .badge-secondary {
          background-color: #6b7280;
          color: white;
        }
        
        .parent-management .badge-warning {
          background-color: #f59e0b;
          color: #1f2937;
        }
        
        .parent-management.dark-mode .badge-warning {
          background-color: #f59e0b;
          color: #1f2937;
        }
        
        .parent-management .table-dark {
          background-color: #1e293b;
          color: #f1f5f9;
        }
        
        .parent-management .table-dark a {
          color: #60a5fa;
        }
        
        .parent-management .table-dark a:hover {
          color: #93c5fd;
        }
        
        @media (max-width: 768px) {
          .parent-management .action-buttons {
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .parent-management .btn-action {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default ParentManagement;
