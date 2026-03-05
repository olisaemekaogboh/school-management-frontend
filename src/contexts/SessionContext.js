import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SessionAPI } from "../services/api";
import { toast } from "react-toastify";

const SessionContext = createContext(null);

const LS_KEY = "sms_active_session_term_v1";

export function SessionProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null); // {name, currentTerm}
  const [selection, setSelection] = useState({ session: "", term: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [allRes, activeRes] = await Promise.all([
        SessionAPI.getAll(),
        SessionAPI.getActive(),
      ]);

      setSessions(allRes.data || []);
      setActiveSession(activeRes.data || null);

      // restore selection from localStorage, else use backend active defaults
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (saved?.session && saved?.term) {
        setSelection(saved);
      } else if (activeRes.data?.name && activeRes.data?.currentTerm) {
        setSelection({
          session: activeRes.data.name,
          term: activeRes.data.currentTerm,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load academic session settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setSessionTerm = (next) => {
    setSelection(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const value = useMemo(
    () => ({
      loading,
      sessions,
      activeSession,
      selection,
      setSessionTerm,
      refreshSessions: load,
    }),
    [loading, sessions, activeSession, selection],
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
