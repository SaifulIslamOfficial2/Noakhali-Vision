import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdCards from "../components/AdCards";
import GlCard from "../components/GlCard";
import GlHero from "../components/GlHero";
import HomeSections from "../components/HomeSections";
import { Spinner } from "../components/Spinner.jsx";
import api from "../utils/api";
import { keyOf } from "../utils/glove";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";
import { extra } from "../utils/translations";
import { useNewsletter } from "../utils/newsletter";

/* A titled block of story cards ("Editor's pick") */
function GlBlock({ title, children }) {
  return (
    <section className="gl-block">
      <h2 className="gl-block__title">{title}</h2>
      {children}
    </section>
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
  const nl = useNewsletter(lang, "home");
  const isBn = lang === "bn";
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
      {nl.done ? (
        <p className="font-bold" style={{ color: "#0B4D35" }}>✓ {nl.already ? (isBn ? "আপনি আগেই সাবস্ক্রাইব করেছেন" : "You're already subscribed") : (isBn ? "সাবস্ক্রাইব সম্পন্ন!" : "Subscribed!")}</p>
      ) : (
        <form data-no-confirm onSubmit={nl.submit} noValidate className="max-w-sm mx-auto">
          <div className="flex gap-2">
            <input
              type="email" inputMode="email" autoComplete="email" aria-invalid={nl.error} value={nl.email} onChange={(e) => nl.onChange(e.target.value)}
              placeholder={isBn ? "আপনার ইমেইল" : "Enter your email"}
              className={`flex-1 min-w-0 border px-4 py-2.5 text-sm focus:outline-none focus:border-primary ${nl.error ? "border-red-500" : "border-border"}`}
              style={{ background: "var(--bg)" }}
            />
            <button type="submit" disabled={nl.sending}
              className="px-5 py-2.5 text-sm font-black text-white hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
              style={{ background: "#0B4D35" }}>
              {nl.sending ? (isBn ? "যাচাই হচ্ছে..." : "Checking...") : (isBn ? "সাবস্ক্রাইব" : "Subscribe")}
            </button>
          </div>
          {nl.error && <p role="alert" className="mt-2 text-left text-sm font-bold text-red-600">{nl.msg}</p>}
        </form>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   MAIN HOME PAGE — slider, Editor's pick, designed sections, election, stats, newsletter
   ═════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();
  const bn = lang === "bn";
  const hx = extra[lang].home;

  useEffect(() => {
    setSEO({ title: "Noakhali Vision | নোয়াখালী ভিশন" });
  }, []);

  useEffect(() => {
    api.get("/news?status=published&page=1&limit=16")
      .then(r => setItems(r.data.news || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  /* slider = newest 5; Editor's pick = the next 5 (or the newest ones when there are not enough stories) */
  const slides = items.slice(0, 5);
  const pool   = items.length >= 10 ? items.slice(5) : items;
  const picks  = pool.slice(0, 5);
  const pickVariants = ["side", "overlay", "text", "top", "color"];

  return (
    <div>

      {/* ══ HERO SLIDER ══ */}
      {loading ? (
        <div className="gl-hero gl-hero--loading"><Spinner size={44} /></div>
      ) : slides.length ? (
        <GlHero items={slides} variant="left" />
      ) : (
        <div className="gl-wrap"><div className="gl-empty">{bn ? "এই মুহূর্তে কোনো সংবাদ পাওয়া যায়নি।" : "No news is available right now."}</div></div>
      )}

      {/* ══ EDITOR'S PICK ══ */}
      {picks.length > 0 && (
        <div className="gl-wrap">
          <GlBlock title={bn ? "সম্পাদকের পছন্দ" : "Editor’s pick"}>
            <div className="gl-grid gl-grid--pick">
              {picks.map((n, i) => <GlCard key={keyOf(n, i)} news={n} lang={lang} variant={pickVariants[i]} eager={i < 2} className={`gl-pick-${i + 1}`} />)}
            </div>
          </GlBlock>
        </div>
      )}

      {/* ══ Sections designed in Admin → Website Sections ══ */}
      <HomeSections />

      {/* ══ ELECTION SPOTLIGHT ══ */}
      <section className="px-4 py-12 sm:py-16">
        <div className="election-reveal glass-section relative mx-auto max-w-6xl overflow-hidden p-6 text-ink sm:p-10">
                    <div className="relative grid items-center gap-7 md:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-flex rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-black tracking-wider">ELECTION SPOTLIGHT</span>
              <h2 className="mt-4 text-2xl font-black sm:text-4xl">{lang === "bn" ? "নির্বাচনী পরিচিতি" : "Election Spotlight"}</h2>
              <p className="mt-1 text-sm font-bold text-primary">{lang === "bn" ? "Noakhali Vision-এর বিশেষ ফিচার" : "A special feature by Noakhali Vision"}</p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink sm:text-base">{lang === "bn" ? "আসন্ন স্থানীয় সরকার নির্বাচনকে সামনে রেখে নোয়াখালীর বিভিন্ন ইউনিয়নে, দলীয় প্রার্থীদের পাশাপাশি স্বতন্ত্র প্রার্থীদের মধ্যেও নির্বাচনী তৎপরতা দেখা যাচ্ছে। আপনার পরিচিতি, জীবনবৃত্তান্ত ও নির্বাচনী ভাবনা ভোটারদের সামনে তুলে ধরতে আমাদের সঙ্গে যোগাযোগ করুন।" : "Ahead of the upcoming local government elections, we are giving candidates in the unions of Noakhali — party-backed and independent alike — a platform to introduce themselves to voters. Register as a Premium Candidate to be profiled on Noakhali Vision."}</p>
              <p className="mt-4 text-xs leading-6 text-muted">{lang === "bn" ? "নিবন্ধন ফি ৳১,০০০। আবেদন যাচাই ও সম্পাদকীয় অনুমোদন সাপেক্ষে; ফি প্রদান করলেই সংবাদ প্রকাশ বা ইতিবাচক কভারেজ নিশ্চিত নয়।" : "Registration fee ৳1,000. Subject to verification and editorial approval; payment does not guarantee publication or favourable coverage."}</p>
            </div>
            <div className="flex flex-col gap-3 md:min-w-56">
              <Link to="/election-spotlight" className="rounded-xl bg-primary px-5 py-3 text-center text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-lg">{lang === "bn" ? "প্রিমিয়াম প্রার্থী হিসেবে নিবন্ধন করুন →" : "Register as a Premium Candidate →"}</Link>
              <Link to="/election-spotlight" className="rounded-xl border border-ink/40 bg-white px-5 py-3 text-center text-sm font-bold text-ink transition hover:bg-white/70">{lang === "bn" ? "বিস্তারিত জানুন" : "Learn more"}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-t border-b border-border py-10">
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
            <div key={s.label} className="glass-section p-5">
              <p className="text-2xl sm:text-4xl font-black mb-1" style={{ color: "#0B4D35" }}>{s.value}</p>
              <p className="text-xs text-muted font-semibold leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ NEWSLETTER ══ */}
      <section className="border-t border-border py-12 px-4">
        <Newsletter lang={lang} />
      </section>

      {/* AdCards owns its responsive centered container; avoid a second wrapper that narrows it. */}
      <div className="pb-8">
        <AdCards placement="homepage" limit={1} />
      </div>

    </div>
  );
}
