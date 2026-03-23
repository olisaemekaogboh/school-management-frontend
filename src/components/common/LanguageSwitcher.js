// src/components/common/LanguageSwitcher.js
import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { Form, Dropdown } from "react-bootstrap";
import { Globe, Moon, Sun } from "lucide-react";

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem(
      "settings.language",
      JSON.stringify({ language: lang }),
    );
    // Dispatch custom event for any components that might be listening
    window.dispatchEvent(
      new CustomEvent("app-language-changed", { detail: lang }),
    );
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <Dropdown>
        <Dropdown.Toggle
          variant="outline-secondary"
          size="sm"
          id="language-dropdown"
        >
          <Globe size={16} className="me-1" />
          {language === "en" ? "EN" : "FR"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item
            active={language === "en"}
            onClick={() => handleLanguageChange("en")}
          >
            English
          </Dropdown.Item>
          <Dropdown.Item
            active={language === "fr"}
            onClick={() => handleLanguageChange("fr")}
          >
            Français
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <Form.Check
        type="switch"
        id="dark-mode-switch"
        checked={darkMode}
        onChange={toggleDarkMode}
        label={darkMode ? <Moon size={14} /> : <Sun size={14} />}
        className="dark-mode-switch"
      />
    </div>
  );
};

export default LanguageSwitcher;
