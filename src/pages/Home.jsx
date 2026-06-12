import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdCards from "../components/AdCards";
import api, { imageUrl } from "../utils/api";
import { sampleNews } from "../utils/data";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";
import { extra } from "../utils/translations";

/* ─────────────────────────────────────────────────────────────────
   Carousel — center spotlight style
   ───────────────────────────────────────────────────────────────── */
function Carousel({ items }) {
  const [active, setActive] = useState(0);
  const navigate  = useNavigate();
  const timerRef  = useRef(null);
  const total     = items.length;

  const go = (idx) => {
    setActive((idx + total) % total);
  };

  useEffect(() => {
    if (total < 2) return;
    timerRef.current = setInterval(() => setActive(a => (a + 1) % total), 4000);
    return () => clearInterval(timerRef.current);
  }, [total]);

  if (!total) return null;

  /* visible cards: prev2, prev1, ACTIVE, next1, next2 */
  const visible = [-2, -1, 0, 1, 2].map(offset => ({
    offset,
    news: items[(active + offset + total) % total],
  }));

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "clamp(260px, 38vw, 480px)" }}>
      <div className="absolute inset-0 flex items-center justify-center">
        {visible.map(({ offset, news }) => {
          const abs    = Math.abs(offset);
          const scale  = abs === 0 ? 1 : abs === 1 ? 0.78 : 0.58;
          const zIndex = abs === 0 ? 30 : abs === 1 ? 20 : 10;
          const tx     = offset * (abs === 0 ? 0 : abs === 1 ? 58 : 88);
          const opacity= abs === 0 ? 1 : abs === 1 ? 0.7 : 0.4;

          return (
            <div
              key={`${offset}-${news.slug}`}
              onClick={() => offset === 0 ? navigate(`/news/${news.slug}`) : go(active + offset)}
              className="absolute cursor-pointer overflow-hidden transition-all duration-500"
              style={{
                width: "clamp(180px, 30vw, 380px)",
                aspectRatio: "16/9",
                transform: `translateX(${tx}%) scale(${scale})`,
                zIndex,
                opacity,
                borderRadius: "4px",
              }}
            >
              <img
                src={imageUrl(news.image)}
                alt={news.title}
                className="w-full h-full object-cover object-center"
                loading="eager"
              />
              {/* active card title overlay */}
              {offset === 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 p-3"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                  }}
                >
                  {news.category && (
                    <span
                      className="text-white text-xs font-black uppercase px-2 py-0.5 inline-block mb-1"
                      style={{ background: "#EF152B" }}
                    >
                      {news.category}
                    </span>
                  )}
                  <p className="text-white text-xs sm:text-sm font-black line-clamp-2 leading-snug">
                    {news.title}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Prev / Next buttons */}
      <button
        onClick={() => go(active - 1)}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 w-9 h-9 flex items-center justify-center border-2 border-border hover:border-primary transition-colors"
        style={{ background: "var(--bg)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button
        onClick={() => go(active + 1)}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 w-9 h-9 flex items-center justify-center border-2 border-border hover:border-primary transition-colors"
        style={{ background: "var(--bg)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="transition-all duration-300"
            style={{
              width: i === active ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: i === active ? "#EF152B" : "#ccc",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Stats row
   ───────────────────────────────────────────────────────────────── */
/* STATS এখন translations থেকে আসে — extra[lang].home.stats */

/* ─────────────────────────────────────────────────────────────────
   Newsletter box
   ───────────────────────────────────────────────────────────────── */
function Newsletter({ lang }) {
  const [email, setEmail] = useState("");
  const [done,  setDone]  = useState(false);
  const isBn = lang === "bn";
  const submit = e => { e.preventDefault(); if (email.trim()) setDone(true); };
  return (
    <div className="border border-border p-6 sm:p-10 text-center max-w-xl mx-auto">
      <span className="inline-flex items-center gap-1 border border-border px-3 py-1 text-xs font-black uppercase tracking-widest mb-4">
        ✉ {isBn ? "নিউজলেটার" : "NEWSLETTER"}
      </span>
      <h2 className="text-xl sm:text-3xl font-black mb-2">
        {isBn ? "সংবাদে থাকুন" : "Stay in the"}{" "}
        <span style={{ color: "#EF152B" }}>{isBn ? "সংযুক্ত" : "loop"}</span>
      </h2>
      <p className="text-sm text-muted mb-5">
        {isBn
          ? "সর্বশেষ নোয়াখালীর সংবাদ সরাসরি আপনার ইনবক্সে পেতে সাবস্ক্রাইব করুন।"
          : "Get the latest Noakhali news delivered straight to your inbox."}
      </p>
      {done ? (
        <p className="font-bold" style={{ color: "#EF152B" }}>✓ {isBn ? "সাবস্ক্রাইব সম্পন্ন!" : "Subscribed!"}</p>
      ) : (
        <form onSubmit={submit} className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder={isBn ? "আপনার ইমেইল" : "Enter your email"}
            className="flex-1 border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            style={{ background: "var(--bg)" }}
          />
          <button type="submit"
            className="px-5 py-2.5 text-sm font-black text-white hover:opacity-90 transition-opacity"
            style={{ background: "#EF152B" }}>
            {isBn ? "সাবস্ক্রাইব" : "Subscribe"}
          </button>
        </form>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   MAIN HOME PAGE — Hero + Carousel + Stats + Newsletter only
   ═════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading]             = useState(true);
  const { lang } = useLang();
  const hx = extra[lang].home;

  useEffect(() => {
    setSEO({ title: "Noakhali Vision | নোয়াখালী ভিশন" });
  }, []);

  useEffect(() => {
    api.get("/news?status=published&page=1&limit=8")
      .then(r => setCarouselItems(r.data.news || []))
      .catch(() => setCarouselItems(sampleNews.slice(0, 8)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "var(--bg)" }}>

      {/* ══ HERO ══ */}
      <section
        className="relative text-center px-4 overflow-hidden"
        style={{ minHeight: "clamp(320px, 50vw, 560px)" }}
      >
        {/* Background image */}
        <img
          src="/hero-banner.jpg"
          alt="নোয়াখালী শহর"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 0 }}
          loading="eager"
          decoding="async"
        />
        {/* Red overlay — About page-এর মতো same gradient */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(239,21,43,0.82) 0%, rgba(0,0,0,0.65) 100%)", zIndex: 1 }}
        />
        {/* Content */}
        <div
          className="relative flex flex-col items-center justify-center"
          style={{ zIndex: 2, minHeight: "clamp(320px, 50vw, 560px)", paddingTop: "3rem", paddingBottom: "3rem" }}
        >
          <h1 className="text-3xl sm:text-5xl font-black mb-3 leading-tight text-white">
            #লোকাল রুট<span style={{ color: "#FFD0D5" }}> ন্যাশনাল ইমপ্যাক্ট</span>
          </h1>
          <p className="text-sm sm:text-base max-w-md mx-auto mb-8" style={{ color: "rgba(255,255,255,0.88)" }}>
            নোয়াখালীর প্রথম AI-চালিত ডিজিটাল নিউজ প্ল্যাটফর্ম।
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10 sm:mb-14">
            <a href="/news"
              className="px-6 py-2.5 text-sm font-black text-white hover:opacity-90 transition-opacity"
              style={{ background: "#EF152B", boxShadow: "0 2px 12px rgba(239,21,43,0.5)" }}>
              সংবাদ পড়ুন →
            </a>
            <a href="/partnership"
              className="px-6 py-2.5 text-sm font-black transition-colors"
              style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.75)", color: "#fff" }}>
              পার্টনার হন
            </a>
          </div>

          {/* Carousel */}
          <div className="w-full px-2 sm:px-0">
            {loading ? (
              <div className="w-full animate-pulse rounded" style={{ height: "clamp(200px,32vw,400px)", background: "rgba(255,255,255,0.15)" }} />
            ) : (
              <Carousel items={carouselItems} />
            )}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-t border-b border-border py-10" style={{ background: "var(--bg2)" }}>
        <p className="text-center text-xs font-black uppercase tracking-widest text-muted mb-2">
          {hx.statsLabel}
        </p>
        <h2 className="text-center text-xl sm:text-2xl font-black mb-8">
          {hx.statsHeading}{" "}
          <span style={{ color: "#EF152B" }}>{hx.statsHeadingRed}</span>{" "}
          {hx.statsHeadingSuffix}
        </h2>
        <div className="mx-auto max-w-4xl px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {hx.stats.map(s => (
            <div key={s.label} className="border border-border p-5" style={{ background: "var(--bg)" }}>
              <p className="text-2xl sm:text-4xl font-black mb-1" style={{ color: "#EF152B" }}>{s.value}</p>
              <p className="text-xs text-muted font-semibold leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ NEWSLETTER ══ */}
      <section className="border-t border-border py-12 px-4" style={{ background: "var(--bg2)" }}>
        <Newsletter lang={lang} />
      </section>

      <div className="px-4 pb-8">
        <AdCards placement="homepage" limit={1} />
      </div>

    </div>
  );
}
