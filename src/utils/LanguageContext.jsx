import { createContext, useContext, useState } from "react";
import { t } from "./translations";

const LangCtx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("bn"); // default: Bangla
  const toggle = () => setLang(l => l === "bn" ? "en" : "bn");
  return (
    <LangCtx.Provider value={{ lang, toggle, tr: t[lang] }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}
