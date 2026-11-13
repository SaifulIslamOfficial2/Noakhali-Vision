import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StoryTile from "../components/StoryTile";
import { PageLoader } from "../components/Spinner.jsx";
import api from "../utils/api";
import { useLang } from "../utils/LanguageContext";
import { categoryLabel } from "../utils/categories";
import { setSEO } from "../utils/seo";

/* Author page: small AUTHOR label, big name, bio, "N <category> · N <category>" line, divider, then every story
   of that author in a 3-column landscape grid. */

const PAGE = 12;
const bnDigits = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

export default function AuthorProfile() {
  const { id } = useParams();
  const { lang } = useLang();
  const bn = lang === "bn";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    setData(null); setError(""); setShown(PAGE);
    api.get(`/authors/${encodeURIComponent(id)}`).then((r) => setData(r.data)).catch((e) => setError(e.response?.data?.message || "লেখক পাওয়া যায়নি।"));
  }, [id]);
  useEffect(() => { if (data?.author?.name) setSEO({ title: `${data.author.name} | Noakhali Vision`, description: data.author.bio || "" }); }, [data]);

  // "2 স্থানীয় · 1 রাজনীতি" (count per category, biggest first)
  const summary = useMemo(() => {
    const counts = new Map();
    (data?.news || []).forEach((n) => { const k = n.category || ""; counts.set(k, (counts.get(k) || 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, c]) => `${bn ? bnDigits(c) : c} ${k ? categoryLabel(k, lang) : (bn ? "সংবাদ" : "stories")}`).join(" · ");
  }, [data, bn, lang]);

  if (error) return (
    <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10">
      <Link to="/news" className="text-sm font-bold text-primary">← {bn ? "সব সংবাদ" : "All news"}</Link>
      <p className="mt-6">{error}</p>
    </div>
  );
  if (!data) return <PageLoader minHeight="60vh" />;

  const { author, news } = data;
  return (
    <div className="bg-[#f4f6f8]">
      <section className="mx-auto min-h-[60vh] max-w-7xl px-4 pb-16 pt-8 sm:pt-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#0B4D35]">{bn ? "লেখক" : "Author"}</p>
        <h1 className="mt-2 text-4xl font-black leading-tight text-ink sm:text-5xl">{author.name}</h1>
        {author.bio && <p className="mt-3 max-w-2xl text-[17px] leading-7 text-[#5d675f]">{author.bio}</p>}
        <p className="mt-3 text-[13px] text-[#4b5563]">{summary || (bn ? "এখনো কোনো সংবাদ নেই" : "No stories yet")}</p>
        <div className="mt-6 border-b border-black/10" />

        {news.length > 0 && (
          <>
            <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {news.slice(0, shown).map((n, i) => <StoryTile key={n._id || n.slug || i} news={n} lang={lang} ratio="1200/633" fit="cover" showAuthor={false} showCategory />)}
            </div>
            {shown < news.length && (
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
