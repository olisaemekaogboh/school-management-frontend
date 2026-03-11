import { useEffect, useState } from "react";
import { sessionAPI } from "../services/api";

function useSchoolSession(defaultTerm = "FIRST") {
  const [loadingSession, setLoadingSession] = useState(true);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeSessionObj, setActiveSessionObj] = useState(null);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState(defaultTerm);

  const getSessionName = (sessionItem) =>
    sessionItem?.session || sessionItem?.sessionName || "";

  const loadSessionData = async () => {
    setLoadingSession(true);
    try {
      const [sessionsRes, activeRes] = await Promise.all([
        sessionAPI.getAllSessions(),
        sessionAPI.getActiveSession(),
      ]);

      const allSessions = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : [];
      const sorted = [...allSessions].sort((a, b) => {
        const aDate = new Date(a.startDate || 0).getTime();
        const bDate = new Date(b.startDate || 0).getTime();
        return bDate - aDate;
      });

      setAvailableSessions(sorted);

      const active = activeRes?.data || null;
      setActiveSessionObj(active);

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
    } catch (error) {
      console.error("Failed to load school session data:", error);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, []);

  return {
    loadingSession,
    availableSessions,
    activeSessionObj,
    session,
    setSession,
    term,
    setTerm,
    reloadSessions: loadSessionData,
    getSessionName,
  };
}

export default useSchoolSession;
