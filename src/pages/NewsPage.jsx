import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdCards from "../components/AdCards";
import { NewsCardSkeleton } from "../components/Skeleton";
import api, { imageUrl } from "../utils/api";
import { sampleNews, categories } from "../utils/data";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";
import { extra } from "../utils/translations";

/* ─────────────────────────────────────────────────────────────────
   NewsCard — image + title + excerpt (news page style)
   ───────────────────────────────────────────────────────────────── */
function NewsCard({ news }) {
  const navigate = useNavigate();
  const excerpt = news.content
    ? news.content.replace(/<[^>]+>/g, "").slice(0, 90) + "…"
    : "";

  return (
    <article
      onClick={() => news.slug && navigate(`/news/${news.slug}`)}
      className="group cursor-pointer overflow-hidden border border-border hover:border-primary transition-colors"
      style={{ background: "var(--bg)" }}
      title={news.title}
    >
      {/* Image */}
      <div className="relative overflow-hidden w-full" style={{ aspectRatio: "16/9" }}>
        <img
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          src={imageUrl(news.image)}
          alt={news.title}
          loading="lazy"
          decoding="async"
        />
        {news.category && (
          <span
            className="absolute top-2 left-2 text-white text-xs font-black uppercase px-2 py-0.5"
            style={{ background: "#EF152B" }}
          >
            {news.category}
          </span>
        )}
      </div>

      {/* Text */}
      <div className="p-3">
        <h3 className="text-sm sm:text-base font-black leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
          {news.title}
        </h3>
        {excerpt && (
          <p className="text-xs text-muted line-clamp-2 leading-relaxed">{excerpt}</p>
        )}
        <p className="text-xs text-muted mt-2 font-semibold">
          {news.createdAt
            ? new Date(news.createdAt).toLocaleDateString("bn-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </p>
      </div>
    </article>
  );
}

/* ═════════════════════════════════════════════════════════════════
   NEWS PAGE
   ═════════════════════════════════════════════════════════════════ */
export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCat] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();
  const hx = extra[lang].home;
  const LIMIT = 18;

  useEffect(() => {
    setSEO({ title: "সকল সংবাদ | নোয়াখালী ভিশন" });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: "published", page, limit: LIMIT });
    if (activeCategory !== "all") params.set("category", activeCategory);
    api
      .get(`/news?${params}`)
      .then((r) => {
        setItems(r.data.news);
        setPagination(r.data.pagination || { pages: 1, total: r.data.news.length });
      })
      .catch(() => {
        const f =
          activeCategory === "all"
            ? sampleNews
            : sampleNews.filter((n) => n.category === activeCategory);
        setItems(f);
        setPagination({ pages: 1, total: f.length });
      })
      .finally(() => setLoading(false));
  }, [activeCategory, page]);

  const handleCat = (cat) => {
    setActiveCat(cat);
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* 6-chunk এ ভাগ, মাঝে ad */
  const chunks = [];
  for (let i = 0; i < items.length; i += 6) chunks.push(items.slice(i, i + 6));

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* ══ PAGE HEADER ══ */}
      <div
        className="border-b border-border px-4 py-5"
        style={{ background: "var(--bg2)" }}
      >
        <h1 className="text-xl sm:text-2xl font-black">
          সকল <span style={{ color: "#EF152B" }}>সংবাদ</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          নোয়াখালীর সর্বশেষ সকল খবর
        </p>
      </div>

      {/* ══ CATEGORY FILTER ══ */}
      <div
        className="sticky top-0 z-30 border-b border-border overflow-x-auto"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex gap-0 px-1" style={{ minWidth: "max-content" }}>
          {categories.map((cat) => (
            <button
              key={cat.en}
              onClick={() => handleCat(cat.en)}
              className={`px-4 py-3 text-xs sm:text-sm font-black border-b-2 transition-colors whitespace-nowrap ${
                activeCategory === cat.en
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-primary"
              }`}
              style={{ background: "transparent" }}
            >
              {cat.bn}
            </button>
          ))}
        </div>
      </div>

      {/* ══ NEWS GRID ══ */}
      <section className="px-2 sm:px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center py-20 text-muted text-sm">
            কোনো সংবাদ পাওয়া যায়নি।
          </p>
        ) : (
          <>
            {chunks.map((chunk, ci) => (
              <div key={ci}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {chunk.map((n) => (
                    <NewsCard key={n.slug || n._id} news={n} />
                  ))}
                </div>
                {ci < chunks.length - 1 && (
                  <div className="my-4">
                    <AdCards placement="homepage" limit={1} />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="py-8 flex items-center justify-center gap-2 border-t border-border mt-6">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === 1}
              className="px-4 py-2 border border-border text-sm font-bold disabled:opacity-40 hover:bg-gray-50"
            >
              {hx.prev}
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.pages ||
                  Math.abs(p - page) <= 1
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`d${i}`} className="px-2 text-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`px-4 py-2 text-sm font-bold border ${
                      page === p
                        ? "bg-primary text-white border-primary"
                        : "border-border hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => {
                setPage((p) => Math.min(pagination.pages, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === pagination.pages}
              className="px-4 py-2 border border-border text-sm font-bold disabled:opacity-40 hover:bg-gray-50"
            >
              {hx.next}
            </button>
          </div>
        )}
      </section>

      <div className="px-4 pb-8">
        <AdCards placement="homepage" limit={1} />
      </div>
    </div>
  );
}
