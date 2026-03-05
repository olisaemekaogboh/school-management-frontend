import React, { useEffect, useMemo, useState } from "react";
import { sessionAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaCheckCircle,
  FaTrash,
  FaSearch,
  FaCalendarAlt,
} from "react-icons/fa";

function normalizeSessionName(name) {
  return (name || "").trim().replace(/\s+/g, "");
}

function isValidSessionName(name) {
  // Accepts formats like 2025/2026
  return /^\d{4}\/\d{4}$/.test(name);
}

export default function SessionManagement() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return sessions;
    return sessions.filter((s) => (s.name || "").toLowerCase().includes(t));
  }, [sessions, search]);

  const load = async () => {
    setLoading(true);
    try {
      const [allRes, activeRes] = await Promise.all([
        sessionAPI.getAll(),
        sessionAPI.getActive(),
      ]);
      setSessions(allRes.data || []);
      setActiveSession(activeRes.data || null);
    } catch (e) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    const v = normalizeSessionName(name);

    if (!v) return toast.error("Session name is required");
    if (!isValidSessionName(v)) {
      toast.error("Use format like 2025/2026");
      return;
    }

    const [start, end] = v.split("/").map(Number);
    if (end !== start + 1) {
      toast.error("Session should be consecutive years, e.g. 2025/2026");
      return;
    }

    try {
      await sessionAPI.create({ name: v });
      toast.success("Session created");
      setName("");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Create failed");
    }
  };

  const setActive = async (id) => {
    try {
      const res = await sessionAPI.setActive(id);
      setActiveSession(res.data);
      toast.success("Active session updated");
      await load();
    } catch (e) {
      toast.error("Failed to set active session");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    try {
      await sessionAPI.delete(id);
      toast.success("Deleted");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">
          <FaCalendarAlt className="me-2" />
          Academic Sessions
        </h2>
        <p className="mb-0">
          Create sessions and set the active session (used for timetable,
          attendance, results, fees).
        </p>
      </div>

      <div className="news-ticker">
        <b>Active Session:</b>{" "}
        <span className="nigeria-flag-badge">
          {activeSession?.name || "Not set"}
        </span>
      </div>

      {/* Create session */}
      <div className="form-container mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Create Session</h4>
        </div>

        <form onSubmit={create}>
          <div className="row align-items-end">
            <div className="col-md-6 mb-3">
              <label className="form-label">Session Name *</label>
              <input
                className="form-control"
                placeholder="e.g. 2025/2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <small className="text-muted">
                Format: <b>YYYY/YYYY</b> (example: 2025/2026)
              </small>
            </div>

            <div className="col-md-6 mb-3 d-grid">
              <button type="submit" className="btn-nigerian">
                <FaPlus className="me-2" />
                Create Session
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* List sessions */}
      <div className="table-container">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <h4 className="mb-0">All Sessions</h4>

          <div className="d-flex align-items-center gap-2">
            <FaSearch />
            <input
              className="form-control"
              style={{ maxWidth: 320 }}
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner-border-nigerian" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th style={{ width: 320 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const isActive = s.status === "ACTIVE";
                  return (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>
                        <b>{s.name}</b>
                      </td>
                      <td>
                        {isActive ? (
                          <span className="nigeria-flag-badge">ACTIVE</span>
                        ) : (
                          <span className="text-muted">INACTIVE</span>
                        )}
                      </td>
                      <td className="d-flex flex-wrap gap-2">
                        <button
                          className={
                            isActive ? "btn-nigerian" : "btn-outline-nigerian"
                          }
                          type="button"
                          onClick={() => setActive(s.id)}
                          disabled={isActive}
                          title={isActive ? "Already active" : "Set active"}
                        >
                          <FaCheckCircle className="me-1" />
                          {isActive ? "Active" : "Set Active"}
                        </button>

                        <button
                          className="btn-outline-nigerian"
                          type="button"
                          onClick={() => remove(s.id)}
                          disabled={isActive}
                          title={
                            isActive
                              ? "You can’t delete the active session"
                              : "Delete"
                          }
                        >
                          <FaTrash className="me-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
