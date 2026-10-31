import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdCards from "../components/AdCards";
import { PageLoader } from "../components/Spinner.jsx";
import api, { imageUrl, SITE_URL } from "../utils/api";
import { sampleNews } from "../utils/data";
import { useLang } from "../utils/LanguageContext";
import { extra } from "../utils/translations";
import { setSEO } from "../utils/seo";
import { subscribeNewsletter, isValidEmail } from "../utils/newsletter";

/* ── Helpers ─────────────────────────────────────────────────────── */
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/* ── Video Embed ─────────────────────────────────────────────────── */
function VideoEmbed({ url }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className="mt-6 sm:mt-8 overflow-hidden rounded-sm" style={{ aspectRatio: "16/9" }}>
        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}`}
          title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return (
    <div className="mt-6 sm:mt-8">
      <video controls className="w-full rounded-sm" style={{ maxHeight: 480 }}><source src={url} /></video>
    </div>
  );
}

/* ── Image Gallery ───────────────────────────────────────────────── */
function ImageGallery({ images, label }) {
  const [lightbox, setLightbox] = useState(null);
  if (!images?.length) return null;
  return (
    <div className="mt-6 sm:mt-8">
      <p className="mb-3 text-sm font-black uppercase text-primary">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button key={i} onClick={() => setLightbox(i)}
            className="overflow-hidden rounded-sm border border-border hover:border-primary transition-colors"
            style={{ aspectRatio: "4/3" }}>
            <img src={imageUrl(img)} alt={`Gallery ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
          </button>
        ))}
      </div>
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-black leading-none hover:opacity-70"
            onClick={() => setLightbox(null)}>×</button>
          <button className="absolute left-4 text-white text-3xl font-black hover:opacity-70 p-2"
            onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}>‹</button>
          <img src={imageUrl(images[lightbox])} alt=""
            className="max-h-screen max-w-[90vw] object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 text-white text-3xl font-black hover:opacity-70 p-2"
            onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}>›</button>
          <div className="absolute bottom-4 text-white text-sm font-bold opacity-60">{lightbox + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}

