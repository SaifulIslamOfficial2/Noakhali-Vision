import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { LanguageProvider } from "./utils/LanguageContext.jsx";
import "./index.css";
import "./gridlove.css";
import { initReveal } from "./utils/reveal.js";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <LanguageProvider>
      <ErrorBoundary><App /></ErrorBoundary>
    </LanguageProvider>
  </BrowserRouter>
);

if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(() => setTimeout(initReveal, 0));
