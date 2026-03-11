import React, { useEffect, useMemo, useState } from "react";
import { sessionAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaCalendarAlt,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";

function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    sessionName: "",
    startDate: "",
    endDate: "",
    active: false,
  });

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
      const [sessionsRes, activeRes] = await Promise.all([
        sessionAPI.getAllSessions(),
        sessionAPI.getActiveSession(),
      ]);

      setSessions(sessionsRes.data || []);
      setActiveSession(activeRes.data || null);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sessionName: "",
      startDate: "",
      endDate: "",
      active: false,
    });
  };

  const autoGenerateSessionName = (startDate, endDate) => {
    if (!startDate || !endDate) return "";

    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();

    if (!startYear || !endYear) return "";
    return `${startYear}/${endYear}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const nextValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: nextValue,
      };

      if (name === "startDate" || name === "endDate") {
        const generatedName = autoGenerateSessionName(
          name === "startDate" ? value : updated.startDate,
          name === "endDate" ? value : updated.endDate
        );

        if (generatedName) {
          updated.sessionName = generatedName;
        }
      }

      return updated;
    });
  };

  const validateForm = () => {
    if (!formData.sessionName.trim()) {
      toast.warning("Session name is required");
      return false;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.warning("Start date and end date are required");
      return false;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.warning("End date must be after start date");
      return false;
    }

    return true;
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        sessionName: formData.sessionName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        active: formData.active,
      };

      await sessionAPI.createSession(payload);
      toast.success("Session created successfully");
      resetForm();
      await loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create session"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm("Activate this session?")) return;

    setActivatingId(id);
    try {
      await sessionAPI.activateSession(id);
      toast.success("Session activated successfully");
      await loadSessions();
    } catch (error) {
      console.error("Error activating session:", error);
      toast.error(
        error?.response?.data?.message || "Failed to activate session"
      );
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (id, sessionName) => {
    if (!window.confirm(`Delete session ${sessionName}?`)) return;

    setDeletingId(id);
    try {
      await sessionAPI.deleteSession(id);
      toast.success("Session deleted successfully");
      await loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete session"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const isActive = (sessionItem) => {
    if (!sessionItem) return false;
    if (sessionItem.active === true) return true;
    return activeSession?.id === sessionItem.id;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Session Management</h2>
          <p className="text-muted mb-0">
            Create, activate, and manage academic sessions
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadSessions}>
          <FaSyncAlt className="me-2" />
          Refresh
        </button>
      </div>

      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaPlus className="me-2" />
                Create Session
              </h5>
            </div>

            <div className="card-body">
              <form onSubmit={handleCreateSession}>
                <div className="mb-3">
                  <label className="form-label">Session Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="sessionName"
                    value={formData.sessionName}
                    onChange={handleChange}
                    placeholder="e.g. 2025/2026"
                  />
                  <small className="text-muted">
                    This can auto-fill from the dates below.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
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
                    Make active immediately
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
                        <FaSpinner className="me-2 spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-2" />
                        Create Session
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <FaCheckCircle className="me-2" />
                Active Session
              </h5>
            </div>
            <div className="card-body">
              {activeSession ? (
                <>
                  <h4 className="mb-2">{activeSession.sessionName}</h4>
                  <p className="mb-1">
                    <strong>Start:</strong> {formatDate(activeSession.startDate)}
                  </p>
                  <p className="mb-0">
                    <strong>End:</strong> {formatDate(activeSession.endDate)}
                  </p>
                </>
              ) : (
                <p className="text-muted mb-0">No active session found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" />
                All Sessions
              </h5>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <FaSpinner className="spin mb-3" size={32} />
                  <div>Loading sessions...</div>
                </div>
              ) : sortedSessions.length === 0 ? (
                <div className="alert alert-info mb-0">
                  No session has been created yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSessions.map((item) => {
                        const active = isActive(item);

                        return (
                          <tr key={item.id}>
                            <td className="fw-bold">{item.sessionName}</td>
                            <td>{formatDate(item.startDate)}</td>
                            <td>{formatDate(item.endDate)}</td>
                            <td>
                              {active ? (
                                <span className="badge bg-success">
                                  Active
                                </span>
                              ) : (
                                <span className="badge bg-secondary">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                {!active && (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleActivate(item.id)}
                                    disabled={activatingId === item.id}
                                  >
                                    {activatingId === item.id ? (
                                      <>
                                        <FaSpinner className="me-1 spin" />
                                        Activating
                                      </>
                                    ) : (
                                      <>
                                        <FaCheckCircle className="me-1" />
                                        Activate
                                      </>
                                    )}
                                  </button>
                                )}

                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() =>
                                    handleDelete(item.id, item.sessionName)
                                  }
                                  disabled={deletingId === item.id}
                                >
                                  {deletingId === item.id ? (
                                    <>
                                      <FaSpinner className="me-1 spin" />
                                      Deleting
                                    </>
                                  ) : (
                                    <>
                                      <FaTrash className="me-1" />
                                      Delete
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
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

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SessionManagement;