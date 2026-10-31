import { useEffect, useMemo, useState } from "react";
import { PageLoader, Spinner } from "../components/Spinner.jsx";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ChevronRight, Clock3, RotateCcw, Search, Shuffle, X } from "lucide-react";
import AdCards from "../components/AdCards";
import api, { imageUrl } from "../utils/api";
import { sampleNews, categories, locations } from "../utils/data";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";

/* ─────────────────────────────────────────────────────────────
   Editorial news page — main column + right sidebar.
   Brand colours: #0B4D35 (dark green) and #55B52E (bright green), written as hex because the
   `primary`/`secondary` Tailwind tokens do not resolve (see report).
   Animations live in index.css under the `nvn-` prefix.
   ───────────────────────────────────────────────────────────── */

const PAGE_SIZE = 5; // 1 featured + 4 on the first load; every "Load more" adds PAGE_SIZE stories

const categoryNames = {
  all: { bn: "সব সংবাদ", en: "All Stories" },
  "রাজনীতি": { bn: "রাজনীতি", en: "Politics" },
  "খেলাধুলা": { bn: "খেলাধুলা", en: "Sports" },
  "ব্যবসা": { bn: "ব্যবসা", en: "Business" },
  "শিক্ষা": { bn: "শিক্ষা", en: "Education" },
  "স্বাস্থ্য": { bn: "স্বাস্থ্য", en: "Health" },
  "বিনোদন": { bn: "বিনোদন", en: "Culture" },
  "আন্তর্জাতিক": { bn: "আন্তর্জাতিক", en: "International" },
  "স্থানীয়": { bn: "স্থানীয়", en: "Local" },
  "প্রযুক্তি": { bn: "প্রযুক্তি", en: "Technology" },
  "অর্থনীতি": { bn: "অর্থনীতি", en: "Economy" },
};

const categoryLabel = (category, lang) =>
  (categoryNames[category] || {})[lang] || category || (lang === "bn" ? "সংবাদ" : "News");

function dateLabel(value, lang) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function excerptFor(news, limit = 170) {
  const text = news?.content ? news.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
  return text.length > limit ? text.slice(0, limit).trimEnd() + "…" : text;
}

const keyOf = (n, i = 0) => n.slug || n._id || `${n.title}-${i}`;
const hrefOf = (n) => (n.slug ? `/news/${n.slug}` : null);

/* Image with brand-logo fallback if the picture is missing or broken */
function Thumb({ src, alt = "", className = "", eager = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#0B4D35] to-[#55B52E] ${className}`}>
        <img src="/logo.svg" alt="" className="h-1/2 w-1/2 object-contain opacity-90" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`nvn-img ${className}`}
    />
  );
}

/* Wraps content in a real <Link> when the story has a slug */
function StoryLink({ news, className = "", children, ...rest }) {
  const href = hrefOf(news);
  return href
    ? <Link to={href} className={className} {...rest}>{children}</Link>
    : <div className={className}>{children}</div>;
}

function Meta({ news, lang, withCategory = true }) {
  const d = dateLabel(news.createdAt, lang);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-muted">
      {withCategory && <span className="nvn-accent font-extrabold uppercase tracking-wide">{categoryLabel(news.category, lang)}</span>}
      {withCategory && d && <span aria-hidden>•</span>}
      {d && <time>{d}</time>}
    </div>
  );
}

/* Compact row (main list): 70×52 thumbnail left, meta line then 13–14px headline */
function CompactStory({ news, lang, index = 0 }) {
  return (
    <StoryLink news={news} className="nvn-rise group flex items-start gap-3.5" style={{ "--d": `${index * 55}ms` }}>
      <div className="nvn-zoom relative h-[52px] w-[70px] shrink-0 overflow-hidden rounded-[2px] bg-gray-100">
        <Thumb src={imageUrl(news.image)} alt={news.title} className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <Meta news={news} lang={lang} />
        <h3 className={`nvn-title mt-1 line-clamp-3 text-[13px] font-semibold text-ink sm:text-sm ${lang === "bn" ? "leading-[1.55]" : "leading-snug"}`}>{news.title}</h3>
      </div>
    </StoryLink>
  );
}