/* ── Share Buttons ───────────────────────────────────────────────── */
function ShareButtons({ url, title, tr }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const share = (platform) => {
    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
      twitter:  `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    };
    if (platform === "copy") {
      navigator.clipboard?.writeText(url)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
        .catch(() => window.prompt("Copy link:", url));
      return;
    }
    window.open(links[platform], "_blank", "noopener,width=600,height=500");
  };
  return (
    <div className="mt-6 sm:mt-8 border-t border-border pt-5">
      <p className="mb-3 text-sm font-black uppercase text-primary">{tr.share}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => share("facebook")} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-sm hover:opacity-90 transition-opacity" style={{ background: "#1877F2" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </button>
        <button onClick={() => share("whatsapp")} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-sm hover:opacity-90 transition-opacity" style={{ background: "#25D366" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button onClick={() => share("twitter")} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-sm hover:opacity-90 transition-opacity" style={{ background: "#000" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X / Twitter
        </button>
        <button onClick={() => share("copy")} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border rounded-sm transition-colors ${copied ? 'border-green-500 text-primary bg-primary/5' : 'border-border hover:bg-gray-50'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {copied ? tr.copied : tr.copyLink}
        </button>
      </div>
    </div>
  );
}

/* ── AI Summary Box ─────────────────────────────────────────────────
   Cache: sessionStorage key = ai_summary_{slug}_{lang}
   একবার load হলে reload এ আর API call হবে না।
   GEMINI_API_KEY না থাকলে gracefully hide হয়।
   ─────────────────────────────────────────────────────────────────── */
function AISummary({ content, lang, stored, active }) {
  // Old bug: the summary was fetched/cached per slug while `content` still belonged to the previous article,
  // so a wrong summary got shown (and cached). Now it is computed straight from the article being shown.
  const label = lang === "bn" ? "সারসংক্ষেপ" : "Summary";
  const footer = "";
  const loading = false;
  const summary = (() => {
    if (!active) return "";
    const saved = String(stored || "").trim();
    if (saved) return saved;
    const plain = String(content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (plain.length < 200) return ""; // short story: a summary adds nothing
    const cut = plain.slice(0, 320);
    const end = Math.max(cut.lastIndexOf("।"), cut.lastIndexOf(". "), cut.lastIndexOf("?"), cut.lastIndexOf("!"));
    return end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
  })();
  const apiMissing = false;

  // Key নেই বা content নেই — hide
  if (apiMissing || !content) return null;
  if (!summary) return null;

  return (
    <div
      className="mt-6 sm:mt-8 rounded-lg overflow-hidden"
      style={{ border: "2px solid #0B4D35" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: "#EAF6E4", borderBottom: "1px solid #C7E8B7" }}
      >
        {/* Sparkle icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#0B4D35" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
          <path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z"/>
          <path d="M5 17l.6 1.4L7 19l-1.4.6L5 21l-.6-1.4L3 19l1.4-.6z"/>
        </svg>
        <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#0B4D35" }}>
          {label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4" style={{ background: "#F5FAF2" }}>
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 rounded animate-pulse w-full"   style={{ background: "#C7E8B7" }} />
            <div className="h-3 rounded animate-pulse w-5/6"   style={{ background: "#C7E8B7" }} />
            <div className="h-3 rounded animate-pulse w-4/6"   style={{ background: "#C7E8B7" }} />
          </div>
        ) : (
          <p className="text-sm sm:text-base leading-7 text-gray-700"
            style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }}>
            {summary}
          </p>
        )}
      </div>

      {/* Footer */}
      {!loading && footer && (
        <div
          className="px-4 py-2 flex items-center gap-1.5"
          style={{ background: "#EAF6E4", borderTop: "1px solid #C7E8B7" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#0B4D35">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14H11v-2h2zm0-4H11V7h2z"/>
          </svg>
          <span className="text-xs italic" style={{ color: "#0B4D35" }}>{footer}</span>
        </div>
      )}
    </div>
  );
}

/* ── Comments ────────────────────────────────────────────────────── */
function Comments({ slug, tr }) {
  const [comments, setComments] = useState([]);
  const [name, setName]         = useState("");
  const [content, setContent]   = useState("");
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");
  const [moderator, setModerator] = useState(false);
  const [editingComment, setEditingComment] = useState("");
  const [editText, setEditText] = useState("");

  useEffect(() => {
    api.get(`/comments/${slug}`).then(r => setComments(r.data.comments || [])).catch(() => {});
    try { const user = JSON.parse(localStorage.getItem("nv_user") || "{}"); setModerator(user.role === "admin" || (user.permissions || []).includes("comments.moderate")); } catch { setModerator(false); }
  }, [slug]);
  const moderate = async (comment, action) => {
    try {
      if (action === "delete") { if (!window.confirm("এই মন্তব্যটি মুছে ফেলবেন?")) return; await api.delete(`/comments/${encodeURIComponent(comment._id)}`); setComments(prev=>prev.filter(c=>c._id!==comment._id)); }
      else { const r=await api.put(`/comments/${encodeURIComponent(comment._id)}`,{content:editText}); setComments(prev=>prev.map(c=>c._id===comment._id?r.data.comment:c)); setEditingComment(""); }
    } catch(e) { setError(e.response?.data?.message || "মন্তব্য আপডেট করা যায়নি।"); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSending(true); setError("");
    try {
      const r = await api.post(`/comments/${slug}`, { name: name.trim(), content: content.trim() });
      setComments(prev => [r.data.comment, ...prev]);
      setName(""); setContent(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || tr.submitError);
    } finally { setSending(false); }
  };

  return (
    <div className="mt-10 sm:mt-14 border-t border-border pt-6">
      <p className="mb-5 font-black uppercase text-primary text-sm sm:text-base">
        {tr.comments} ({comments.length})
      </p>
      <form onSubmit={submit} className="mb-8 border border-border p-4 bg-gray-50">
        <p className="mb-3 text-sm font-bold">{tr.commentPlaceholder}</p>
        <input
          className="w-full border border-border px-3 py-2 text-sm mb-3 bg-white focus:outline-none focus:border-primary"
          placeholder={tr.namePlaceholder} value={name}
          onChange={e => setName(e.target.value)} maxLength={60} required
        />
        <textarea
          className="w-full border border-border px-3 py-2 text-sm mb-3 bg-white focus:outline-none focus:border-primary min-h-24"
          placeholder={tr.commentBody} value={content}
          onChange={e => setContent(e.target.value)} maxLength={500} required
          style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }}
        />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={sending}
            className="px-5 py-2 bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {sending ? tr.submitting : tr.submit}
          </button>
          {success && <span className="text-sm font-bold text-primary">{tr.submitted}</span>}
          {error   && <span className="text-sm font-bold text-red-600">{error}</span>}
          <span className="ml-auto text-xs text-gray-400">{content.length}/500</span>
        </div>
      </form>
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{tr.noComments}</p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c._id} className="border border-border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black">{c.name}</p>
                  <time className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString("bn-BD", { year:"numeric", month:"long", day:"numeric" })}
                  </time>
                </div>
              </div>
              {editingComment === c._id ? <div className="grid gap-2"><textarea className="w-full rounded border p-2 text-sm" value={editText} maxLength={1000} onChange={e=>setEditText(e.target.value)}/><div className="flex gap-2"><button className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-white" onClick={()=>moderate(c,"save")}>Save</button><button className="rounded border px-3 py-1.5 text-xs" onClick={()=>setEditingComment("")}>Cancel</button></div></div> : <p className="text-sm leading-relaxed text-gray-700" style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }}>{c.content}</p>}
              {moderator && editingComment !== c._id && <div className="mt-3 flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={()=>{setEditingComment(c._id);setEditText(c.content)}}>Edit</button><button className="rounded border border-red-200 px-2 py-1 text-xs text-red-600" onClick={()=>moderate(c,"delete")}>Delete</button></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Related News ────────────────────────────────────────────────── */
function RelatedNews({ slug, tr }) {
  const [related, setRelated] = useState([]);
  useEffect(() => {
    api.get(`/news/related/${slug}`)
      .then(r => setRelated(r.data.related || []))
      .catch(() => setRelated(sampleNews.slice(0, 4)));
  }, [slug]);
  if (!related.length) return null;
  return (
    <div className="mt-10 sm:mt-14 border-t border-border pt-6">
      <p className="mb-5 font-black uppercase text-primary text-sm sm:text-base">{tr.related}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map(n => (
          <Link key={n.slug || n._id} to={`/news/${n.slug}`}
            className="flex gap-3 border border-border bg-white p-3 hover:border-primary transition-colors group">
            <img src={imageUrl(n.image)} alt={n.title}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover flex-shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
              <time className="text-xs font-bold text-primary">
                {new Date(n.createdAt).toLocaleDateString("bn-BD")}
              </time>
              <h3 className="mt-1 text-sm sm:text-base font-black leading-snug line-clamp-3 group-hover:text-secondary">
                {n.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Sidebar: Most Popular ───────────────────────────────────────── */
function MostPopular({ lang }) {
  const [popular, setPopular] = useState([]);
  useEffect(() => {
    api.get("/news?sort=views&limit=5")
      .then(r => setPopular(r.data.news || []))
      .catch(() => {});
  }, []);
  if (!popular.length) return null;
  const heading = lang === "bn" ? "সর্বাধিক পঠিত" : "Most Popular";
  return (
    <div className="border border-border bg-white overflow-hidden">
      <div className="px-4 py-3 bg-primary">
        <p className="text-sm font-black uppercase text-white tracking-wider">{heading}</p>
      </div>
      <div className="divide-y divide-border">
        {popular.map((n, i) => (
          <Link key={n._id || i} to={`/news/${n.slug}`}
            className="flex gap-3 p-3 hover:bg-gray-50 transition-colors group">
            <span className="text-2xl font-black text-gray-200 leading-none w-7 flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold leading-snug line-clamp-3 group-hover:text-primary transition-colors"
                style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }}>
                {n.title}
              </h4>
              <time className="mt-1 block text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleDateString("bn-BD")}
              </time>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Sidebar: Newsletter ─────────────────────────────────────────── */
function Newsletter({ lang }) {
  const [email, setEmail] = useState("");
  const [done, setDone]   = useState(false);
  const [state, setState] = useState("idle"); // idle | sending | error
  const heading = lang === "bn" ? "নিউজলেটার"          : "Newsletter";
  const desc    = lang === "bn"
    ? "সর্বশেষ সংবাদ সরাসরি আপনার ইনবক্সে পেতে সাবস্ক্রাইব করুন।"
    : "Subscribe to get the latest news in your inbox.";
  const placeholder = lang === "bn" ? "আপনার ইমেইল লিখুন" : "Your email address";
  const btnLabel    = lang === "bn" ? "সাবস্ক্রাইব করুন"  : "Subscribe";
  const thanks      = lang === "bn" ? "ধন্যবাদ! সাবস্ক্রাইব সম্পন্ন হয়েছে ✓" : "Subscribed! Thank you ✓";

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email) || state === "sending") return;
    setState("sending");
    try { await subscribeNewsletter(email); setDone(true); setEmail(""); setState("idle"); }
    catch { setState("error"); }
  };

  return (
    <div className="border border-border bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-800">
        <p className="text-sm font-black uppercase text-white tracking-wider">{heading}</p>
      </div>
      <div className="p-4">
        {done ? (
          <p className="text-sm font-bold text-primary text-center py-2">{thanks}</p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">{desc}</p>
            <form onSubmit={submit} className="flex flex-col gap-2">
              <input
                type="email"
                className="border border-border px-3 py-2 text-sm w-full focus:outline-none focus:border-primary"
                placeholder={placeholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {state === "error" && (
                <p className="text-xs font-bold text-red-600">{lang === "bn" ? "পাঠানো যায়নি। আবার চেষ্টা করুন।" : "Could not subscribe. Please try again."}</p>
              )}
              <button type="submit" disabled={state === "sending"}
                className="w-full bg-primary text-white text-sm font-bold py-2 hover:opacity-90 transition-opacity disabled:opacity-60">
                {state === "sending" ? (lang === "bn" ? "পাঠানো হচ্ছে..." : "Sending...") : btnLabel}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Details Page — Bongo Wiki style 2-column layout
   max-width 1200px, left=main content, right=300px sidebar
   ══════════════════════════════════════════════════════════════════ */
export default function Details() {
  const { slug } = useParams();
  const [news, setNews]         = useState(null);
  const [fetching, setFetching] = useState(true);
  const { lang } = useLang();
  const tr = extra[lang].details;

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    api.get(`/news/slug/${slug}`)
      .then(r => { if (!cancelled) setNews(r.data.news); })
      .catch(() => { if (!cancelled) setNews(sampleNews.find(x => x.slug === slug) || null); })
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (news?.title) setSEO({ title: `${news.title} | Noakhali Vision`, description: (news.content || "").slice(0, 160) });
  }, [news]);

  if (fetching) return <PageLoader minHeight="60vh" />;
  if (!news)    return <div className="p-10 sm:p-20 text-center">{tr.notFound}</div>;

  const pageUrl = `${SITE_URL}/news/${slug}`;
  // Vercel serverless function bot detect করে OG tags দেবে
  const shareUrl = pageUrl;

  return (
    <div className="mx-auto px-3 sm:px-5 py-5 sm:py-8" style={{ maxWidth: "1200px" }}>

      {/* ── 2-column: main (flex-1) + sidebar (300px) ── */}
      <div className="flex gap-7 xl:gap-10 items-start">

        {/* ═══════════════ LEFT — Main Content ═══════════════ */}
        <article className="min-w-0 flex-1">

          {/* Hero image — portrait 4:5 (1200×1500px Canva), full content width */}
          <div className="w-full overflow-hidden rounded-sm" style={{ aspectRatio: "16/9" }}>
            <img
              className="w-full h-full object-cover object-top"
              src={imageUrl(news.image)}
              alt={news.title}
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Meta */}
          <div className="mt-5 sm:mt-6">
            {news.category && (
              <span className="inline-block mb-2 px-3 py-1 text-xs font-black uppercase bg-primary text-white">
                {news.category}
              </span>
            )}
            <p className="font-bold text-primary text-sm sm:text-base">
              {new Date(news.createdAt).toLocaleDateString("bn-BD", { year:"numeric", month:"long", day:"numeric" })}
              {news.location ? ` | ${news.location}` : ""}
            </p>
            <h1 className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-black leading-tight">{news.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {tr.by} {<a className="font-bold text-primary hover:underline" href={`/author/${encodeURIComponent(news.authorId || "desk")}`}>{news.authorName || (typeof news.author === "object" ? news.author?.name : news.author) || "Noakhali Vision Desk"}</a>}
            </p>
          </div>

          {/* ── AI Summary — image এর নিচে, green border, cache enabled ── */}
          <AISummary content={news.content} lang={lang} stored={news.summary} active={news.slug === slug || news._id === slug} />

          {/* ── Article body ── */}
          <p className="mt-6 sm:mt-8 text-base sm:text-lg leading-8 sm:leading-9"
            style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }}>
            {news.content}
          </p>

          {news.videoUrl && <VideoEmbed url={news.videoUrl} />}
          {news.gallery?.length > 0 && <ImageGallery images={news.gallery} label={tr.gallery} />}

          <ShareButtons url={shareUrl} title={news.title} tr={tr} />

          <AdCards placement="news-details" limit={1} />

          <Comments slug={slug} tr={tr} />

          {/* ── Related Stories — সবার শেষে ── */}
          <RelatedNews slug={slug} tr={tr} />
        </article>

        {/* ═══════════════ RIGHT — Sidebar ═══════════════ */}
        <aside className="hidden lg:flex flex-col gap-5 flex-shrink-0" style={{ width: "300px" }}>
          <MostPopular lang={lang} />
          <Newsletter lang={lang} />
          <AdCards placement="homepage" limit={1} />
        </aside>

      </div>
    </div>
  );
}
