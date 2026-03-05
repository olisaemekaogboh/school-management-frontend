import React, { useEffect, useState } from "react";
import { sessionAPI } from "../services/api";
import { toast } from "react-toastify";

const TERMS = ["FIRST", "SECOND", "THIRD"]; // keep same values backend uses in Result.Term

export default function SessionTermBar({ onChange }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [term, setTerm] = useState(
    localStorage.getItem("activeTerm") || "FIRST",
  );

  const load = async () => {
    try {
      const [allRes, activeRes] = await Promise.all([
        sessionAPI.getAll(),
        sessionAPI.getActive(),
      ]);
      setSessions(allRes.data || []);
      setActiveSession(activeRes.data || null);
    } catch {
      toast.error("Failed to load sessions");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("activeTerm", term);
    onChange?.({ session: activeSession?.name || "", term });
  }, [term, activeSession, onChange]);

  const setActive = async (id) => {
    try {
      const res = await sessionAPI.setActive(id);
      setActiveSession(res.data);
      toast.success("Active session updated");
    } catch {
      toast.error("Failed to set active session");
    }
  };

  return (
    <div className="fee-structure d-flex flex-wrap gap-3 align-items-center justify-content-between">
      <div>
        <b>Active Session:</b>{" "}
        <span className="nigeria-flag-badge">
          {activeSession?.name || "Not set"}
        </span>
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-center">
        <select
          className="form-select"
          style={{ minWidth: 220 }}
          value={activeSession?.id || ""}
          onChange={(e) => setActive(e.target.value)}
        >
          <option value="" disabled>
            Select active session...
          </option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.status === "ACTIVE" ? "(ACTIVE)" : ""}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ minWidth: 160 }}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        >
          {TERMS.map((t) => (
            <option key={t} value={t}>
              {t} TERM
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
