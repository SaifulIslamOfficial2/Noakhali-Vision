import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
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
      <form role="search" className="nv-search mt-4 sm:mt-6 sm:max-w-2xl"
        onSubmit={e => { e.preventDefault(); setP(term ? { q: term } : {}); }}>
        <Search size={16} className="nv-search__icon" aria-hidden="true" />
        <input
          type="search"
          className="nv-search__input"
          value={term} onChange={e => setTerm(e.target.value)}
          placeholder={s.heading + "..."}
          aria-label={s.heading}
        />
        <button type="submit" className="nv-search__btn">
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
