import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const nav = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-8xl sm:text-9xl font-black text-primary select-none" style={{ lineHeight: 1 }}>
        ৪০৪
      </div>
      <h1 className="text-2xl sm:text-3xl font-black mb-3">পেজটি পাওয়া যায়নি</h1>
      <p className="text-muted text-sm sm:text-base max-w-sm mb-8"
        style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }}>
        আপনি যে পেজটি খুঁজছেন সেটি হয়তো সরানো হয়েছে, অথবা URL টি ভুল।
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => nav(-1)}
          className="px-6 py-3 border border-border font-bold text-sm hover:bg-gray-50 transition-colors"
        >
          ← আগের পেজে যান
        </button>
        <button
          onClick={() => nav("/")}
          className="px-6 py-3 bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
        >
          হোমপেজে যান
        </button>
      </div>
    </div>
  );
}
