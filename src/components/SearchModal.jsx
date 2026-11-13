import { ArrowRight, Clock, CornerDownLeft, Search, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useLang } from "../utils/LanguageContext";
import { categoryLabel } from "../utils/categories";
import { extra } from "../utils/translations";

const RECENT_KEY = "nv_recent_searches";
const MAX_RECENT = 5;

const readRecent = () => {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX_RECENT) : []; }
  catch { return []; }
};
const writeRecent = (list) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* storage blocked */ } };

let trendingCache = null; // most-viewed stories, fetched once per page load

export default function SearchModal({ open, onClose }) {
  const nav = useNavigate();
  const { lang } = useLang();
  const s = extra[lang].searchModal;
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState([]);
  const [trending, setTrending] = useState(trendingCache || []);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const term = q.trim();

  // open: reset, focus, lock scroll, load recent + trending
  useEffect(() => {
    if (!open) return;
    setQ(""); setResults([]); setActive(0); setRecent(readRecent());
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!trendingCache) {
      api.get("/news?status=published&sort=views&limit=5")
        .then((r) => { trendingCache = r.data.news || []; setTrending(trendingCache); })
        .catch(() => {});
    }
    return () => { clearTimeout(t); document.body.style.overflow = prev; };
  }, [open]);

  // live results while typing (debounced)
  useEffect(() => {
    if (!open || !term) { setResults([]); setLoading(false); return; }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(() => {
      api.get(`/news?search=${encodeURIComponent(term)}&status=published&limit=6`)
        .then((r) => { if (!cancelled) setResults(r.data.news || []); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [term, open]);

  const remember = (text) => {
    const v = String(text || "").trim();
    if (!v) return;
    const next = [v, ...readRecent().filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, MAX_RECENT);
    writeRecent(next);
  };
  const goSearch = (text) => { const v = String(text || "").trim(); if (!v) return; remember(v); onClose(); nav(`/search?q=${encodeURIComponent(v)}`); };
  const goStory = (n) => { if (term) remember(term); onClose(); nav(`/news/${n.slug}`, { state: { news: n } }); };

  // one flat list of rows so arrow keys / Enter work the same everywhere
  const rows = useMemo(() => {
    if (term) {
      return [
        { key: "all", icon: "search", label: s.searchFor(term), run: () => goSearch(term) },
        ...results.map((n) => ({ key: n._id || n.slug, icon: "story", label: n.title, hint: categoryLabel(n.category, lang), run: () => goStory(n) })),
      ];
    }
    return [
      ...recent.map((r) => ({ key: `r-${r}`, section: "recent", icon: "clock", label: r, run: () => goSearch(r) })),
      ...trending.map((n) => ({ key: `t-${n._id || n.slug}`, section: "trending", icon: "trend", label: n.title, run: () => goStory(n) })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, results, recent, trending, lang]);

  useEffect(() => { setActive(0); }, [term, rows.length]);
  useEffect(() => { listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" }); }, [active]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (rows.length ? (i + 1) % rows.length : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (rows[active]) rows[active].run(); else goSearch(term); }
  };

  const clearRecent = () => { writeRecent([]); setRecent([]); };
  const removeRecent = (r) => { const next = readRecent().filter((x) => x !== r); writeRecent(next); setRecent(next); };

  if (!open) return null;

  const Icon = ({ k }) => {
    const p = { size: 16, className: "shrink-0 text-gray-400", "aria-hidden": true };
    return k === "clock" ? <Clock {...p} /> : k === "trend" ? <TrendingUp {...p} /> : <Search {...p} />;
  };

  const renderRow = (row, idx) => (
    <div
      key={row.key}
      role="option"
      aria-selected={idx === active}
      data-active={idx === active}
      onMouseMove={() => idx !== active && setActive(idx)}
      onClick={row.run}
      className={`group flex cursor-pointer items-center gap-3 px-5 py-2.5 text-[15px] ${idx === active ? "bg-[#eff3f2] text-primary" : "text-ink"}`}
    >
      <Icon k={row.icon} />
      <span className="min-w-0 flex-1 truncate" style={{ fontFamily: "'Hind Siliguri',sans-serif" }}>{row.label}</span>
      {row.hint && <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">{row.hint}</span>}
      {row.section === "recent" && (
        <button type="button" aria-label={s.remove} title={s.remove}
          onClick={(e) => { e.stopPropagation(); removeRecent(row.label); }}
          className="grid h-6 w-6 place-items-center rounded text-gray-400 hover:bg-white hover:text-ink"><X size={14} /></button>
      )}
      {idx === active && row.section !== "recent" && <ArrowRight size={16} className="shrink-0" aria-hidden />}
    </div>
  );

  const head = "px-5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[.14em] text-gray-500";

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/40 px-3 pt-[8vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={s.placeholder}
        className="w-full max-w-[640px] overflow-hidden bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search size={20} className="shrink-0 text-primary" aria-hidden />
          <input ref={inputRef} type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={s.placeholder} aria-label={s.placeholder} autoComplete="off" spellCheck={false}
            role="combobox" aria-expanded="true" aria-controls="nv-search-list"
            className="min-w-0 flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-gray-400" />
          <button type="button" onClick={onClose} className="rounded border border-border bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 hover:text-ink">ESC</button>
        </div>

        <div id="nv-search-list" role="listbox" ref={listRef} className="max-h-[56vh] overflow-y-auto pb-2">
          {term ? (
            <>
              <div className={head}>{s.results}</div>
              {rows.map(renderRow)}
              {!loading && results.length === 0 && <p className="px-5 py-3 text-sm text-gray-500">{s.noMatch}</p>}
              {loading && <p className="px-5 py-3 text-sm text-gray-400">{s.searching}</p>}
            </>
          ) : (
            <>
              {recent.length > 0 && (
                <>
                  <div className={`${head} flex items-center justify-between`}>
                    <span>{s.recent}</span>
                    <button type="button" onClick={clearRecent} className="text-[12px] font-semibold normal-case tracking-normal text-gray-500 hover:text-primary">{s.clear}</button>
                  </div>
                  {rows.filter((r) => r.section === "recent").map((r) => renderRow(r, rows.indexOf(r)))}
                </>
              )}
              {trending.length > 0 && (
                <>
                  <div className={`${head} ${recent.length ? "mt-1 border-t border-border pt-3" : ""}`}>{s.trending}</div>
                  {rows.filter((r) => r.section === "trending").map((r) => renderRow(r, rows.indexOf(r)))}
                </>
              )}
              {!recent.length && !trending.length && <p className="px-5 py-4 text-sm text-gray-500">{s.empty}</p>}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-gray-50 px-5 py-2.5 text-xs text-gray-500">
          <span className="hidden items-center gap-3 sm:flex">
            <span className="flex items-center gap-1"><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd>{s.navigate}</span>
            <span className="flex items-center gap-1"><kbd className="kbd"><CornerDownLeft size={11} /></kbd>{s.open}</span>
          </span>
          <span className="flex items-center gap-1"><kbd className="kbd">/</kbd>{s.or}<kbd className="kbd">Ctrl K</kbd>{s.anytime}</span>
        </div>
      </div>
    </div>
  );
}
