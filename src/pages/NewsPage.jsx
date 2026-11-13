import { useEffect, useMemo, useState } from "react";
import { PageLoader, Spinner } from "../components/Spinner.jsx";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, RotateCcw, Search, X } from "lucide-react";
import AdCards from "../components/AdCards";
import GlCard from "../components/GlCard";
import GlHero from "../components/GlHero";
import api, { imageUrl } from "../utils/api";
import { categories, locations } from "../utils/data";
import { setSEO } from "../utils/seo";
import { categoryLabel } from "../utils/categories";
import { keyOf } from "../utils/glove";
import { useLang } from "../utils/LanguageContext";

/* ─────────────────────────────────────────────────────────────
   News page, Gridlove "modules" style:
     dark centred slider (newest 5)
     filter card: breadcrumb · search · category tabs
     3-column grid of story cards + "Load more"
   Slider/card styles live in gridlove.css (gl-); the tabs and search keep their nvx- styles.
   ───────────────────────────────────────────────────────────── */

const PAGE_SIZE = 12; // multiple of 3 so the grid always ends on a full row; each "Load more" adds PAGE_SIZE

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

  /* page number is tied to the filter set, so any filter change restarts at page 1 */
  const filterKey = `${activeCategory}|${search}|${locationSlug || ""}`;
  const [pg, setPg] = useState({ key: filterKey, page: 1 });
  const page = pg.key === filterKey ? pg.page : 1;

  useEffect(() => {
    const where = place ? (isBn ? place.bn : place.en) : "";
    setSEO({ title: isBn ? `${where ? where + " — " : ""}সর্বশেষ সংবাদ | নোয়াখালী ভিশন` : `${where ? where + " — " : ""}Latest News | Noakhali Vision` });
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
        if (!append) {
          setItems([]);
          setTotal(0);
          setPages(1);
        }
        setError(true);
      })
      .finally(() => { if (!cancelled) { setLoading(false); setLoadingMore(false); } });

    return () => { cancelled = true; };
  }, [filterKey, page, retry]);

  const [recentPage, setRecentPage] = useState(0);
  const recentPages = Math.max(1, Math.ceil(Math.min(items.length, 9) / 3));
  const recentShown = items.slice(0, 9).slice(recentPage * 3, recentPage * 3 + 3);
  useEffect(() => { setRecentPage(0); }, [filterKey]);
  const slides = items.slice(0, 5);
  const hasMore = page < pages;

  useEffect(() => {
    document.querySelector('.nvx-tabs [aria-pressed="true"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [activeCategory]);
  const pickCategory = (cat) => {
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const clearAll = () => { setActiveCategory("all"); setQuery(""); setSearch(""); };
  const submitSearch = (e) => { e.preventDefault(); setSearch(query.trim()); };
  const filtered = activeCategory !== "all" || search;

  return (
    <div className="nvx min-h-screen" data-lang={lang}>
      {/* ───── Slider: newest stories ───── */}
      {!loading && slides.length > 0 && <GlHero items={slides} variant="center" />}

      <div className="gl-wrap">
        {/* ───── Filter card: breadcrumb · search · category tabs ───── */}
        <header className="gl-filter">
          <div className="nvx-bar">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-4">
              <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="nvx-mono nvx-mute flex flex-nowrap items-center gap-1.5 whitespace-nowrap">
                  <Link to="/" className="hover:text-[var(--nvx-red)]">{isBn ? "হোম" : "Home"}</Link>
                  <span aria-hidden>/</span>
                  {place ? (
                    <>
                      <Link to="/news" className="hover:text-[var(--nvx-red)]">{isBn ? "সংবাদ" : "News"}</Link>
                      <span aria-hidden>/</span>
                      <span className="nvx-ink">{isBn ? place.bn : place.en}</span>
                    </>
                  ) : <span className="nvx-ink">{isBn ? "সংবাদ" : "News"}</span>}
                </nav>
                <h1 className={place ? "nvx-serif mt-2 text-[26px] font-bold leading-tight sm:text-[30px]" : "sr-only"}>
                  {place
                    ? <>{isBn ? place.bn : place.en} <span className="nvx-red">{isBn ? "সংবাদ" : "News"}</span></>
                    : isBn ? "সর্বশেষ সংবাদ" : "Latest News"}
                </h1>
                {place && (
                  <Link to="/news" className="nvx-mono nvx-mute mt-2 inline-flex items-center gap-1 hover:text-[var(--nvx-red)]">
                    <X size={12} /> {isBn ? "সব এলাকার সংবাদ" : "Show all areas"}
                  </Link>
                )}
              </div>

              <form onSubmit={submitSearch} role="search" className="nvx-search">
                <Search size={15} className="nvx-search__icon" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isBn ? "সংবাদ খুঁজুন..." : "Search news..."}
                  aria-label={isBn ? "সংবাদ খুঁজুন" : "Search news"}
                  className="nvx-search__input"
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(""); setSearch(""); }} aria-label={isBn ? "মুছুন" : "Clear search"} className="nvx-search__clear">
                    <X size={14} />
                  </button>
                )}
              </form>
            </div>

            <div className="nvx-tabs -mx-1 mt-2 flex items-center gap-1 overflow-x-auto px-1" style={{ scrollbarWidth: "none" }} role="toolbar" aria-label={isBn ? "সংবাদের বিভাগ" : "News categories"}>
              {tabs.map((cat) => {
                const selected = activeCategory === cat.en;
                return (
                  <button
                    key={cat.en}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pickCategory(cat.en)}
                    className={`nvx-tab nvx-mono whitespace-nowrap ${selected ? "nvx-tab-on" : ""}`}
                  >
                    {categoryLabel(cat.en, lang)}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* ───── News feed with Gridlove right sidebar ───── */}
        <div className="gl-news-layout">
        <main className="gl-newsbody" aria-busy={loading}>
          {filtered && !loading && (
            <div className="gl-found">
              <span>
                {isBn ? `${total.toLocaleString("bn-BD")}টি সংবাদ পাওয়া গেছে` : `${total} news found`}
                {search && <> {isBn ? "—" : "for"} <strong>“{search}”</strong></>}
              </span>
              <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 nvx-red hover:underline">
                <RotateCcw size={12} /> {isBn ? "ফিল্টার মুছুন" : "Reset filters"}
              </button>
            </div>
          )}

          {loading ? (
            <PageLoader minHeight="50vh" />
          ) : items.length === 0 ? (
            <div className="gl-empty">
              <img src="/logo.svg" alt="" className="mx-auto mb-4 h-12 w-12 opacity-70" />
              <p className="text-xl font-bold">{error ? (isBn ? "সার্ভার থেকে সংবাদ আনা যাচ্ছে না।" : "Could not load news from the server.") : (isBn ? "কোনো সংবাদ পাওয়া যায়নি।" : "No news found.")}</p>
              <p className="mt-1 text-sm">{error ? (isBn ? "Backend ও Database সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।" : "Check the backend and database connection, then retry.") : (isBn ? "অন্য বিভাগ বা শব্দ দিয়ে চেষ্টা করুন।" : "Try another category or search term.")}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {filtered && <button type="button" onClick={clearAll} className="gl-btn">{isBn ? "সব সংবাদ দেখুন" : "Show all news"}</button>}
                <button type="button" onClick={() => setRetry((n) => n + 1)} className="gl-btn gl-btn--light">{isBn ? "আবার চেষ্টা করুন" : "Reload"}</button>
              </div>
            </div>
          ) : (
            <>
              <div className="gl-grid3">
                {items.map((n, i) => <GlCard key={keyOf(n, i)} news={n} lang={lang} variant="top" withExcerpt eager={i < 3} />)}
              </div>

              {items.length >= 6 && <div className="gl-ad nvn-adwrap"><span className="nvn-adtag">AD</span><AdCards placement="homepage" limit={1} /></div>}

              {/* ── Load more ── */}
              <div className="gl-foot">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => setPg({ key: filterKey, page: page + 1 })}
                    disabled={loadingMore}
                    className="gl-btn"
                  >
                    {loadingMore ? <><Spinner size={16} /> {isBn ? "লোড হচ্ছে..." : "Loading..."}</> : <>{isBn ? "আরও সংবাদ দেখুন" : "Load more articles"} <ArrowRight size={14} /></>}
                  </button>
                ) : (
                  <p>{isBn ? "সব সংবাদ দেখানো হয়েছে" : "You’re all caught up"}</p>
                )}
                <p>
                  {isBn
                    ? `${total.toLocaleString("bn-BD")}টির মধ্যে ${items.length.toLocaleString("bn-BD")}টি দেখানো হচ্ছে`
                    : `Showing ${items.length} of ${total}`}
                </p>
              </div>
            </>
          )}
        </main>

        <aside className="gl-news-sidebar" aria-label={isBn ? "সংবাদ সাইডবার" : "News sidebar"}>
          <section className="gl-news-widget">
            <h2>{isBn ? "বিষয়সমূহ" : "Topics"}</h2>
            <div className="gl-news-topics">
              {tabs.filter((cat) => cat.en !== "all").slice(0, 5).map((cat, index) => {
                const count = items.filter((news) => String(news.category || "").toLowerCase() === String(cat.en).toLowerCase()).length;
                const colors = ["#d71920", "#f39800", "#55b52e", "#08a5e8", "#a66ac5"];
                return (
                  <button key={cat.en} type="button" onClick={() => pickCategory(cat.en)} className={activeCategory === cat.en ? "is-active" : ""}>
                    <span>{categoryLabel(cat.en, lang)}</span>
                    <b style={{ background: colors[index % colors.length] }}>{count}</b>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="gl-news-widget gl-news-recent">
            <div className="gl-news-widget-head">
              <h2>{isBn ? "সাম্প্রতিক সংবাদ" : "Recent posts"}</h2>
              {recentPages > 1 && (
                <div>
                  <button type="button" aria-label="Previous posts" onClick={() => setRecentPage((p) => (p - 1 + recentPages) % recentPages)}>‹</button>
                  <button type="button" aria-label="Next posts" onClick={() => setRecentPage((p) => (p + 1) % recentPages)}>›</button>
                </div>
              )}
            </div>
            <div className="gl-news-recent-list">
              {recentShown.map((news, index) => (
                <Link to={news.slug ? `/news/${news.slug}` : "/news"} state={{ news }} key={keyOf(news, index)} className="gl-news-recent-item">
                  <img src={news.image ? imageUrl(news.image) : "/logo.svg"} alt="" loading="lazy" />
                  <span>{news.title}</span>
                </Link>
              ))}
              {!items.length && <p className="gl-news-widget-empty">{isBn ? "সাম্প্রতিক সংবাদ পাওয়া যায়নি" : "No recent posts yet"}</p>}
            </div>
          </section>

          <section className="gl-news-promo">
            <span>{isBn ? "নোয়াখালী ভিশনে বিজ্ঞাপন দিন" : "Promote your business"}</span>
            <strong>{isBn ? "বিজ্ঞাপন" : "ADVERTISE"}</strong>
            <p>{isBn ? "আপনার প্রতিষ্ঠানকে পৌঁছে দিন আরও পাঠকের কাছে" : "Reach more readers with Noakhali Vision"}</p>
            <Link to="/contact">{isBn ? "যোগাযোগ করুন" : "CONTACT US"}</Link>
          </section>
          <div className="gl-news-sidebar-ad"><AdCards placement="sidebar" limit={1} /></div>
        </aside>
        </div>
      </div>
    </div>
  );
}
