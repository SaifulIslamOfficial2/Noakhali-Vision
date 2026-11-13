import { Calendar, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import StoryTile from "../components/StoryTile";
import { PageLoader } from "../components/Spinner.jsx";
import api from "../utils/api";
import { locations } from "../utils/data";
import { useLang } from "../utils/LanguageContext";
import { setSEO } from "../utils/seo";
import { categoryLabel } from "../utils/categories";

/* Category page: small section label, big title, area tabs, "Read by month" and a 4-column story grid. */

const PAGE = 12;
const monthKey = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const monthLabel = (key, lang) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { month: "long", year: "numeric" });
};
const placeLabel = (raw, lang) => {
  const l = locations.find((x) => x.slug === raw || x.en === raw || x.bn === raw);
  return l ? (lang === "bn" ? l.bn : l.en) : raw;
};

export default function CategoryPage() {
  const { slug } = useParams();
  const { lang } = useLang();
  const bn = lang === "bn";
  const param = (() => { try { return decodeURIComponent(slug || ""); } catch { return slug || ""; } })();

  const [cats, setCats] = useState(null);
  const [stories, setStories] = useState(null);
  const [place, setPlace] = useState("all");
  const [month, setMonth] = useState("all");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => { api.get("/categories").then((r) => setCats(r.data.categories || [])).catch(() => setCats([])); }, []);
  const cat = useMemo(() => (cats || []).find((c) => c.slug === param || c.name === param), [cats, param]);
  const name = cat?.name || param;

  useEffect(() => {
    if (cats === null) return;
    let cancelled = false;
    setStories(null); setPlace("all"); setMonth("all"); setShown(PAGE);
    api.get(`/news?status=published&limit=200&category=${encodeURIComponent(name)}`)
      .then((r) => { if (!cancelled) setStories(r.data.news || []); })
      .catch(() => { if (!cancelled) setStories([]); });
    return () => { cancelled = true; };
  }, [cats, name]);

  useEffect(() => { setSEO({ title: `${categoryLabel(name, lang)} | Noakhali Vision`, description: cat?.description || "" }); }, [name, cat, lang]);

  const places = useMemo(() => [...new Set((stories || []).map((n) => n.location).filter(Boolean))], [stories]);
  const months = useMemo(() => [...new Set((stories || []).map((n) => monthKey(n.createdAt)).filter(Boolean))].sort().reverse(), [stories]);
  const visible = useMemo(() => (stories || []).filter((n) => (place === "all" || n.location === place) && (month === "all" || monthKey(n.createdAt) === month)), [stories, place, month]);

  if (stories === null) return <PageLoader minHeight="60vh" />;

  const tab = (active) => `whitespace-nowrap px-3 py-1 text-sm font-semibold transition-colors ${active ? "text-[#0B4D35] font-extrabold" : "text-[#5d675f] hover:text-[#0B4D35]"}`;

  return (
    <div className="bg-[#f4f6f8]">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:pt-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#0B4D35]">{bn ? "বিভাগ" : "Section"}</p>
        <h1 className="mt-2 text-4xl font-black leading-tight text-ink sm:text-5xl">{categoryLabel(name, lang)}</h1>
        {cat?.description && <p className="mt-2 max-w-2xl text-[15px] text-[#5d675f]">{cat.description}</p>}
        <p className="mt-3 text-[13px] text-[#5d675f]">{bn ? `${stories.length}টি সংবাদ` : `${stories.length} ${stories.length === 1 ? "story" : "stories"}`}</p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div className="-ml-3 flex min-w-0 flex-wrap items-center">
            <button type="button" className={tab(place === "all")} onClick={() => { setPlace("all"); setShown(PAGE); }}>{bn ? "সব" : "All"}</button>
            {places.map((p) => (
              <span key={p} className="flex items-center">
                <span className="h-4 w-px bg-black/15" aria-hidden />
                <button type="button" className={tab(place === p)} onClick={() => { setPlace(p); setShown(PAGE); }}>{placeLabel(p, lang)}</button>
              </span>
            ))}
          </div>
          {months.length > 0 && (
            <label className="relative inline-flex items-center gap-2 rounded-full border border-black/10 bg-white py-2 pl-4 pr-9 text-sm font-bold text-ink shadow-sm">
              <Calendar size={15} aria-hidden />
              <select value={month} onChange={(e) => { setMonth(e.target.value); setShown(PAGE); }} aria-label={bn ? "মাস অনুযায়ী পড়ুন" : "Read by month"}
                className="appearance-none bg-transparent pr-1 font-bold outline-none">
                <option value="all">{bn ? "মাস অনুযায়ী পড়ুন" : "Read by month"}</option>
                {months.map((k) => <option key={k} value={k}>{monthLabel(k, lang)}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3" aria-hidden />
            </label>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="py-20 text-center text-[#5d675f]">{bn ? "এই বিভাগে এখনো কোনো সংবাদ নেই।" : "No news in this section yet."}</p>
        ) : (
          <>
            <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {visible.slice(0, shown).map((n, i) => <StoryTile key={n._id || n.slug || i} news={n} lang={lang} ratio="1200/633" fit="cover" showAuthor={false} showCategory />)}
            </div>
            {shown < visible.length && (
              <div className="mt-10 text-center">
                <button type="button" onClick={() => setShown((v) => v + PAGE)}
                  className="rounded-full border border-[#0B4D35] px-7 py-2.5 text-sm font-extrabold text-[#0B4D35] hover:bg-[#0B4D35] hover:text-white">
                  {bn ? "আরও দেখুন" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