const pad2 = (n, lang) => (lang === "bn" ? String(n).padStart(2, "0").replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]) : String(n).padStart(2, "0"));

/* Sidebar: first story is large with a number badge */
function SideLead({ news, lang }) {
  return (
    <StoryLink news={news} className="nvn-rise group block">
      <div className="nvn-zoom relative aspect-[16/10] w-full overflow-hidden rounded-[2px] bg-gray-100">
        <Thumb src={imageUrl(news.image)} alt={news.title} className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-0 top-3 bg-[#0B4D35] px-2.5 py-1 text-xs font-black text-white shadow">{pad2(1, lang)}</span>
      </div>
      <div className="mt-3 text-[10px] font-extrabold uppercase tracking-wide nvn-accent">{categoryLabel(news.category, lang)}</div>
      <h3 className={`nvn-title mt-1 text-base font-bold text-ink ${lang === "bn" ? "leading-[1.5]" : "leading-snug"}`}>{news.title}</h3>
    </StoryLink>
  );
}

/* Sidebar: faint number, kicker + headline, 70×52 thumbnail on the right */
function SideRow({ news, lang, rank, index }) {
  return (
    <StoryLink news={news} className="nvn-rise group flex items-start gap-3" style={{ "--d": `${index * 55}ms` }}>
      <span className="w-7 shrink-0 pt-0.5 text-xl font-light tabular-nums text-muted/60">{pad2(rank, lang)}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-extrabold uppercase tracking-wide nvn-accent">{categoryLabel(news.category, lang)}</div>
        <h3 className={`nvn-title mt-0.5 line-clamp-3 text-[13px] font-semibold text-ink ${lang === "bn" ? "leading-[1.55]" : "leading-snug"}`}>{news.title}</h3>
      </div>
      <div className="nvn-zoom relative h-[52px] w-[70px] shrink-0 overflow-hidden rounded-[2px] bg-gray-100">
        <Thumb src={imageUrl(news.image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </StoryLink>
  );
}

/* Bordered sidebar card with a brand-green bar title */
function SideCard({ title, aside, children, footer }) {
  return (
    <section className="nvn-rise border border-border bg-[var(--card)]" aria-label={title}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[.14em] text-ink">
          <span className="h-4 w-[3px] bg-[#55B52E]" />{title}
        </h2>
        {aside}
      </div>
      {children}
      {footer}
    </section>
  );
}


export default function NewsPage() {
  const { lang } = useLang();
  const isBn = lang === "bn";
  const { slug: locationSlug } = useParams();
  const place = locations.find((l) => l.slug === locationSlug);

  const [activeCategory, setActiveCategory] = useState("all");
  // Admin-managed categories are added to the built-in tabs (matched by the stored category name).
  const [extraCats, setExtraCats] = useState([]);
  useEffect(() => {
    api.get("/categories").then((r) => setExtraCats((r.data.categories || []).map((c) => c.name).filter(Boolean))).catch(() => {});
  }, []);
  const tabs = useMemo(() => {
    const known = new Set(categories.map((c) => c.en));
    return [...categories, ...extraCats.filter((n) => !known.has(n)).map((n) => ({ bn: n, en: n }))];
  }, [extraCats]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");           // debounced / submitted term sent to the API
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [side, setSide] = useState([]);               // sidebar pool (latest published stories)
  const [shuffle, setShuffle] = useState(0);          // bump to reshuffle "More to Read"

  /* page number is tied to the filter set, so any filter change restarts at page 1 */
  const filterKey = `${activeCategory}|${search}|${locationSlug || ""}`;
  const [pg, setPg] = useState({ key: filterKey, page: 1 });
  const page = pg.key === filterKey ? pg.page : 1;

  useEffect(() => {
    const where = place ? (isBn ? place.bn : place.en) : "";
    setSEO({ title: isBn ? `${where ? where + " — " : ""}সর্বশেষ সংবাদ | নোয়াখালী ভিশন` : `${where ? where + " — " : ""}Latest Stories | Noakhali Vision` });
  }, [isBn, place]);

  /* live search: wait 350ms after typing stops */
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  /* main feed */
  useEffect(() => {
    let cancelled = false;
    const append = page > 1;
    append ? setLoadingMore(true) : setLoading(true);
    setError(false);

    const params = new URLSearchParams({ status: "published", page: String(page), limit: String(PAGE_SIZE) });
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (locationSlug) params.set("location", locationSlug);
    if (search) params.set("search", search);

    api.get(`/news?${params}`)
      .then((r) => {
        if (cancelled) return;
        const rows = Array.isArray(r.data?.news) ? r.data.news : [];
        setItems((prev) => {
          if (!append) return rows;
          const seen = new Set(prev.map((n, i) => keyOf(n, i)));
          return [...prev, ...rows.filter((n, i) => !seen.has(keyOf(n, i)))];
        });
        setTotal(r.data?.pagination?.total ?? rows.length);
        setPages(r.data?.pagination?.pages ?? 1);
      })
      .catch(() => {
        if (cancelled) return;
        // offline fallback: filter + paginate the bundled sample stories locally
        const q = search.toLocaleLowerCase();
        const all = sampleNews
          .filter((n) => activeCategory === "all" || n.category === activeCategory)
          .filter((n) => !place || [place.en, place.bn, place.slug].includes(n.location))
          .filter((n) => !q || `${n.title} ${n.content}`.toLocaleLowerCase().includes(q));
        const rows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        setItems((prev) => (append ? [...prev, ...rows] : rows));
        setTotal(all.length);
        setPages(Math.max(1, Math.ceil(all.length / PAGE_SIZE)));
        if (!all.length && !append) setError(false);
      })
      .finally(() => { if (!cancelled) { setLoading(false); setLoadingMore(false); } });

    return () => { cancelled = true; };
  }, [filterKey, page, retry]);

  /* sidebar pool (independent of filters) */
  useEffect(() => {
    let cancelled = false;
    api.get("/news?status=published&page=1&limit=50")
      .then((r) => { if (!cancelled) setSide(Array.isArray(r.data?.news) ? r.data.news : []); })
      .catch(() => { if (!cancelled) setSide(sampleNews); });
    return () => { cancelled = true; };
  }, []);

  const featured = items[0];
  const rest = items.slice(1);
  const hasMore = page < pages;

  const moreToRead = useMemo(() => {
    const pool = side.filter((n) => keyOf(n) !== (featured ? keyOf(featured) : null));
    const ranked = [...pool].sort((a, b) => (b.views || 0) - (a.views || 0));
    if (shuffle > 0) ranked.sort(() => Math.random() - 0.5);
    return ranked.slice(0, 5);
  }, [side, featured, shuffle]);

  const topics = useMemo(() => {
    const map = new Map();
    side.forEach((n) => {
      if (!n.category) return;
      const t = map.get(n.category) || { name: n.category, count: 0, score: 0 };
      t.count += 1; t.score += 1 + (n.views || 0) / 50;
      map.set(n.category, t);
    });
    return [...map.values()].sort((a, b) => b.score - a.score).slice(0, 8);
  }, [side]);

  const pickCategory = (cat) => {
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const clearAll = () => { setActiveCategory("all"); setQuery(""); setSearch(""); };
  const submitSearch = (e) => { e.preventDefault(); setSearch(query.trim()); };
  const filtered = activeCategory !== "all" || search;

  const fontStyle = { fontFamily: isBn ? '"Hind Siliguri","Kalpurush",sans-serif' : '"Inter","Hind Siliguri",system-ui,sans-serif' };

  return (
    <div className="min-h-screen text-ink" style={fontStyle} data-lang={lang}>
      {/* ───── Page header ───── */}
      <header className="border-b border-border bg-[var(--bg2)]">
        <div className="mx-auto max-w-[1180px] px-4 pb-0 pt-6 sm:px-6">
          <nav aria-label="Breadcrumb" className="nvn-rise mb-3 flex flex-wrap items-center gap-1 text-xs font-semibold text-muted [&_a]:!min-h-0">
            <Link to="/" className="hover:text-[#0B4D35]">{isBn ? "হোম" : "Home"}</Link>
            <ChevronRight size={12} />
            {place ? (
              <>
                <Link to="/news" className="hover:text-[#0B4D35]">{isBn ? "সংবাদ" : "News"}</Link>
                <ChevronRight size={12} />
                <span className="text-ink">{isBn ? place.bn : place.en}</span>
              </>
            ) : <span className="text-ink">{isBn ? "সংবাদ" : "News"}</span>}
          </nav>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="nvn-rise" style={{ "--d": "60ms" }}>
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[.22em] nvn-accent">{isBn ? "নিউজরুম" : "Newsroom"}</p>
              <h1 className={`text-[30px] font-bold tracking-tight sm:text-[34px] ${isBn ? "leading-[1.35]" : "leading-[1.15]"}`}>
                {place
                  ? <>{isBn ? place.bn : place.en} <span className="nvn-accent">{isBn ? "সংবাদ" : "News"}</span></>
                  : isBn ? <>সর্বশেষ <span className="nvn-accent">সংবাদ</span></> : <>Latest <span className="nvn-accent">Stories</span></>}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted">
                {isBn ? "নোয়াখালীসহ দেশ-বিদেশের সর্বশেষ খবর এক জায়গায়।" : "The latest updates from Noakhali, Bangladesh and beyond."}
              </p>
              {place && (
                <Link to="/news" className="mt-2 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-bold text-muted transition-colors hover:border-[#55B52E] hover:text-[#0B4D35]">
                  <X size={12} /> {isBn ? "সব এলাকার সংবাদ দেখুন" : "Show all areas"}
                </Link>
              )}
            </div>

            <form onSubmit={submitSearch} role="search" className="nvn-rise nv-search md:max-w-sm" style={{ "--d": "120ms" }}>
              <Search size={16} className="nv-search__icon" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isBn ? "সংবাদ খুঁজুন..." : "Search stories..."}
                aria-label={isBn ? "সংবাদ খুঁজুন" : "Search stories"}
                className="nv-search__input"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); setSearch(""); }} aria-label={isBn ? "মুছুন" : "Clear search"} className="nv-search__clear">
                  <X size={15} />
                </button>
              )}
              <button type="submit" className="nv-search__btn">
                {isBn ? "খুঁজুন" : "Search"}
              </button>
            </form>
          </div>

          {/* Category filters */}
          <div className="nvn-rise -mx-1 mt-5 flex items-center overflow-x-auto px-1 pb-0" style={{ "--d": "180ms", scrollbarWidth: "none" }} role="toolbar" aria-label={isBn ? "সংবাদের বিভাগ" : "News categories"}>
            {tabs.map((cat) => {
              const selected = activeCategory === cat.en;
              return (
                <button
                  key={cat.en}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pickCategory(cat.en)}
                  className={`nvn-tab whitespace-nowrap px-3.5 py-3 text-[13px] font-bold sm:px-4 ${selected ? "nvn-tab-on" : ""}`}
                >
                  {categoryLabel(cat.en, lang)}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ───── Body ───── */}
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0" aria-busy={loading}>
          {filtered && !loading && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-[var(--bg2)] px-4 py-2.5 text-sm">
              <span className="text-muted">
                {isBn ? `${total.toLocaleString("bn-BD")}টি সংবাদ পাওয়া গেছে` : `${total} ${total === 1 ? "story" : "stories"} found`}
                {search && <> {isBn ? "—" : "for"} <strong className="text-ink">“{search}”</strong></>}
              </span>
              <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 font-bold nvn-accent hover:underline">
                <RotateCcw size={13} /> {isBn ? "ফিল্টার মুছুন" : "Reset filters"}
              </button>
            </div>
          )}

          {loading ? (
            <PageLoader minHeight="50vh" />
          ) : items.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border bg-[var(--bg2)] px-5 py-16 text-center">
              <img src="/logo.svg" alt="" className="mx-auto mb-4 h-12 w-12 opacity-80" />
              <p className="text-base font-bold">{isBn ? "কোনো সংবাদ পাওয়া যায়নি।" : "No stories found."}</p>
              <p className="mt-1 text-sm text-muted">{isBn ? "অন্য বিভাগ বা শব্দ দিয়ে চেষ্টা করুন।" : "Try another category or search term."}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {filtered && <button type="button" onClick={clearAll} className="nvn-btn bg-[#0B4D35] px-5 py-2 text-sm font-bold text-white">{isBn ? "সব সংবাদ দেখুন" : "Show all stories"}</button>}
                <button type="button" onClick={() => setRetry((n) => n + 1)} className="nvn-btn border border-border px-5 py-2 text-sm font-bold">{isBn ? "আবার চেষ্টা করুন" : "Reload"}</button>
              </div>
            </div>
          ) : (
            <>
              {/* Featured story: 320×200 image, 20–23px headline */}
              {featured && (
                <article className="nvn-rise border-b border-border pb-7">
                  <StoryLink news={featured} className="group flex flex-col gap-4 md:flex-row md:gap-6">
                    <div className="nvn-zoom relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[3px] bg-gray-100 md:h-[200px] md:w-[320px]">
                      <Thumb src={imageUrl(featured.image)} alt={featured.title} eager className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute left-3 top-3 bg-[#0B4D35] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
                        {categoryLabel(featured.category, lang)}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <Meta news={featured} lang={lang} />
                      <h2 className={`nvn-title mt-2 text-[20px] font-bold text-ink sm:text-[23px] ${isBn ? "leading-[1.45]" : "leading-[1.28]"}`}>
                        {featured.title}
                      </h2>
                      {excerptFor(featured) && <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">{excerptFor(featured)}</p>}
                      <span className="nvn-more mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold nvn-accent">
                        {isBn ? "বিস্তারিত পড়ুন" : "Read story"} <ArrowRight size={14} />
                      </span>
                    </div>
                  </StoryLink>
                </article>
              )}

              {/* Compact list: 70×52 thumbnails, 13–14px headlines */}
              {rest.length > 0 && (
                <section className="pt-6" aria-label={isBn ? "আরও সংবাদ" : "More stories"}>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    {rest.map((n, i) => (
                      <div key={keyOf(n, i)} className="contents">
                        {i === 4 && (
                          <div className="nvn-adwrap sm:col-span-2"><span className="nvn-adtag">AD</span><AdCards placement="homepage" limit={1} /></div>
                        )}
                        <div className="border-b border-border pb-5">
                          <CompactStory news={n} lang={lang} index={i % PAGE_SIZE} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Load more */}
              <div className="mt-8 flex flex-col items-center gap-2 border-t border-border pt-7">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => setPg({ key: filterKey, page: page + 1 })}
                    disabled={loadingMore}
                    className="nvn-btn nvn-loadmore inline-flex min-w-[210px] items-center justify-center gap-2 rounded-full border border-ink/25 px-8 py-3 text-xs font-extrabold uppercase tracking-[.12em] text-ink disabled:cursor-wait disabled:opacity-70"
                  >
                    {loadingMore ? <><Spinner size={18} /> {isBn ? "লোড হচ্ছে..." : "Loading..."}</> : <>{isBn ? "আরও সংবাদ দেখুন" : "Load more articles"} <ArrowRight size={15} /></>}
                  </button>
                ) : (
                  <p className="text-xs font-semibold text-muted">{isBn ? "সব সংবাদ দেখানো হয়েছে" : "You’re all caught up"}</p>
                )}
                <p className="text-[11px] text-muted">
                  {isBn
                    ? `${total.toLocaleString("bn-BD")}টির মধ্যে ${items.length.toLocaleString("bn-BD")}টি দেখানো হচ্ছে`
                    : `Showing ${items.length} of ${total}`}
                </p>
              </div>
            </>
          )}
        </main>

        {/* ───── Sidebar ───── */}
        <aside className="space-y-6">
          <SideCard
            title={isBn ? "আরও পড়ুন" : "More to Read"}
            aside={
              <button type="button" onClick={() => setShuffle((n) => n + 1)} className="nvn-shuffle inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted hover:text-ink">
                <Shuffle size={13} /> {isBn ? "শাফল" : "Shuffle"}
              </button>
            }
            footer={
              <button type="button" onClick={clearAll} className="nvn-foot flex w-full items-center justify-between border-t border-border px-4 py-3 text-[13px] font-semibold text-ink">
                {isBn ? "সব সর্বশেষ সংবাদ" : "All latest stories"} <ArrowRight size={14} className="nvn-arrow" />
              </button>
            }
          >
            {moreToRead.length ? (
              <div key={shuffle} className="px-4">
                <div className="border-b border-border py-4"><SideLead news={moreToRead[0]} lang={lang} /></div>
                {moreToRead.slice(1).map((n, i) => (
                  <div key={keyOf(n, i)} className="border-b border-border py-3.5 last:border-0">
                    <SideRow news={n} lang={lang} rank={i + 2} index={i + 1} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-sm text-muted">{isBn ? "আরও সংবাদ শিগগিরই আসছে।" : "More stories coming soon."}</p>
            )}
          </SideCard>

          <div className="nvn-adwrap"><span className="nvn-adtag">AD</span><AdCards placement="homepage" limit={1} /></div>

          <SideCard title={isBn ? "ট্রেন্ডিং টপিক" : "Trending Topics"}>
            {topics.length ? (
              <ol className="px-4">
                {topics.slice(0, 6).map((t, i) => {
                  const on = activeCategory === t.name;
                  return (
                    <li key={t.name} className="border-b border-border last:border-0">
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => pickCategory(on ? "all" : t.name)}
                        className={`nvn-topic flex w-full items-center gap-4 py-3.5 text-left ${on ? "nvn-topic-on" : ""}`}
                      >
                        <span className="w-8 text-[22px] font-light tabular-nums text-[#55B52E]/70">{pad2(i + 1, lang)}</span>
                        <span className="flex-1 text-sm font-semibold">{categoryLabel(t.name, lang)}</span>
                        <span className="text-[11px] font-bold text-muted">{isBn ? t.count.toLocaleString("bn-BD") : t.count}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="p-4 text-sm text-muted">{isBn ? "এখনো কোনো টপিক নেই।" : "No topics yet."}</p>
            )}
          </SideCard>

          {/* Brand card with the official logo */}
          <section className="nvn-brand relative overflow-hidden rounded-[4px] p-5 text-white">
            <img src="/noakhali-vision-wordmark.png" alt="Noakhali Vision" className="mb-3 h-10 w-auto rounded-sm bg-white px-2 py-1" />
            <p className="text-[13px] leading-relaxed text-white/90">
              {isBn ? "নোয়াখালীর প্রতিটি উপজেলার খবর, স্থানীয় কণ্ঠ — জাতীয় প্রভাব।" : "Hyperlocal reporting from every upazila of Noakhali — local roots, national impact."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/about" className="nvn-btn bg-[#55B52E] px-4 py-2 text-xs font-extrabold text-[#073B2A]">{isBn ? "আমাদের সম্পর্কে" : "About us"}</Link>
              <Link to="/partnership" className="nvn-btn border border-white/60 px-4 py-2 text-xs font-bold text-white hover:bg-white/10">{isBn ? "পার্টনার হন" : "Partner with us"}</Link>
            </div>
          </section>

          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            <Clock3 size={12} className="mt-0.5 shrink-0" />
            {isBn ? "সংবাদ প্রকাশের সময় ও তথ্য সংশ্লিষ্ট প্রতিবেদনে উল্লেখিত তথ্য অনুযায়ী দেখানো হয়।" : "Publication times and article details are shown as supplied with each story."}
          </p>
        </aside>
      </div>
    </div>
  );
}
