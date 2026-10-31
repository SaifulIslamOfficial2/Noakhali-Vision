import { createContext, useContext, useEffect, useState } from "react";
import { t } from "./translations";

const LangCtx = createContext(null);
const STORAGE_KEY = "nv_language";

function getInitialLanguage() {
  if (typeof window === "undefined") return "bn";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "bn" ? saved : "bn";
  } catch {
    return "bn";
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Language still works for the current session if storage is unavailable.
    }
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-language", lang);
  }, [lang]);

  const toggle = () => setLang((current) => current === "bn" ? "en" : "bn");
  const setLanguage = (next) => {
    if (next === "bn" || next === "en") setLang(next);
  };

  return (
    <LangCtx.Provider value={{ lang, toggle, setLanguage, tr: t[lang] }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  const context = useContext(LangCtx);
  if (!context) throw new Error("useLang must be used within LanguageProvider");
  return context;
}
