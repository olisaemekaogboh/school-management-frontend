import { useCallback, useEffect, useMemo, useState } from "react";
import { sessionAPI } from "../services/api";

function getSessionName(item) {
  return item?.session || item?.sessionName || item?.name || "";
}

function sortSessions(list) {
  return [...list].sort((a, b) => {
    const aDate = new Date(a.startDate || 0).getTime();
    const bDate = new Date(b.startDate || 0).getTime();
    return bDate - aDate;
  });
}

export default function useActiveSession(defaultTerm = "FIRST") {
  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeSessionRecord, setActiveSessionRecord] = useState(null);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState(defaultTerm);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const normalizedSessions = useMemo(() => {
    return (availableSessions || []).map((item) => ({
      id: item.id,
      session: getSessionName(item),
      currentTerm: item.currentTerm || item.term || defaultTerm,
      active: item.active === true || item.isActive === true,
      startDate: item.startDate,
      endDate: item.endDate,
      raw: item,
    }));
  }, [availableSessions, defaultTerm]);

  const refreshActiveSession = useCallback(async () => {
    setLoadingSession(true);
    setSessionError("");

    try {
      const [sessionsRes, activeRes] = await Promise.all([
        sessionAPI.getAllSessions(),
        sessionAPI.getActiveSession(),
      ]);

      const allSessions = Array.isArray(sessionsRes?.data)
        ? sessionsRes.data
        : [];
      const sorted = sortSessions(allSessions);

      setAvailableSessions(sorted);

      const active = activeRes?.data || null;
      setActiveSessionRecord(active);

      if (active) {
        setSession(getSessionName(active));
        setTerm(active.currentTerm || defaultTerm);
      } else if (sorted.length > 0) {
        setSession(getSessionName(sorted[0]));
        setTerm(sorted[0].currentTerm || defaultTerm);
      } else {
        setSession("");
        setTerm(defaultTerm);
      }
    } catch (err) {
      console.error("Failed to load active session:", err);
      setSessionError("Failed to load active session");
      setAvailableSessions([]);
      setActiveSessionRecord(null);
      setSession("");
      setTerm(defaultTerm);
    } finally {
      setLoadingSession(false);
    }
  }, [defaultTerm]);

  useEffect(() => {
    refreshActiveSession();
  }, [refreshActiveSession]);

  return {
    session,
    setSession,
    term,
    setTerm,
    loadingSession,
    sessionError,
    availableSessions: normalizedSessions,
    activeSession: session,
    activeTerm: term,
    activeSessionRecord,
    refreshActiveSession,
    getSessionName,
  };
}
