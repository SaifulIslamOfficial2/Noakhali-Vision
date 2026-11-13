import { useNavigate } from "react-router-dom";
import { useLang } from "../utils/LanguageContext";

export default function NotFound() {
  const nav = useNavigate();
  const bn = useLang().lang === "bn";
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-8xl sm:text-9xl font-black text-primary select-none" style={{ lineHeight: 1 }}>
        {bn ? "৪০৪" : "404"}
      </div>
      <h1 className="text-2xl sm:text-3xl font-black mb-3">{bn ? "পেজটি পাওয়া যায়নি" : "Page not found"}</h1>
      <p className="text-muted text-sm sm:text-base max-w-sm mb-8"
        style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
        {bn ? "আপনি যে পেজটি খুঁজছেন সেটি হয়তো সরানো হয়েছে, অথবা URL টি ভুল।" : "The page you are looking for may have been moved, or the URL is incorrect."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => nav(-1)}
          className="px-6 py-3 border border-border font-bold text-sm hover:bg-gray-50 transition-colors"
        >
          {bn ? "← আগের পেজে যান" : "← Go back"}
        </button>
        <button
          onClick={() => nav("/")}
          className="px-6 py-3 bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
        >
          {bn ? "হোমপেজে যান" : "Go to homepage"}
        </button>
      </div>
    </div>
  );
}
