import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthorChip from "./AuthorChip";
import { Pill } from "./GlCard";
import { imageUrl, prefetchNews } from "../utils/api";
import { excerptOf, whenLabel } from "../utils/glove";
import { useLang } from "../utils/LanguageContext";

const AUTO_MS = 5500;

/* Full-width slider: the picture itself (sharp, not blurred) with a soft colour gradient on the text side.
   variant "left"  → text on the left, the whole 4:5 picture on the right (home page)
   variant "center" → text centred (news page)                                            */
export default function GlHero({ items = [], variant = "left" }) {
  const { lang } = useLang();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const total = items.length;

  useEffect(() => { if (i >= total) setI(0); }, [total, i]);
  useEffect(() => {
    if (total < 2 || paused) return;
    const id = window.setTimeout(() => setI((n) => (n + 1) % total), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [i, total, paused]);

  if (!total) return null;
  const n = items[i] || items[0];
  const go = (d) => setI((v) => (v + d + total) % total);
  const href = n.slug ? `/news/${n.slug}` : "#";
  const src = imageUrl(n.image);
  const summary = excerptOf(n, 190);

  return (
    <section
      className={`gl-hero gl-hero--${variant}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const d = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(d) > 45) go(d < 0 ? 1 : -1);
        touchX.current = null;
      }}
      aria-roledescription="carousel"
      aria-label={lang === "bn" ? "সর্বশেষ সংবাদ" : "Latest news"}
    >
      {n.image && <img key={`bg${i}`} className="gl-hero__bg" src={src} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" />}
      <div className="gl-hero__shade" />
      <div className="gl-wrap gl-hero__inner" key={`c${i}`}>
        <div className="gl-hero__copy">
          <Pill name={n.category} lang={lang} />
          <h2 className="gl-hero__title"><Link to={href} state={{ news: n }} onMouseEnter={() => n.slug && prefetchNews(n.slug)}>{n.title}</Link></h2>
          {summary && <p className="gl-hero__excerpt">{summary}</p>}
          <div className="gl-hero__meta">
            <AuthorChip news={n} size={20} color="#fff" />
            <span>{whenLabel(n.createdAt, lang)}</span>
          </div>
        </div>
      </div>
      {total > 1 && (
        <div className="gl-wrap gl-hero__ctrl-wrap">
          <div className="gl-hero__ctrl">
            <button type="button" onClick={() => go(-1)} aria-label="Previous story"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next story"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </section>
  );
}
