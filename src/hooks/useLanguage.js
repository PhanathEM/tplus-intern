import { useEffect, useState } from "react";
import i18n from "../i18n";

const LANGUAGE_STORAGE_KEY = "tplus_language";

function readStoredLanguage() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" || stored === "lo" ? stored : null;
}

export function useLanguage() {
  const [language, setLanguage] = useState(() => readStoredLanguage() || "en");

  useEffect(() => {
    i18n.changeLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  function toggleLanguage() {
    setLanguage((current) => (current === "en" ? "lo" : "en"));
  }

  return { language, toggleLanguage };
}
