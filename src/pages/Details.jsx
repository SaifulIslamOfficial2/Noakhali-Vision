import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import AdCards from "../components/AdCards";
import FramedImage from "../components/FramedImage";
import { PageLoader } from "../components/Spinner.jsx";
import api, { imageUrl, SITE_URL } from "../utils/api";
import { useLang } from "../utils/LanguageContext";
import { extra } from "../utils/translations";
import { setSEO, setArticleSEO } from "../utils/seo";
import { categoryLabel } from "../utils/categories";
import { categories as builtInCats } from "../utils/data";
import { catColor } from "../utils/glove";
import { Pill } from "../components/GlCard";
import { useNewsletter } from "../utils/newsletter";
import { renderContent, stripHtml } from "../utils/richText";

/* ── Helpers ─────────────────────────────────────────────────────── */
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/* ── Video Embed ─────────────────────────────────────────────────── */
function VideoEmbed({ url }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className="mt-6 sm:mt-8 overflow-hidden rounded-sm" style={{ aspectRatio: "16/9" }}>
        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}`}
          title="Video" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return (
    <div className="mt-6 sm:mt-8">
      <video controls className="w-full rounded-sm" style={{ maxHeight: 480 }}><source src={url} type={/\.webm(\?|$)/i.test(url) ? "video/webm" : "video/mp4"} /></video>
    </div>
  );
}

/* ── Image Gallery ───────────────────────────────────────────────── */
function ImageGallery({ images, label }) {
  const [lightbox, setLightbox] = useState(null);
  const count = images?.length || 0;
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft") setLightbox((i) => (i - 1 + count) % count);
      else if (e.key === "ArrowRight") setLightbox((i) => (i + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, count]);
  if (!images?.length) return null;
  return (
    <div className="mt-6 sm:mt-8">
      <p className="mb-3 text-sm font-black uppercase text-primary">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <button key={i} type="button" aria-label={`${label} ${i + 1}`} onClick={() => setLightbox(i)}
            className="relative overflow-hidden rounded-sm border border-border hover:border-primary transition-colors"
            style={{ aspectRatio: "16/9" }}>
            <FramedImage src={imageUrl(img)} alt={`Gallery ${i + 1}`} ratio={16 / 9} />
          </button>
        ))}
      </div>
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true"
          style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setLightbox(null)}>
          <button type="button" aria-label="Close" className="absolute top-4 right-4 text-white text-3xl font-black leading-none hover:opacity-70"
            onClick={() => setLightbox(null)}>×</button>
          <button type="button" aria-label="Previous" className="absolute left-4 text-white text-3xl font-black hover:opacity-70 p-2"
            onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}>‹</button>
          <img src={imageUrl(images[lightbox])} alt=""
            className="max-h-screen max-w-[90vw] object-contain" onClick={e => e.stopPropagation()} />
          <button type="button" aria-label="Next" className="absolute right-4 text-white text-3xl font-black hover:opacity-70 p-2"
            onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}>›</button>
          <div className="absolute bottom-4 text-white text-sm font-bold opacity-60">{lightbox + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}

/* ── Byline share icons + read time ─────────────────────────────── */
const fmtDate = (d, lang, opts) => new Date(d).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { timeZone: "Asia/Dhaka", ...opts });
const readMinutes = (text, lang) => { const n = Math.max(1, Math.round(stripHtml(text).split(/\s+/).filter(Boolean).length / 200)); return lang === "bn" ? String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]) : n; };
function BylineShare({ url, title }) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  const bn = lang === "bn";
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const open = (href) => window.open(href, "_blank", "noopener,width=600,height=500");
  const copy = () => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => window.prompt("Copy link:", url));
  const ic = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "currentColor" };
  return (
    <div className="nv-byline-share" role="group" aria-label={bn ? "শেয়ার" : "Share"}>
      {canNative && <button type="button" className="nv-native-share" aria-label={bn ? "শেয়ার করুন" : "Share"} onClick={() => navigator.share({ title, url }).catch(() => {})}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg></button>}
      <button type="button" className="gl-sh-fb" aria-label={bn ? "ফেসবুকে শেয়ার" : "Share on Facebook"} onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${u}`)}><svg {...ic}><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21z"/></svg></button>
      <button type="button" className="gl-sh-x" aria-label={bn ? "X-এ শেয়ার" : "Share on X"} onClick={() => open(`https://twitter.com/intent/tweet?url=${u}&text=${t}`)}><svg {...ic}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></button>
      <button type="button" className="gl-sh-tg" aria-label={bn ? "টেলিগ্রামে শেয়ার" : "Share on Telegram"} onClick={() => open(`https://t.me/share/url?url=${u}&text=${t}`)}><svg {...ic}><path d="M21.5 3.3 2.7 10.6c-.9.4-.9 1.1-.2 1.3l4.8 1.5 1.8 5.6c.2.6.4.8.8.8s.6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.8-.8l3.1-14.8c.3-1.3-.5-1.8-1.5-1.4zM8.4 13.3l9.3-5.9c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.2z"/></svg></button>
      <button type="button" className="gl-sh-wa" aria-label={bn ? "হোয়াটসঅ্যাপে শেয়ার" : "Share on WhatsApp"} onClick={() => open(`https://wa.me/?text=${t}%20${u}`)}><svg {...ic}><path fillRule="evenodd" clipRule="evenodd" d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3c.1.2 2 3.1 4.9 4.300.7.3 1.200.5 1.600.6.7.2 1.300.2 1.800.1.600-.1 1.800-.7 2-1.400.3-.7.3-1.300.2-1.400-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.600 15L2 22l5.200-1.400A10 10 0 1 0 12 2z"/></svg></button>
      <button type="button" className="gl-sh-cp" aria-label={copied ? (bn ? "কপি হয়েছে" : "Copied") : (bn ? "লিংক কপি" : "Copy link")} title={copied ? (bn ? "কপি হয়েছে" : "Copied!") : (bn ? "লিংক কপি" : "Copy link")} onClick={copy}>{copied ? <svg {...ic}><path d="M9 16.2 4.800 12l-1.400 1.400L9 19 21 7l-1.400-1.400z"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.540.540l3-3a5 5 0 0 0-7.070-7.070l-1.720 1.710"/><path d="M14 11a5 5 0 0 0-7.540-.540l-3 3a5 5 0 0 0 7.070 7.070l1.710-1.710"/></svg>}</button>
      {copied && <span className="nva-copied" role="status">{lang === "bn" ? "লিংক কপি হয়েছে" : "Link copied"}</span>}
    </div>
  );
}

