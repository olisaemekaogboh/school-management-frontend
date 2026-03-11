import { useEffect, useState } from "react";
import { sessionAPI } from "../services/api";

function useActiveSession(defaultTerm = "FIRST") {
  const [session, setSession] = useState("");
  const [term, setTerm] = useState(defaultTerm);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadActiveSession = async () => {
      setLoadingSession(true);
      setSessionError("");

      try {
        const response = await sessionAPI.getActiveSession();
        const active = response?.data;

        if (!mounted) return;

        if (active?.session) {
          setSession(active.session);
        } else if (active?.name) {
          setSession(active.name);
        } else if (typeof active === "string") {
          setSession(active);
        } else {
          setSession("");
          setSessionError("No active session found");
        }

        if (active?.currentTerm) {
          setTerm(active.currentTerm);
        } else if (active?.term) {
          setTerm(active.term);
        } else {
          setTerm(defaultTerm);
        }
      } catch (error) {
        if (!mounted) return;

        console.error("Failed to load active session:", error);
        setSession("");
        setTerm(defaultTerm);
        setSessionError("Failed to load active session");
      } finally {
        if (mounted) {
          setLoadingSession(false);
        }
      }
    };

    loadActiveSession();

    return () => {
      mounted = false;
    };
  }, [defaultTerm]);

  return {
    session,
    setSession,
    term,
    setTerm,
    loadingSession,
    sessionError,
  };
}

export default useActiveSession;
