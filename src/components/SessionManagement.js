// src/components/SessionManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { sessionAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaCalendarAlt,
  FaSpinner,
  FaSyncAlt,
  FaClock,
  FaEdit,
  FaEye,
} from "react-icons/fa";

function SessionManagement() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);

  const [formData, setFormData] = useState({
    session: "",
    startDate: "",
    endDate: "",
    currentTerm: "FIRST",
    active: false,
  });

  const terms = [
    { value: "FIRST", label: t?.sessionManagement?.firstTerm || "First Term" },
    {
      value: "SECOND",
      label: t?.sessionManagement?.secondTerm || "Second Term",
    },
    { value: "THIRD", label: t?.sessionManagement?.thirdTerm || "Third Term" },
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aDate = new Date(a.startDate || 0).getTime();
      const bDate = new Date(b.startDate || 0).getTime();
      return bDate - aDate;
    });
  }, [sessions]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      let activeData = null;
      try {
        const activeRes = await sessionAPI.getActiveSession();
        activeData = activeRes.data;
      } catch (error) {
        console.error("Error loading active session:", error);
        activeData = null;
      }
      setActiveSession(activeData);

      if (isAuthenticated && user?.role === "ADMIN") {
        try {
          const sessionsRes = await sessionAPI.getAllSessions();
          setSessions(sessionsRes.data || []);
        } catch (error) {
          console.error("Error loading all sessions:", error);
          if (error.response?.status !== 403) {
            toast.error(
              t?.sessionManagement?.loadFailed || "Failed to load sessions",
            );
          }
          setSessions([]);
        }
      } else {
        setSessions(activeData ? [activeData] : []);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error(
        t?.sessionManagement?.loadFailed || "Failed to load sessions",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      session: "",
      startDate: "",
      endDate: "",
      currentTerm: "FIRST",
      active: false,
    });
    setEditingSessionId(null);
  };

  const autoGenerateSessionName = (startDate, endDate) => {
    if (!startDate || !endDate) return "";
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    return startYear && endYear ? `${startYear}/${endYear}` : "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setFormData((prev) => {
      const updated = { ...prev, [name]: nextValue };
      if (name === "startDate" || name === "endDate") {
        const generatedName = autoGenerateSessionName(
          name === "startDate" ? value : updated.startDate,
          name === "endDate" ? value : updated.endDate,
        );
        if (generatedName) updated.session = generatedName;
      }
      return updated;
    });
  };

  const validateForm = () => {
    if (!formData.session.trim()) {
      toast.warning(
        t?.sessionManagement?.sessionNameRequired || "Session name is required",
      );
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.warning(
        t?.sessionManagement?.datesRequired ||
          "Start date and end date are required",
      );
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.warning(
        t?.sessionManagement?.endDateAfterStart ||
          "End date must be after start date",
      );
      return false;
    }
    if (!formData.currentTerm) {
      toast.warning(
        t?.sessionManagement?.termRequired || "Current term is required",
      );
      return false;
    }
    return true;
  };

  const handleCreateOrUpdateSession = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || user?.role !== "ADMIN") {
      toast.error(
        t?.sessionManagement?.adminOnly ||
          "Only administrators can manage sessions",
      );
      return;
    }
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        sessionName: formData.session,
        startDate: formData.startDate,
        endDate: formData.endDate,
        currentTerm: formData.currentTerm,
        active: formData.active,
      };
      if (editingSessionId) {
        await sessionAPI.updateSession(editingSessionId, payload);
        toast.success(
          t?.sessionManagement?.updateSuccess || "Session updated successfully",
        );
      } else {
        await sessionAPI.createSession(payload);
        toast.success(
          t?.sessionManagement?.createSuccess || "Session created successfully",
        );
      }
      resetForm();
      await loadSessions();
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionManagement?.saveFailed ||
          "Failed to save session",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (sessionItem) => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      toast.error(
        t?.sessionManagement?.adminOnly ||
          "Only administrators can edit sessions",
      );
      return;
    }
    setEditingSessionId(sessionItem.id);
    setFormData({
      session: sessionItem.session || sessionItem.sessionName || "",
      startDate: sessionItem.startDate
        ? String(sessionItem.startDate).split("T")[0]
        : "",
      endDate: sessionItem.endDate
        ? String(sessionItem.endDate).split("T")[0]
        : "",
      currentTerm: sessionItem.currentTerm || "FIRST",
      active: sessionItem.active || false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleActivate = async (id) => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      toast.error(
        t?.sessionManagement?.adminOnly ||
          "Only administrators can activate sessions",
      );
      return;
    }
    if (
      !window.confirm(
        t?.sessionManagement?.activateConfirm || "Activate this session?",
      )
    )
      return;
    setActivatingId(id);
    try {
      await sessionAPI.activateSession(id);
      toast.success(
        t?.sessionManagement?.activateSuccess ||
          "Session activated successfully",
      );
      await loadSessions();
    } catch (error) {
      console.error("Error activating session:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionManagement?.activateFailed ||
          "Failed to activate session",
      );
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (id, sessionName) => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      toast.error(
        t?.sessionManagement?.adminOnly ||
          "Only administrators can delete sessions",
      );
      return;
    }
    if (
      !window.confirm(
        t?.sessionManagement?.deleteConfirm?.replace("{name}", sessionName) ||
          `Delete session ${sessionName}?`,
      )
    )
      return;
    setDeletingId(id);
    try {
      await sessionAPI.deleteSession(id);
      toast.success(
        t?.sessionManagement?.deleteSuccess || "Session deleted successfully",
      );
      if (editingSessionId === id) resetForm();
      await loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionManagement?.deleteFailed ||
          "Failed to delete session",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "-";

  const isActive = (sessionItem) =>
    sessionItem.active === true || activeSession?.id === sessionItem.id;

  const getSessionName = (sessionItem) =>
    sessionItem.session || sessionItem.sessionName || "-";

  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  if (loading) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading sessions..."}</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-1">
            {t?.sessionManagement?.title || "Session Management"}
          </h2>
          <p className="text-muted mb-0">
            {isAdmin
              ? t?.sessionManagement?.adminDescription ||
                "Create, update, activate, and manage academic sessions"
              : t?.sessionManagement?.userDescription ||
                "View current academic session"}
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={loadSessions}>
          <FaSyncAlt className="me-2" /> {t?.common?.refresh || "Refresh"}
        </button>
      </div>

      <div className="row">
        {isAdmin && (
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  {editingSessionId ? (
                    <>
                      <FaEdit className="me-2" />{" "}
                      {t?.sessionManagement?.editSession || "Edit Session"}
                    </>
                  ) : (
                    <>
                      <FaPlus className="me-2" />{" "}
                      {t?.sessionManagement?.createSession || "Create Session"}
                    </>
                  )}
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleCreateOrUpdateSession}>
                  <div className="mb-3">
                    <label className="form-label">
                      {t?.sessionManagement?.sessionName || "Session Name"}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="session"
                      value={formData.session}
                      onChange={handleChange}
                      placeholder="e.g. 2025/2026"
                    />
                    <small className="text-muted">
                      {t?.sessionManagement?.autoFillHint ||
                        "This can auto-fill from the dates below."}
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {t?.sessionManagement?.startDate || "Start Date"}
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {t?.sessionManagement?.endDate || "End Date"}
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {t?.sessionManagement?.currentTerm || "Current Term"}
                    </label>
                    <select
                      className="form-select"
                      name="currentTerm"
                      value={formData.currentTerm}
                      onChange={handleChange}
                    >
                      {terms.map((term) => (
                        <option key={term.value} value={term.value}>
                          {term.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      id="activeSession"
                      type="checkbox"
                      className="form-check-input"
                      name="active"
                      checked={formData.active}
                      onChange={handleChange}
                    />
                    <label htmlFor="activeSession" className="form-check-label">
                      {t?.sessionManagement?.makeActive ||
                        "Make active immediately"}
                    </label>
                  </div>
                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="me-2 spin" />{" "}
                          {t?.common?.saving || "Saving..."}
                        </>
                      ) : editingSessionId ? (
                        <>
                          <FaEdit className="me-2" />{" "}
                          {t?.common?.update || "Update Session"}
                        </>
                      ) : (
                        <>
                          <FaPlus className="me-2" />{" "}
                          {t?.sessionManagement?.create || "Create Session"}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      {editingSessionId
                        ? t?.common?.cancel || "Cancel Edit"
                        : t?.common?.clear || "Clear"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className={isAdmin ? "col-lg-8 mb-4" : "col-lg-12 mb-4"}>
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <FaCheckCircle className="me-2" />{" "}
                {t?.sessionManagement?.currentActiveSession ||
                  "Current Active Session"}
              </h5>
            </div>
            <div className="card-body">
              {activeSession ? (
                <>
                  <h4 className="mb-2">{getSessionName(activeSession)}</h4>
                  <p className="mb-1">
                    <strong>
                      {t?.sessionManagement?.startDate || "Start"}:
                    </strong>{" "}
                    {formatDate(activeSession.startDate)}
                  </p>
                  <p className="mb-1">
                    <strong>{t?.sessionManagement?.endDate || "End"}:</strong>{" "}
                    {formatDate(activeSession.endDate)}
                  </p>
                  <p className="mb-0">
                    <strong>
                      {t?.sessionManagement?.currentTerm || "Current Term"}:
                    </strong>{" "}
                    {activeSession.currentTerm || "-"}
                  </p>
                </>
              ) : (
                <p className="text-muted mb-0">
                  {t?.sessionManagement?.noActiveSession ||
                    "No active session found."}
                </p>
              )}
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" />{" "}
                {isAdmin
                  ? t?.sessionManagement?.allSessions || "All Sessions"
                  : t?.sessionManagement?.sessionInfo || "Session Information"}
              </h5>
            </div>
            <div className="card-body">
              {sortedSessions.length === 0 ? (
                <div className="alert alert-info mb-0">
                  {t?.sessionManagement?.noSessions ||
                    "No session has been created yet."}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>{t?.sessionManagement?.session || "Session"}</th>
                        <th>
                          {t?.sessionManagement?.startDate || "Start Date"}
                        </th>
                        <th>{t?.sessionManagement?.endDate || "End Date"}</th>
                        <th>
                          {t?.sessionManagement?.currentTerm || "Current Term"}
                        </th>
                        <th>{t?.sessionManagement?.status || "Status"}</th>
                        {isAdmin && (
                          <th className="text-end">
                            {t?.common?.actions || "Actions"}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSessions.map((item) => {
                        const active = isActive(item);
                        return (
                          <tr key={item.id}>
                            <td className="fw-bold">{getSessionName(item)}</td>
                            <td>{formatDate(item.startDate)}</td>
                            <td>{formatDate(item.endDate)}</td>
                            <td>
                              <span className="badge bg-info text-dark">
                                <FaClock className="me-1" />
                                {item.currentTerm || "-"}
                              </span>
                            </td>
                            <td>
                              {active ? (
                                <span className="badge bg-success">
                                  {t?.sessionManagement?.active || "Active"}
                                </span>
                              ) : (
                                <span className="badge bg-secondary">
                                  {t?.sessionManagement?.inactive || "Inactive"}
                                </span>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2 flex-wrap">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleEdit(item)}
                                    disabled={submitting}
                                  >
                                    <FaEdit className="me-1" />{" "}
                                    {t?.common?.edit || "Edit"}
                                  </button>
                                  {!active && (
                                    <button
                                      className="btn btn-sm btn-success"
                                      onClick={() => handleActivate(item.id)}
                                      disabled={activatingId === item.id}
                                    >
                                      {activatingId === item.id ? (
                                        <>
                                          <FaSpinner className="me-1 spin" />{" "}
                                          {t?.common?.activating ||
                                            "Activating"}
                                        </>
                                      ) : (
                                        <>
                                          <FaCheckCircle className="me-1" />{" "}
                                          {t?.common?.activate || "Activate"}
                                        </>
                                      )}
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      handleDelete(
                                        item.id,
                                        getSessionName(item),
                                      )
                                    }
                                    disabled={deletingId === item.id}
                                  >
                                    {deletingId === item.id ? (
                                      <>
                                        <FaSpinner className="me-1 spin" />{" "}
                                        {t?.common?.deleting || "Deleting"}
                                      </>
                                    ) : (
                                      <>
                                        <FaTrash className="me-1" />{" "}
                                        {t?.common?.delete || "Delete"}
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default SessionManagement;