/* ── Share: a vertical rail that follows you on desktop, a single row on phones ── */
function ShareRow({ url, title, variant = "inline" }) {
  const { lang } = useLang();
  return (
    <div className={variant === "inline" ? "gl-share-inline" : "gl-share-rail"}>
      {variant === "inline" && <span className="nva-share__label">{lang === "bn" ? "শেয়ার" : "Share"}</span>}
      <BylineShare url={url} title={title} />
    </div>
  );
}

/* ── Thin reading-progress line under the navbar ── */
function ReadingProgress({ targetRef }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    // progress follows the story itself (header to end of text), so it reaches 100% where the article ends
    const on = () => {
      const el = targetRef?.current;
      if (!el) { setP(0); return; }
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight * 0.6;
      setP(span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, [targetRef]);
  return <div className="nva-progress" aria-hidden="true"><i style={{ transform: `scaleX(${p})` }} /></div>;
}

/* ── AI Summary (TL;DR) ─────────────────────────────────────────────
   No paid API: a small extractive summariser picks the story's lead plus the most informative
   sentences (word frequency + numbers + position), keeps them in reading order and trims them.
   An editor-written summary (news.summary) always wins.
   ─────────────────────────────────────────────────────────────────── */
/* No saved summary (old story, or the server has no GEMINI_API_KEY)? Build a short, honest extractive summary from the story itself:
   the lead sentence plus up to two of the most informative following sentences (numbers / quotes score higher), kept in reading order.
   It is shown as a plain "সারসংক্ষেপ" and never carries the AI badge. */
const sameSlug = (a, b) => { const n = (x) => { try { return decodeURIComponent(String(x || "")).normalize("NFC").toLowerCase(); } catch { return String(x || "").normalize("NFC").toLowerCase(); } }; return !!a && n(a) === n(b); };

function extractSummary(html) {
  const plain = stripHtml(String(html || "")).replace(/\s+/g, " ").trim();
  if (plain.length < 90) return [];
  const sents = (plain.match(/[^।.!?]+[।.!?]+["”’')]*|[^।.!?]+$/g) || []).map((x) => x.trim()).filter((x) => x.length >= 25 && x.length <= 260);
  if (sents.length < 2) return [];
  const lead = sents[0];
  const rest = sents.slice(1, 12).map((t, i) => ({ t, i, score: (/[0-9\u09E6-\u09EF]/.test(t) ? 2 : 0) + (/["“”‘’]/.test(t) ? 1 : 0) + Math.min(t.length, 160) / 160 - i * 0.12 }))
    .sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => a.i - b.i).map((x) => x.t);
  const out = [lead, ...rest];
  let total = 0;
  return out.filter((t) => (total += t.length) <= 420);
}

/* Streams the summary word by word, like an AI answering in real time: a short "thinking" pause,
   then the words appear one after another with a blinking caret. Reduced-motion users get the full text at once. */
function useStreamedWords(items, run) {
  const words = useMemo(() => items.map((t) => String(t).split(/(\s+)/).filter((w) => w !== "")), [items.join("\n")]);
  const total = useMemo(() => words.reduce((n, l) => n + l.length, 0), [words]);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle -> thinking -> writing -> done
  useEffect(() => {
    setShown(0);
    if (!run || !total) { setPhase("idle"); return; }
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setShown(total); setPhase("done"); return; }
    setPhase("thinking");
    let tick;
    const start = setTimeout(() => {
      setPhase("writing");
      let n = 0;
      tick = setInterval(() => {
        n += 1;
        setShown(n);
        if (n >= total) { clearInterval(tick); setPhase("done"); }
      }, 38);
    }, 900);
    return () => { clearTimeout(start); clearInterval(tick); };
  }, [run, total, words]);
  // words visible so far, per bullet
  let left = shown;
  const lines = words.map((l) => { const take = Math.max(0, Math.min(l.length, left)); left -= take; return { text: l.slice(0, take).join(""), started: take > 0, full: take === l.length }; });
  return { lines, phase };
}

function AISummary({ lang, stored, content, active, ai = false }) {
  const bn = lang === "bn";
  const saved = String(stored || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const items = useMemo(() => (saved.length ? saved : extractSummary(content)), [stored, content]);
  const boxRef = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [active, items.length, seen]);
  const { lines, phase } = useStreamedWords(items, active && seen);
  if (!active || !items.length) return null; // story too short to summarise -> no box
  const title = bn ? "AI সারসংক্ষেপ" : "AI Summary";
  const showNote = ai && saved.length > 0;
  const busy = phase === "thinking" || phase === "writing";
  const lastIdx = lines.reduce((acc, l, i) => (l.started ? i : acc), -1);
  return (
    <aside ref={boxRef} className={`nva-ai ${busy ? "is-busy" : ""}`} aria-label={title} aria-busy={busy}>
      <div className="nva-ai__head">
        <span className="nva-ai__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.5l1.9 5.6a3 3 0 0 0 1.9 1.9l5.6 1.9-5.6 1.9a3 3 0 0 0-1.9 1.9L12 21.3l-1.9-5.6a3 3 0 0 0-1.9-1.9L2.6 11.9l5.6-1.9a3 3 0 0 0 1.9-1.9z"/><path d="M19 2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" opacity=".75"/></svg>
        </span>
        <b>{title}</b>
        {busy && <span className="nva-ai__status">{phase === "thinking" ? (bn ? "ভাবছে" : "Thinking") : (bn ? "লিখছে" : "Writing")}<span className="nva-ai__dots" aria-hidden="true"><u /><u /><u /></span></span>}
        <i>AI</i>
      </div>
      {phase === "thinking" && <div className="nva-ai__skeleton" aria-hidden="true"><span /><span /><span /></div>}
      {phase !== "thinking" && (
        <ul className="nva-ai__body" aria-live="off" style={phase === "idle" && !seen ? { visibility: "hidden" } : undefined}>
          {lines.map((l, i) => l.started || phase === "done" || phase === "idle" ? (
            <li key={i}>{l.text}{phase === "writing" && i === lastIdx && <span className="nva-ai__caret" aria-hidden="true" />}</li>
          ) : null)}
        </ul>
      )}
      {showNote && phase === "done" && <div className="nva-ai__foot">{bn ? "AI দিয়ে তৈরি · সম্পূর্ণ খবর নিচে" : "AI-generated · full story below"}</div>}
    </aside>
  );
}

/* ── Related News ────────────────────────────────────────────────── */
function RelatedNews({ slug, tr }) {
  const { lang } = useLang();
  const [related, setRelated] = useState([]);
  useEffect(() => {
    api.get(`/news/related/${slug}`)
      .then(r => setRelated(r.data.related || []))
      .catch(() => setRelated([]));
  }, [slug]);
  if (!related.length) return null;
  return (
    <section className="nva-rel" aria-label={tr.related}>
      <h2 className="nva-label">{tr.related}</h2>
      <div className="nva-rel__grid">
        {related.map(n => (
          <Link key={n.slug || n._id} to={`/news/${n.slug}`} className="nva-card group">
            <span className="nva-card__img"><FramedImage src={imageUrl(n.image)} alt="" ratio={1200 / 633} fit="cover" /></span>
            <span className="nva-card__body">
              {n.category && <span className="nva-mono nva-accent">{categoryLabel(n.category, lang)}</span>}
              <span className="nva-card__title">{n.title}</span>
              <time className="nva-mono nva-mute" dateTime={n.createdAt}>{fmtDate(n.createdAt, lang, { day: "numeric", month: "short", year: "numeric" })}</time>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function useIsDesktop() {
  const q = "(min-width: 1024px)";
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia ? window.matchMedia(q).matches : false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(q);
    const h = () => setOn(mq.matches);
    h();
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return on;
}

/* ── Older / newer story links (from the latest-news list) ───────────── */
function PrevNext({ slug, lang }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    api.get("/news?status=published&limit=60&lite=1").then(r => setList(r.data.news || [])).catch(() => setList([]));
  }, []);
  const i = list.findIndex(n => sameSlug(n.slug, slug));
  if (i < 0) return null;
  const newer = list[i - 1], older = list[i + 1];
  if (!newer && !older) return null;
  const bn = lang === "bn";
  const cell = (n, dir) => n ? (
    <Link to={`/news/${n.slug}`} className={`gl-pn gl-pn--${dir}`}>
      {dir === "prev" && <span className="gl-pn__btn" aria-hidden="true">‹</span>}
      <span className="gl-pn__txt"><small>{dir === "prev" ? (bn ? "আগের সংবাদ" : "Previous") : (bn ? "পরের সংবাদ" : "Next")}</small>{n.title}</span>
      {dir === "next" && <span className="gl-pn__btn" aria-hidden="true">›</span>}
    </Link>
  ) : <span />;
  return <nav className="gl-prevnext" aria-label={bn ? "আগের ও পরের সংবাদ" : "More stories"}>{cell(older, "prev")}{cell(newer, "next")}</nav>;
}

/* ── Sidebar: Topics — 5 categories, each with its story count in a coloured circle ── */
const TOPIC_COLORS = ["#d50000", "#f59a00", "#5fc236", "#0a9cf5", "#a66bc6"];
const bnNum = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
function Topics({ lang, stories }) {
  const [extraCats, setExtraCats] = useState([]);
  useEffect(() => {
    api.get("/categories").then(r => setExtraCats((r.data.categories || []).map(c => c.name).filter(Boolean))).catch(() => {});
  }, []);
  const known = new Set(builtInCats.map(c => c.en));
  const names = [...builtInCats.filter(c => c.en !== "all").map(c => c.en), ...extraCats.filter(n => !known.has(n))];
  const countOf = (name) => stories.filter(n => String(n.category || "").trim().toLowerCase() === String(name).trim().toLowerCase()).length;
  // the five categories with the most stories (ties keep the normal order)
  const list = names.map((name, i) => ({ name, i, count: countOf(name) }))
    .sort((a, b) => b.count - a.count || a.i - b.i).slice(0, 5);
  return (
    <div className="gl-widget">
      <h3 className="gl-widget__title">{lang === "bn" ? "বিভাগসমূহ" : "Topics"}</h3>
      <ul className="gl-topics">
        {list.map(({ name, count }, idx) => (
          <li key={name}>
            <Link to={`/category/${encodeURIComponent(name)}`}>
              <span>{categoryLabel(name, lang)}</span>
              <i style={{ background: TOPIC_COLORS[idx % TOPIC_COLORS.length] }}>{lang === "bn" ? bnNum(count) : count}</i>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Sidebar: Recent posts — newest stories, 3 at a time, with working ‹ › arrows ── */
function RecentPosts({ lang, stories, currentSlug }) {
  const PER = 3;
  const [page, setPage] = useState(0);
  const list = stories.filter(n => !sameSlug(n.slug, currentSlug)).slice(0, 9);
  if (!list.length) return null;
  const pages = Math.ceil(list.length / PER);
  const go = (d) => setPage(p => (p + d + pages) % pages);
  const shown = list.slice(page * PER, page * PER + PER);
  return (
    <div className="gl-widget">
      <div className="gl-widget__head">
        <h3 className="gl-widget__title">{lang === "bn" ? "সাম্প্রতিক সংবাদ" : "Recent posts"}</h3>
        {pages > 1 && (
          <div className="gl-widget__arrows">
            <button type="button" aria-label={lang === "bn" ? "আগের" : "Previous posts"} onClick={() => go(-1)}>‹</button>
            <button type="button" aria-label={lang === "bn" ? "পরের" : "Next posts"} onClick={() => go(1)}>›</button>
          </div>
        )}
      </div>
      <div className="gl-rows">
        {shown.map((n, i) => (
          <Link key={n._id || n.slug || i} to={`/news/${n.slug}`} className="gl-row group">
            <span className="gl-row__img"><FramedImage src={imageUrl(n.image)} alt="" ratio={1} fit="cover" /></span>
            <span className="min-w-0 flex-1">
              <span className="gl-row__title">{n.title}</span>
              <time className="gl-row__date" dateTime={n.createdAt}>{fmtDate(n.createdAt, lang)}</time>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Sidebar: Newsletter ─────────────────────────────────────────── */
function Newsletter({ lang }) {
  const nl = useNewsletter(lang, "article");
  const bn = lang === "bn";
  const heading = bn ? "নিউজলেটার" : "Newsletter";
  const desc    = bn ? "সর্বশেষ সংবাদ সরাসরি আপনার ইনবক্সে পেতে সাবস্ক্রাইব করুন।" : "Subscribe to get the latest news in your inbox.";
  const thanks  = nl.already ? (bn ? "আপনি আগেই সাবস্ক্রাইব করেছেন ✓" : "You're already subscribed ✓") : (bn ? "ধন্যবাদ! সাবস্ক্রাইব সম্পন্ন হয়েছে ✓" : "Subscribed! Thank you ✓");
  return (
    <div className="gl-widget">
      <h3 className="gl-widget__title">{heading}</h3>
      {nl.done ? (
        <p className="text-sm font-bold text-primary text-center py-2">{thanks}</p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">{desc}</p>
          <form data-no-confirm onSubmit={nl.submit} noValidate className="flex flex-col gap-2">
            <input
              type="email" inputMode="email" autoComplete="email" aria-invalid={nl.error}
              className={`border px-3 py-2 text-sm w-full focus:outline-none focus:border-primary ${nl.error ? "border-red-500" : "border-border"}`}
              placeholder={bn ? "আপনার ইমেইল লিখুন" : "Your email address"}
              value={nl.email} onChange={(e) => nl.onChange(e.target.value)}
            />
            {nl.error && <p role="alert" className="text-xs font-bold text-red-600">{nl.msg}</p>}
            <button type="submit" disabled={nl.sending}
              className="w-full bg-primary text-white text-sm font-bold py-2 hover:opacity-90 transition-opacity disabled:opacity-60">
              {nl.sending ? (bn ? "যাচাই হচ্ছে..." : "Checking...") : (bn ? "সাবস্ক্রাইব করুন" : "Subscribe")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Details Page — Gridlove-style article:
   share rail | white post card (picture on top) | sidebar widgets
   ══════════════════════════════════════════════════════════════════ */
export default function Details() {
  const { slug } = useParams();
  const location = useLocation();
  const routeNews = location.state?.news;
  const initialNews = routeNews?.slug === slug ? routeNews : null;
  const [news, setNews]         = useState(initialNews);
  const [fetching, setFetching] = useState(!initialNews);
  const [failed, setFailed]     = useState(false);
  const bodyRef = useRef(null);
  const [stories, setStories] = useState([]);   // latest published stories, used for the Topics counts and Recent posts
  useEffect(() => {
    api.get("/news?status=published&limit=100&lite=1").then(r => setStories(r.data.news || [])).catch(() => setStories([]));
  }, []);
  const isDesktop = useIsDesktop();
  const { lang } = useLang();
  const tr = extra[lang].details;

  useEffect(() => {
    let cancelled = false;
    if (!initialNews) setFetching(true);
    setFailed(false);
    api.get(`/news/slug/${slug}`)
      .then(r => { if (!cancelled) setNews(r.data.news); })
      .catch((err) => { if (!cancelled && !initialNews) { setNews(null); setFailed(err?.response?.status !== 404); } })
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!news?.title) return;
    const description = stripHtml(news.summary || news.content).slice(0, 160);
    setSEO({ title: `${news.title} | Noakhali Vision`, description });
    const img = news.image ? imageUrl(news.image) : "";
    return setArticleSEO({
      url: `${SITE_URL}/news/${encodeURIComponent(news.slug || slug)}`,
      title: news.title,
      description,
      image: /^https?:/i.test(img) ? img : img.startsWith("/") ? `${SITE_URL}${img}` : "",
      published: news.createdAt,
      modified: news.updatedAt,
      author: news.authorName,
      section: news.category ? categoryLabel(news.category, lang) : "",
    });
  }, [news, lang]);

  if (fetching) return <PageLoader minHeight="60vh" />;
  if (!news)    return <div className="p-10 sm:p-20 text-center">{failed ? (lang === "bn" ? "খবরটি লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।" : "Could not load this story. Check your connection and try again.") : tr.notFound}</div>;

  const pageUrl = `${SITE_URL}/news/${encodeURIComponent(slug)}`;
  // Vercel serverless function bot detect করে OG tags দেবে
  const shareUrl = pageUrl;

  const authorName = news.authorName || (typeof news.author === "object" ? news.author?.name : news.author) || "Noakhali Vision Desk";
  const authorHref = `/author/${encodeURIComponent(news.authorId || "desk")}`;
  const authorImg = news.authorAvatar ? imageUrl(news.authorAvatar) : (!news.authorId || news.authorId === "desk") ? "/logo.svg" : "";
  const catName = news.category ? categoryLabel(news.category, lang) : "";
  const heroSrc = imageUrl(news.image);

  return (
    <div className="nva-page">
    <ReadingProgress targetRef={bodyRef} />
    <div className={`gl-banner ${news.image ? "" : "gl-banner--plain"}`}>
      {news.image && <img className="gl-banner__bg" src={heroSrc} alt={news.title} loading="eager" fetchPriority="high" decoding="async" />}
    </div>
    <div className="gl-wrap gl-article">

      {/* ═══════════════ LEFT — share rail (wide screens) ═══════════════ */}
      <aside className="gl-rail" aria-label={lang === "bn" ? "শেয়ার" : "Share"}>
        <ShareRow variant="rail" url={shareUrl} title={news.title} />
      </aside>

      {/* ═══════════════ MIDDLE — the story ═══════════════ */}
      <div className="min-w-0">
        <article className="gl-post nva" ref={bodyRef}>

          <div className="gl-post__inner">
            <header>
              <div className="gl-post__kicker">
                {news.category
                  ? <Link to={`/category/${encodeURIComponent(news.category)}`}><Pill name={news.category} lang={lang} /></Link>
                  : <span>{lang === "bn" ? "সংবাদ" : "News"}</span>}
                {news.location && <span>{news.location}</span>}
              </div>
              <h1 className="gl-post__title">{news.title}</h1>
              <div className="gl-post__meta">
                <Link className="gl-post__author" to={authorHref}>
                  {authorImg && <img src={authorImg} alt="" onError={e => { e.currentTarget.style.display = "none"; }} />}
                  <span>{authorName}</span>
                </Link>
                <time dateTime={news.createdAt}>{fmtDate(news.createdAt, lang, { year: "numeric", month: "long", day: "numeric" })}</time>
                <span>{readMinutes(news.content, lang)} {lang === "bn" ? "মিনিটে পড়ুন" : "min read"}</span>
              </div>
            </header>

            <AISummary lang={lang} stored={news.summary} content={news.content} ai={!!news.summaryAi} active={sameSlug(news.slug, slug) || news._id === slug} />

            <div className="nv-prose nva-body" dangerouslySetInnerHTML={{ __html: renderContent(news.content) }} />

            {news.videoUrl && <VideoEmbed url={news.videoUrl} />}
            {news.gallery?.length > 0 && <ImageGallery images={news.gallery} label={tr.gallery} />}

            {(news.category || news.location) && (
              <div className="gl-tags">
                {news.category && <Link className="gl-tag" to={`/category/${encodeURIComponent(news.category)}`}>{catName}</Link>}
                {news.location && <span className="gl-tag">{news.location}</span>}
              </div>
            )}

            {/* phones/tablets: the share rail is hidden, so a share row sits right under the story */}
            <ShareRow variant="inline" url={shareUrl} title={news.title} />

            <div className="gl-author">
              {authorImg
                ? <img className="gl-author__img" src={authorImg} alt="" onError={e => { e.currentTarget.style.display = "none"; }} />
                : <span className="gl-author__img grid place-items-center font-bold text-white" style={{ background: "#0B4D35" }}>{String(authorName).slice(0, 1)}</span>}
              <div className="min-w-0">
                <p className="gl-author__name">{authorName}</p>
                <Link className="gl-author__btn" to={authorHref}>{lang === "bn" ? "সব সংবাদ দেখুন" : "View all posts"}</Link>
              </div>
            </div>

            <PrevNext slug={slug} lang={lang} />

            {news.category && (
              <Link className="gl-more" to={`/category/${encodeURIComponent(news.category)}`}>
                {lang === "bn" ? `${catName} বিভাগের আরও খবর` : `More from ${catName}`} <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </article>

        <div className="gl-ad"><AdCards placement="news-details" limit={1} /></div>

        {/* ── Related Stories ── */}
        <RelatedNews slug={slug} tr={tr} />

        {/* phones/tablets: the sidebar is hidden, so the newsletter box goes here */}
        {!isDesktop && <div className="mt-8"><Newsletter lang={lang} /></div>}
      </div>

      {/* ═══════════════ RIGHT — sidebar widgets ═══════════════ */}
      <aside className="gl-side">
        {isDesktop && <Topics lang={lang} stories={stories} />}
        {isDesktop && <RecentPosts lang={lang} stories={stories} currentSlug={slug} />}
        <Newsletter lang={lang} />
        <AdCards placement="homepage" limit={1} />
      </aside>

    </div>
    </div>
  );
}
