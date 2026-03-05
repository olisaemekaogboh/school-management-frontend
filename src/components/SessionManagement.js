// src/components/SessionManagement.js
import React, { useMemo, useState } from "react";
import { sessionAPI } from "../services/api";
import { useSession } from "../contexts/SessionContext";
import { toast } from "react-toastify";
import { FiPlus, FiCheckCircle, FiTrash2, FiRefreshCw } from "react-icons/fi";

const guessYearsFromName = (name) => {
  // "2025/2026"
  const parts = (name || "").split("/");
  const startYear = Number(parts?.[0]);
  const endYear = Number(parts?.[1]);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null;
  return { startYear, endYear };
};

export default function SessionManagement() {
  const {
    sessions,
    selectedSession,
    setSelectedSession,
    reloadSessions,
    loadingSessions,
  } = useSession();

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.active),
    [sessions],
  );

  const onCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return toast.error("Enter a session name (e.g. 2025/2026)");

    const years = guessYearsFromName(name);
    if (!years) return toast.error("Use format like 2025/2026");

    try {
      setCreating(true);
      await sessionAPI.createSession({
        name,
        ...years,
        active: sessions.length === 0,
      });
      toast.success("Session created");
      setNewName("");
      await reloadSessions();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create session",
      );
    } finally {
      setCreating(false);
    }
  };

  const onActivate = async (id) => {
    try {
      setBusyId(id);
      const res = await sessionAPI.activateSession(id);
      toast.success(`Activated ${res.data?.name || "session"}`);
      await reloadSessions();
      if (res.data?.name) setSelectedSession(res.data.name);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to activate session",
      );
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id, name) => {
    if (!window.confirm(`Delete session "${name}"?`)) return;
    try {
      setBusyId(id);
      await sessionAPI.deleteSession(id);
      toast.success("Session deleted");
      await reloadSessions();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete session",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="school-card card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Academic Sessions</span>
          <button
            className="btn btn-outline-light btn-sm"
            onClick={reloadSessions}
            disabled={loadingSessions}
            title="Reload"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        <div className="card-body">
          <div className="fee-structure mb-3">
            <strong>Current selected session:</strong>{" "}
            <span style={{ color: "var(--nigerian-green)" }}>
              {selectedSession || "None"}
            </span>
            {activeSession?.name ? (
              <>
                {" "}
                <span
                  className="ms-2 badge"
                  style={{
                    background: "var(--school-gold)",
                    color: "var(--school-navy)",
                  }}
                >
                  Active: {activeSession.name}
                </span>
              </>
            ) : null}
          </div>

          <form onSubmit={onCreate} className="form-container mb-4">
            <label className="form-label">Create a new session</label>
            <div className="d-flex gap-2 flex-wrap">
              <input
                className="form-control"
                placeholder="e.g. 2026/2027"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button
                className="btn-nigerian"
                type="submit"
                disabled={creating}
              >
                <FiPlus /> {creating ? "Creating..." : "Create"}
              </button>
            </div>
            <small className="text-muted d-block mt-2">
              Tip: Use format like <b>2025/2026</b>. The backend saves
              startYear/endYear too.
            </small>
          </form>

          <div className="table-container">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Years</th>
                    <th>Status</th>
                    <th style={{ width: 280 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No sessions yet. Create one above.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <b>{s.name}</b>
                          {selectedSession === s.name ? (
                            <span
                              className="ms-2 badge"
                              style={{ background: "var(--nigerian-green)" }}
                            >
                              Selected
                            </span>
                          ) : null}
                        </td>
                        <td>
                          {s.startYear} / {s.endYear}
                        </td>
                        <td>
                          {s.active ? (
                            <span
                              className="badge"
                              style={{
                                background: "var(--school-gold)",
                                color: "var(--school-navy)",
                              }}
                            >
                              Active
                            </span>
                          ) : (
                            <span className="badge bg-secondary">Inactive</span>
                          )}
                        </td>
                        <td className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn-outline-nigerian"
                            type="button"
                            onClick={() => setSelectedSession(s.name)}
                          >
                            Select
                          </button>
                          <button
                            className="btn-nigerian"
                            type="button"
                            onClick={() => onActivate(s.id)}
                            disabled={busyId === s.id}
                            title="Make active"
                          >
                            <FiCheckCircle /> Activate
                          </button>
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => onDelete(s.id, s.name)}
                            disabled={busyId === s.id}
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="news-ticker mt-3">
            When you change the selected session here, your
            Fees/Results/Attendance pages will use it automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
