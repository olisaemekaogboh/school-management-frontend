// src/context/DarkModeContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "settings.darkMode";

export const DarkModeContext = createContext(null);

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      // Check system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (error) {
      console.error("Failed to load dark mode settings:", error);
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(darkMode));

      if (darkMode) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        document.body.classList.add("dark-mode");
      } else {
        document.documentElement.setAttribute("data-bs-theme", "light");
        document.body.classList.remove("dark-mode");
      }
    } catch (error) {
      console.error("Failed to save dark mode settings:", error);
    }
  }, [darkMode]);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      toggleDarkMode: () => setDarkMode((prev) => !prev),
    }),
    [darkMode],
  );

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
}

export default DarkModeProvider;
