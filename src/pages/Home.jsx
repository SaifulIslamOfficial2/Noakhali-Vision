import { useEffect, useRef, useState } from "react";
import { Spinner } from "../components/Spinner.jsx";
import { Link, useNavigate } from "react-router-dom";
import AdCards from "../components/AdCards";
import api, { imageUrl } from "../utils/api";
import { sampleNews } from "../utils/data";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";
import { extra } from "../utils/translations";
import { subscribeNewsletter, isValidEmail } from "../utils/newsletter";

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
    <div className="relative w-full overflow-hidden" style={{ height: "clamp(220px, 34vw, 400px)" }}>
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
                borderRadius: "6px",
                boxShadow: abs === 0 ? "0 18px 40px rgba(0,0,0,0.45)" : "0 8px 20px rgba(0,0,0,0.3)",
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
                      style={{ background: "#0B4D35" }}
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
              minHeight: 0,
              minWidth: 0,
              borderRadius: "3px",
              background: i === active ? "#B5F08A" : "rgba(255,255,255,0.55)",
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
  const [state, setState] = useState("idle"); // idle | sending | error
  const isBn = lang === "bn";
  const submit = async e => {
    e.preventDefault();
    if (!isValidEmail(email) || state === "sending") return;
    setState("sending");
    try { await subscribeNewsletter(email); setDone(true); setEmail(""); setState("idle"); }
    catch { setState("error"); }
  };
  return (
    <div className="border border-border p-6 sm:p-10 text-center max-w-xl mx-auto">
      <span className="inline-flex items-center gap-1 border border-border px-3 py-1 text-xs font-black uppercase tracking-widest mb-4">
        ✉ {isBn ? "নিউজলেটার" : "NEWSLETTER"}
      </span>
      <h2 className="text-xl sm:text-3xl font-black mb-2">
        {isBn ? "সংবাদে থাকুন" : "Stay in the"}{" "}
        <span style={{ color: "#0B4D35" }}>{isBn ? "সংযুক্ত" : "loop"}</span>
      </h2>
      <p className="text-sm text-muted mb-5">
        {isBn
          ? "সর্বশেষ নোয়াখালীর সংবাদ সরাসরি আপনার ইনবক্সে পেতে সাবস্ক্রাইব করুন।"
          : "Get the latest Noakhali news delivered straight to your inbox."}
      </p>
      {state === "error" && !done && (
        <p className="mb-3 text-sm font-bold text-red-600">{isBn ? "পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।" : "Could not subscribe. Please try again."}</p>
      )}
      {done ? (
        <p className="font-bold" style={{ color: "#0B4D35" }}>✓ {isBn ? "সাবস্ক্রাইব সম্পন্ন!" : "Subscribed!"}</p>
      ) : (
        <form onSubmit={submit} className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder={isBn ? "আপনার ইমেইল" : "Enter your email"}
            className="flex-1 border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            style={{ background: "var(--bg)" }}
          />
          <button type="submit" disabled={state === "sending"}
            className="px-5 py-2.5 text-sm font-black text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: "#0B4D35" }}>
            {state === "sending" ? (isBn ? "পাঠানো হচ্ছে..." : "Sending...") : (isBn ? "সাবস্ক্রাইব" : "Subscribe")}
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
    <div>

      {/* ══ HERO ══
          Banner photo is the background; a colourful brand gradient (deep green -> emerald -> lime)
          sits on top of it, and the headline + "Latest news" carousel are placed over the banner. */}
      <section className="relative isolate overflow-hidden text-white">
        <img
          src="/hero-banner.jpg"
          alt="নোয়াখালী শহর"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          style={{ objectPosition: "60% center" }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {/* colour gradient over the photo */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(7,59,42,0.88) 0%, rgba(11,77,53,0.70) 38%, rgba(16,140,110,0.52) 68%, rgba(85,181,46,0.50) 100%)",
          }}
        />
        {/* soft glows for depth */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 55% at 85% 8%, rgba(142,219,94,0.40) 0%, transparent 70%), radial-gradient(50% 50% at 8% 95%, rgba(20,184,166,0.32) 0%, transparent 70%)",
          }}
        />
        {/* gentle fade into the page below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24" style={{ background: "linear-gradient(to top, rgba(7,59,42,0.55), transparent)" }} />

        <div className="mx-auto max-w-7xl px-3 pb-10 pt-10 sm:px-4 sm:pb-14 sm:pt-14">
          {/* Headline */}
          <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
            <h1 className="mb-3 text-3xl font-black leading-tight sm:text-5xl" style={{ textShadow: "0 2px 14px rgba(0,0,0,0.35)" }}>
              #লোকাল রুট<span style={{ color: "#B5F08A" }}> ন্যাশনাল ইমপ্যাক্ট</span>
            </h1>
            <p className="mx-auto mb-6 max-w-md text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}>
              নোয়াখালীর প্রথম AI-চালিত ডিজিটাল নিউজ প্ল্যাটফর্ম।
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/news"
                className="px-6 py-2.5 text-sm font-black shadow-lg transition-opacity hover:opacity-90"
                style={{ background: "#8EDB5E", color: "#073B2A" }}>
                সংবাদ পড়ুন →
              </Link>
              <Link to="/partnership"
                className="px-6 py-2.5 text-sm font-black text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                style={{ border: "2px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.08)" }}>
                পার্টনার হন
              </Link>
            </div>
          </div>

          {/* Latest news carousel — on top of the banner */}
          <p className="mb-3 text-center text-xs font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.85)" }}>
            {lang === "bn" ? "সর্বশেষ সংবাদ" : "Latest stories"}
          </p>
          {loading ? (
            <div className="grid w-full place-items-center rounded bg-white/10" style={{ height: "clamp(220px,34vw,400px)" }}><Spinner size={56} light /></div>
          ) : (
            <Carousel items={carouselItems} />
          )}
        </div>
      </section>

      {/* ══ ELECTION SPOTLIGHT ══ */}
      <section className="px-4 py-12 sm:py-16" style={{ background: "var(--bg2)" }}>
        <div className="election-reveal relative mx-auto max-w-6xl overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-10" style={{ background: "linear-gradient(125deg, #073B2A 0%, #0B4D35 58%, #347B2B 100%)" }}>
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[36px] border-white/10" />
          <div className="relative grid items-center gap-7 md:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-black tracking-wider">ELECTION SPOTLIGHT</span>
              <h2 className="mt-4 text-2xl font-black sm:text-4xl">নির্বাচনী পরিচিতি</h2>
              <p className="mt-1 text-sm font-bold text-secondary">Noakhali Vision-এর বিশেষ ফিচার</p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/90 sm:text-base">আসন্ন স্থানীয় সরকার নির্বাচনকে সামনে রেখে নোয়াখালীর বিভিন্ন ইউনিয়নে, দলীয় প্রার্থীদের পাশাপাশি স্বতন্ত্র প্রার্থীদের মধ্যেও নির্বাচনী তৎপরতা দেখা যাচ্ছে। আপনার পরিচিতি, জীবনবৃত্তান্ত ও নির্বাচনী ভাবনা ভোটারদের সামনে তুলে ধরতে আমাদের সঙ্গে যোগাযোগ করুন।</p>
              <p className="mt-4 text-xs leading-6 text-white/70">নিবন্ধন ফি ৳১,০০০। আবেদন যাচাই ও সম্পাদকীয় অনুমোদন সাপেক্ষে; ফি প্রদান করলেই সংবাদ প্রকাশ বা ইতিবাচক কভারেজ নিশ্চিত নয়।</p>
            </div>
            <div className="flex flex-col gap-3 md:min-w-56">
              <Link to="/election-spotlight" className="rounded-xl bg-[#55B52E] px-5 py-3 text-center text-sm font-black text-[#073B2A] transition hover:-translate-y-0.5 hover:shadow-lg">প্রিমিয়াম প্রার্থী হিসেবে নিবন্ধন করুন →</Link>
              <Link to="/election-spotlight" className="rounded-xl border border-white/50 bg-white/10 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/20">বিস্তারিত জানুন</Link>
            </div>
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
          <span style={{ color: "#0B4D35" }}>{hx.statsHeadingRed}</span>{" "}
          {hx.statsHeadingSuffix}
        </h2>
        <div className="mx-auto max-w-4xl px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {hx.stats.map(s => (
            <div key={s.label} className="border border-border p-5" style={{ background: "var(--bg)" }}>
              <p className="text-2xl sm:text-4xl font-black mb-1" style={{ color: "#0B4D35" }}>{s.value}</p>
              <p className="text-xs text-muted font-semibold leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ NEWSLETTER ══ */}
      <section className="border-t border-border py-12 px-4" style={{ background: "var(--bg2)" }}>
        <Newsletter lang={lang} />
      </section>

      {/* AdCards owns its responsive centered container; avoid a second wrapper that narrows it. */}
      <div className="pb-8">
        <AdCards placement="homepage" limit={1} />
      </div>

    </div>
  );
}
