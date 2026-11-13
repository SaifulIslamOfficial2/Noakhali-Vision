import { useState } from "react";
import { Link } from "react-router-dom";
import AuthorChip from "./AuthorChip";
import FramedImage from "./FramedImage";
import { imageUrl, prefetchNews } from "../utils/api";
import { categoryLabel } from "../utils/categories";
import { catColor, excerptOf, whenLabel } from "../utils/glove";
import { readMinutes } from "../utils/richText";

const preloadDetailsPage = () => import("../pages/Details.jsx").catch(() => {});
const bnDigits = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

/* Category pill (coloured, rounded) */
export function Pill({ name, lang }) {
  if (!name) return null;
  return <span className="gl-pill" style={{ background: catColor(name) }}>{categoryLabel(name, lang)}</span>;
}

/* Picture in a 1200×633 frame. Always object-fit: cover, so it is never stretched. Brand logo as fallback */
function Pic({ news, eager, imageRatio = 1200 / 633, imageFit = "cover" }) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl(news.image);
  return (
    <div className="gl-pic">
      {!news.image || failed
        ? <div className="gl-pic__empty"><img src="/logo.svg" alt="" /></div>
        : <FramedImage src={src} alt={news.title} eager={eager} ratio={imageRatio} fit={imageFit} onError={() => setFailed(true)} imgClassName="gl-pic__img" />}
    </div>
  );
}

function TopMeta({ news, lang }) {
  const mins = readMinutes(news.content);
  const date = news.createdAt ? new Date(news.createdAt).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { timeZone: "Asia/Dhaka", month: "short", day: "numeric", year: "numeric" }) : "";
  return (
    <div className="gl-tmeta">
      {news.category && <b style={{ color: catColor(news.category) }}>{categoryLabel(news.category, lang)}</b>}
      {date && <span>{date}</span>}
      {news.content && <span>{lang === "bn" ? `${bnDigits(mins)} মিনিট পড়া` : `${mins} min read`}</span>}
    </div>
  );
}

function Meta({ news, lang, showAuthor = true }) {
  const mins = readMinutes(news.content);
  return (
    <div className="gl-meta">
      {showAuthor && <AuthorChip news={news} size={20} className="gl-meta__author" />}
      <span className="gl-meta__item">{whenLabel(news.createdAt, lang)}</span>
      {news.content && <span className="gl-meta__item">{lang === "bn" ? `${bnDigits(mins)} মিনিট` : `${mins} min`}</span>}
    </div>
  );
}

/* One story card. variant:
   side    picture on the left, text on the right
   overlay picture fills the card, text sits on top of it
   top     picture on top, text below
   text    text only
   color   text only, on a dark colour block                */
export default function GlCard({ news, variant = "top", lang = "bn", eager = false, withExcerpt = false, imageRatio = 1200 / 633, imageFit = "cover", className = "" }) {
  if (!news) return null;
  const href = news.slug ? `/news/${news.slug}` : null;
  const pre = () => { if (news.slug) { prefetchNews(news.slug); preloadDetailsPage(); } };
  const cls = `gl-card gl-card--${variant} group ${className}`;
  const excerpt = excerptOf(news, variant === "text" || variant === "color" ? 170 : 120);

  let inner;
  if (variant === "overlay") {
    inner = (
      <>
        <Pic news={news} eager={eager} imageRatio={imageRatio} imageFit={imageFit} />
        <div className="gl-overlay__shade" />
        <div className="gl-overlay__top"><Pill name={news.category} lang={lang} /></div>
        <div className="gl-overlay__body">
          <h3 className="gl-title">{news.title}</h3>
          <Meta news={news} lang={lang} />
        </div>
      </>
    );
  } else if (variant === "text" || variant === "color") {
    inner = (
      <div className="gl-body">
        <div className="gl-pills"><Pill name={news.category} lang={lang} /></div>
        <h3 className="gl-title">{news.title}</h3>
        {excerpt && <p className="gl-excerpt">{excerpt}</p>}
        <Meta news={news} lang={lang} />
      </div>
    );
  } else if (variant === "top") {
    inner = (
      <>
        <div className="gl-media"><Pic news={news} eager={eager} imageRatio={imageRatio} imageFit={imageFit} /></div>
        <div className="gl-body">
          <TopMeta news={news} lang={lang} />
          <h3 className="gl-title">{news.title}</h3>
        </div>
      </>
    );
  } else {
    inner = (
      <>
        <div className="gl-media">
          <Pic news={news} eager={eager} imageRatio={imageRatio} imageFit={imageFit} />
          {variant === "top" && <div className="gl-media__pill"><Pill name={news.category} lang={lang} /></div>}
        </div>
        <div className="gl-body">
          {variant === "side" && <div className="gl-pills"><Pill name={news.category} lang={lang} /></div>}
          <h3 className="gl-title">{news.title}</h3>
          {excerpt && (variant === "side" || withExcerpt) && <p className="gl-excerpt">{excerpt}</p>}
          <Meta news={news} lang={lang} />
        </div>
      </>
    );
  }

  return href
    ? <Link to={href} state={{ news }} className={cls} onMouseEnter={pre} onTouchStart={pre}>{inner}</Link>
    : <div className={cls}>{inner}</div>;
}
