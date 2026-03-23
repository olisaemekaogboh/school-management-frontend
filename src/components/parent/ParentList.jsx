// src/components/parent/ParentList.jsx
import React, { useEffect, useState } from "react";
import { useParent } from "../../contexts/ParentContext";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaTimes,
  FaEye,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaPhone,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";

const ParentList = () => {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
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
    if (
      window.confirm(
        t?.parentList?.confirmDelete ||
          "Are you sure you want to delete this parent?",
      )
    ) {
      try {
        await deleteParent(id);
        toast.success(
          t?.parentList?.deleteSuccess || "Parent deleted successfully",
        );
        fetchParentsPaginated(currentPage, 10, "id", "asc");
      } catch (error) {
        toast.error(
          t?.parentList?.deleteError ||
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
      toast.error(t?.parentList?.searchError || "Error searching parents");
    }
  };

  const getRelationshipBadge = (relationship) => {
    const badges = {
      FATHER: { class: "bg-primary", label: t?.parentList?.father || "Father" },
      MOTHER: { class: "bg-success", label: t?.parentList?.mother || "Mother" },
      GUARDIAN: {
        class: "bg-info",
        label: t?.parentList?.guardian || "Guardian",
      },
    };
    const badge = badges[relationship] || {
      class: "bg-secondary",
      label: relationship,
    };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const displayParents = isSearching ? searchResults : parents;

  if (loading && parents.length === 0) {
    return (
      <div className="text-center my-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2>
            <FaUsers className="me-2" />
            {t?.parentList?.title || "Parents Management"}
          </h2>
        </div>
        <div className="col-md-4 text-end">
          <Link to="/parents/register" className="btn btn-success">
            <FaUserPlus className="me-2" />
            {t?.parentList?.addNewParent || "Add New Parent"}
          </Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder={
                t?.parentList?.searchPlaceholder ||
                "Search parents by name or email..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={!searchTerm.trim()}
            >
              <FaSearch /> {t?.common?.search || "Search"}
            </button>
            {isSearching && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsSearching(false);
                  setSearchTerm("");
                }}
              >
                <FaTimes /> {t?.common?.clear || "Clear"}
              </button>
            )}
          </div>
        </div>
        <div className="col-md-6 text-end">
          <span className="badge bg-info p-2">
            {t?.parentList?.totalParents || "Total Parents"}:{" "}
            {pagination.totalElements || 0}
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <FaExclamationTriangle className="me-2" />
          {t?.parentList?.error || "Error"}: {error}
        </div>
      )}

      {!loading && !error && displayParents.length === 0 && (
        <div className="alert alert-info">
          <FaInfoCircle className="me-2" />
          {isSearching
            ? t?.parentList?.noSearchResults ||
              "No parents found matching your search."
            : t?.parentList?.noParentsFound ||
              'No parents found. Click "Add New Parent" to create one.'}
        </div>
      )}

      {!loading && !error && displayParents.length > 0 && (
        <>
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead className="table-dark">
                <tr>
                  <th>{t?.parentList?.id || "ID"}</th>
                  <th>{t?.parentList?.name || "Name"}</th>
                  <th>{t?.common?.email || "Email"}</th>
                  <th>{t?.common?.phone || "Phone"}</th>
                  <th>{t?.parentList?.relationship || "Relationship"}</th>
                  <th>{t?.parentList?.wards || "Wards"}</th>
                  <th>{t?.common?.actions || "Actions"}</th>
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
                        <FaEnvelope className="me-1" />
                        {parent.email}
                      </a>
                    </td>
                    <td>
                      <a href={`tel:${parent.phoneNumber}`}>
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
                            ? t?.parentList?.ward || "ward"
                            : t?.parentList?.wards || "wards"}
                        </span>
                      ) : (
                        <span className="badge bg-warning">
                          {t?.parentList?.noWards || "No wards"}
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/parents/${parent.id}`}
                        className="btn btn-sm btn-info me-2"
                        title={t?.common?.view || "View Details"}
                      >
                        <FaEye />
                      </Link>
                      <Link
                        to={`/parents/edit/${parent.id}`}
                        className="btn btn-sm btn-warning me-2"
                        title={t?.common?.edit || "Edit"}
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDelete(parent.id)}
                        className="btn btn-sm btn-danger"
                        title={t?.common?.delete || "Delete"}
                      >
                        <FaTrash />
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
                    <FaChevronLeft className="me-1" />{" "}
                    {t?.common?.previous || "Previous"}
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
                    {t?.common?.next || "Next"}{" "}
                    <FaChevronRight className="ms-1" />
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ParentList;
