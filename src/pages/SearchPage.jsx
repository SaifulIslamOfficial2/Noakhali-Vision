import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import NewsCard from "../components/NewsCard";
import api from "../utils/api";
import { sampleNews } from "../utils/data";
import { useLang } from "../utils/LanguageContext";
import { extra } from "../utils/translations";

export default function SearchPage() {
  const [p, setP] = useSearchParams();
  const q = p.get("q") || "";
  const [term, setTerm] = useState(q);
  const [items, setItems] = useState([]);
  const { lang } = useLang();
  const s = extra[lang].search;

  useEffect(() => {
    if (!q) return setItems([]);
    api.get(`/news?search=${encodeURIComponent(q)}&status=published`)
      .then(r => setItems(r.data.news))
      .catch(() => setItems(sampleNews.filter(n => n.title.toLowerCase().includes(q.toLowerCase()))));
  }, [q]);

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-4xl font-black">{s.heading}</h1>
      <form className="mt-4 sm:mt-6 flex gap-2 sm:gap-3"
        onSubmit={e => { e.preventDefault(); setP(term ? { q: term } : {}); }}>
        <input
          className="flex-1 min-w-0 border border-border px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-primary focus:outline-none bg-white text-ink"
          value={term} onChange={e => setTerm(e.target.value)}
          placeholder={s.heading + "..."}
        />
        <button className="bg-primary px-4 sm:px-5 py-2.5 font-bold text-white text-sm shrink-0 hover:bg-secondary transition-colors">
          {s.button}
        </button>
      </form>
      <p className="my-4 sm:my-5 text-sm text-muted">
        {q ? s.results(items.length, q) : s.noQuery}
      </p>
      <div className="masonry">
        {items.map(n => <NewsCard key={n.slug} news={n} />)}
      </div>
    </section>
  );
}
