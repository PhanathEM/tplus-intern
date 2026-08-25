import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import lo from "./locales/lo.json";

const LANGUAGE_STORAGE_KEY = "tplus_language";

function readStoredLanguage() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" || stored === "lo" ? stored : null;
}

// Translation keys are the literal English strings already used throughout
// this codebase (many of which double as routing/permission identifiers,
// e.g. nav item labels) — so t("Employees") both looks up the translation
// and, if one is missing for the active language, falls back to the key
// itself, which already reads as sensible English.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    lo: { translation: lo },
  },
  lng: readStoredLanguage() || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
