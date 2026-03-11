import { useEffect, useState } from "react";
import { sessionAPI } from "../services/api";

function useActiveSession(defaultTerm = "FIRST") {
  const [session, setSession] = useState("");
  const [term, setTerm] = useState(defaultTerm);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        const response = await sessionAPI.getActiveSession();
        const active = response?.data;

        if (active?.sessionName) {
          setSession(active.sessionName);
        } else {
          setSession("");
        }
      } catch (error) {
        console.error("Failed to load active session:", error);
        setSession("");
      } finally {
        setLoadingSession(false);
      }
    };

    loadActiveSession();
  }, []);

  return {
    session,
    setSession,
    term,
    setTerm,
    loadingSession,
  };
}

export default useActiveSession;
