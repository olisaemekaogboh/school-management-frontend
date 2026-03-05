// src/contexts/SessionContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { sessionAPI } from "../services/api";
import { toast } from "react-toastify";

const SessionContext = createContext(null);

const STORAGE_KEY = "sms.selectedSession";

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSessionState] = useState(
    localStorage.getItem(STORAGE_KEY) || "",
  );
  const [loadingSessions, setLoadingSessions] = useState(true);

  const setSelectedSession = (sessionName) => {
    setSelectedSessionState(sessionName);
    localStorage.setItem(STORAGE_KEY, sessionName);
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const [allRes, activeRes] = await Promise.allSettled([
        sessionAPI.getAllSessions(),
        sessionAPI.getActiveSession(),
      ]);

      const all = allRes.status === "fulfilled" ? allRes.value.data || [] : [];
      const active =
        activeRes.status === "fulfilled" ? activeRes.value.data : null;

      setSessions(all);

      // pick selected session
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedExists = stored && all.some((s) => s.name === stored);

      if (storedExists) {
        setSelectedSessionState(stored);
      } else if (active?.name) {
        setSelectedSession(active.name);
      } else if (all?.[0]?.name) {
        setSelectedSession(all[0].name);
      } else {
        setSelectedSessionState("");
      }
    } catch (e) {
      toast.error(e?.message || "Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      selectedSession,
      setSelectedSession,
      loadingSessions,
      reloadSessions: loadSessions,
    }),
    [sessions, selectedSession, loadingSessions],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
