import React from "react";

function SessionTermSelector({
  session,
  setSession,
  term,
  setTerm,
  sessions = [],
  terms = ["FIRST", "SECOND", "THIRD"],
  disableTerm = false,
  sessionLabel = "Session",
  termLabel = "Term",
  className = "",
}) {
  return (
    <div className={`row ${className}`}>
      <div className="col-md-6 mb-3">
        <label className="form-label">{sessionLabel}</label>
        <select
          className="form-select"
          value={session}
          onChange={(e) => setSession(e.target.value)}
        >
          {sessions.length > 0 ? (
            sessions.map((s) => (
              <option
                key={typeof s === "string" ? s : s.id || s.session}
                value={typeof s === "string" ? s : s.session}
              >
                {typeof s === "string" ? s : s.session}
              </option>
            ))
          ) : (
            <option value="">No session available</option>
          )}
        </select>
      </div>

      {!disableTerm && (
        <div className="col-md-6 mb-3">
          <label className="form-label">{termLabel}</label>
          <select
            className="form-select"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          >
            {terms.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default SessionTermSelector;
