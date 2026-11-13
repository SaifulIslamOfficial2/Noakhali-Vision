import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useLang } from "../utils/LanguageContext";
import StoryTile from "./StoryTile";

/* A website section designed in Admin → Website Sections. The same component renders it on the home page
   and in the admin live preview (preview = true), so what you design is exactly what visitors get. */

export const isFresh = (s, preview = false) =>
  !!s.badge && (preview || !s.createdAt || Date.now() - new Date(s.createdAt).getTime() < (s.badgeDays || 14) * 86400000);

export default function SectionBlock({ section: s, preview = false }) {
  const { lang } = useLang();
  const bn = lang === "bn";
  const [items, setItems] = useState(null);

  const count = Math.min(12, Math.max(1, Number(s.count) || 4));
  const query = (() => {
    const p = new URLSearchParams({ status: "published", limit: String(count) });
    if (s.source === "popular") p.set("sort", "views");
    if (s.source === "category" && s.category) p.set("category", s.category);
    if (s.location) p.set("location", s.location);
    return p.toString();
  })();

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      api.get(`/news?${query}`).then((r) => { if (!cancelled) setItems(r.data.news || []); }).catch(() => { if (!cancelled) setItems([]); });
    }, preview ? 300 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, preview]);

  const dark = s.theme === "dark";
  const accent = s.accent || "#0B4D35";
  const title = (bn ? s.title || s.titleEn : s.titleEn || s.title) || "";
  const kicker = (bn ? s.kicker || s.kickerEn : s.kickerEn || s.kicker) || "";
  const fresh = isFresh(s, preview);
  const seeAll = s.source === "category" && s.category ? `/category/${encodeURIComponent(s.category)}` : "/news";

  if (items && items.length === 0 && !preview) return null; // nothing to show: hide the whole section from visitors

  const tileProps = { lang, ratio: "1200/633", cardStyle: s.cardStyle || "plain", accent, dark, showAuthor: s.showAuthor !== false, showDate: s.showDate !== false, showReadTime: s.showReadTime !== false, showCategory: !!s.showCategory };
  const list = items || [];

  let body = null;
  if (s.layout === "list") {
    body = <div className="grid gap-5 md:grid-cols-2">{list.map((n, i) => <StoryTile key={n._id || n.slug || i} news={n} variant="row" {...tileProps} />)}</div>;
  } else if (s.layout === "scroller") {
    body = <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-3">{list.map((n, i) => <div key={n._id || n.slug || i} className="w-[260px] shrink-0 snap-start sm:w-[300px]"><StoryTile news={n} {...tileProps} /></div>)}</div>;
  } else if (s.layout === "featured") {
    body = (
      <div className="grid gap-x-6 gap-y-8 lg:grid-cols-3">
        {list.map((n, i) => (
          <div key={n._id || n.slug || i} className={i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}>
            <StoryTile news={n} {...tileProps} big={i === 0} />
          </div>
        ))}
      </div>
    );
  } else {
    const cols = s.layout === "grid3" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
    body = <div className={`grid gap-x-5 gap-y-9 ${cols}`}>{list.map((n, i) => <StoryTile key={n._id || n.slug || i} news={n} {...tileProps} />)}</div>;
  }

  return (
    <section style={{ background: s.bg || "#f4f6f8", color: dark ? "#fff" : undefined }} className="py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b pb-4" style={{ borderColor: dark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.1)" }}>
          <div className="min-w-0">
            {(kicker || fresh) && (
              <div className="mb-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em]" style={{ color: dark ? "rgba(255,255,255,.85)" : accent }}>
                {fresh && <span className="rounded-[3px] px-1.5 py-[2px] text-[9px] leading-none text-white" style={{ background: "#e11d48" }}>{bn ? "নতুন" : "NEW"}</span>}
                {kicker && <span>{kicker}</span>}
              </div>
            )}
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h2>
            {s.description && <p className={`mt-1 max-w-2xl text-sm ${dark ? "text-white/75" : "text-[#5d675f]"}`}>{s.description}</p>}
          </div>
          {s.showAllLink !== false && (
            <Link to={preview ? "#" : seeAll} onClick={(e) => preview && e.preventDefault()}
              className="inline-flex items-center gap-1.5 text-sm font-extrabold hover:underline" style={{ color: dark ? "#fff" : accent }}>
              {bn ? "সব দেখুন" : "See all"} <ArrowRight size={15} />
            </Link>
          )}
        </div>
        {items === null ? <p className="py-10 text-center text-sm opacity-60">…</p>
          : list.length === 0 ? <p className="py-10 text-center text-sm opacity-70">{bn ? "এই শর্তে কোনো প্রকাশিত সংবাদ নেই।" : "No published news matches this setting."}</p>
          : body}
      </div>
    </section>
  );
}
