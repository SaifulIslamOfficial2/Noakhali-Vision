import { useState } from "react";
import { Link } from "react-router-dom";
import AuthorChip from "./AuthorChip";
import FramedImage from "./FramedImage";
import { imageUrl, prefetchNews } from "../utils/api";
import { readMinutes } from "../utils/richText";
import { categoryLabel } from "../utils/categories";

/* One story card in the "editorial" style: picture, small AUTHOR • DATE • N min read line, bold headline.
   Used by the category page and by every designed website section. */

const fmtDate = (v, lang) => {
  try { return new Date(v).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
};
const bnDigits = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

function Pic({ src, alt, ratio, className = "", fit = "cover" }) {
  const [failed, setFailed] = useState(false);
  const [w, h] = String(ratio || "1200/633").split("/");
  return (
    <div className={`relative w-full overflow-hidden bg-[#e8ece8] ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      {!src || failed ? (
        <div className="absolute inset-0 grid place-items-center"><img src="/logo.svg" alt="" className="h-1/2 w-1/2 object-contain opacity-80" /></div>
      ) : (
        <FramedImage fit={fit} src={src} alt={alt} ratio={Number(w) / Number(h) || 1.9} onError={() => setFailed(true)} imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
      )}
    </div>
  );
}

export default function StoryTile({
  news, lang = "bn", ratio = "1200/633", cardStyle = "plain", accent = "#0B4D35", dark = false, variant = "tile", big = false, fit = "cover",
  showAuthor = true, showDate = true, showReadTime = true, showCategory = false,
}) {
  if (!news) return null;
  const href = news.slug ? `/news/${news.slug}` : null;
    const mins = readMinutes(news.content);
  const parts = [];
  if (showCategory && news.category) parts.push(<span key="c" style={{ color: accent }} className="font-extrabold">{categoryLabel(news.category, lang)}</span>);
  if (showAuthor) parts.push(<AuthorChip key="a" news={news} color={dark ? "#fff" : accent} />);
  if (showDate && news.createdAt) parts.push(<time key="d">{fmtDate(news.createdAt, lang)}</time>);
  if (showReadTime) parts.push(<span key="r">{lang === "bn" ? `${bnDigits(mins)} মিনিটে পড়ুন` : `${mins} min read`}</span>);
  const meta = (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold uppercase tracking-wide ${dark ? "text-white/70" : "text-[#6b746c]"}`}>
      {parts.map((p, i) => <span key={i} className="inline-flex items-center gap-2">{i > 0 && <span aria-hidden className="opacity-60">•</span>}{p}</span>)}
    </div>
  );
  const titleCls = `${big ? "text-base sm:text-lg" : "text-[13.5px] sm:text-[14px]"} font-bold ${lang === "bn" ? "leading-[1.3]" : "leading-tight"}`;
  const wrap = (children, cls) => href
    ? <Link to={href} state={{ news }} onMouseEnter={() => prefetchNews(news.slug)} className={cls}>{children}</Link>
    : <div className={cls}>{children}</div>;

  if (variant === "row") {
    return wrap(
      <>
        <div className="w-28 shrink-0 sm:w-36"><Pic src={imageUrl(news.image)} alt={news.title} ratio={ratio} /></div>
        <div className="min-w-0 flex-1">{meta}<h3 className={`mt-1 line-clamp-3 text-[13px] font-bold ${lang === "bn" ? "leading-[1.3]" : "leading-tight"}`}>{news.title}</h3></div>
      </>,
      `group flex items-start gap-4 ${cardStyle === "boxed" ? "border border-black/10 bg-white p-3 text-ink" : ""} ${dark && cardStyle !== "boxed" ? "text-white" : ""}`
    );
  }

  if (cardStyle === "overlay") {
    return wrap(
      <div className="relative overflow-hidden">
        <Pic src={imageUrl(news.image)} alt={news.title} ratio={ratio} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className={`${titleCls} line-clamp-3`}>{news.title}</h3>
          <div className="mt-2 text-white/80 [&_*]:!text-white/80">{meta}</div>
        </div>
      </div>,
      "group block"
    );
  }

  const boxed = cardStyle === "boxed";
  return wrap(
    <>
      <Pic src={imageUrl(news.image)} alt={news.title} ratio={ratio} fit={fit} />
      <div className={boxed ? "p-4" : "pt-3"}>
        {meta}
        <h3 className={`mt-2 line-clamp-3 ${titleCls} ${boxed ? "text-ink" : ""}`}>{news.title}</h3>
      </div>
    </>,
    `group block ${boxed ? "overflow-hidden border border-black/10 bg-white text-ink shadow-sm transition-shadow hover:shadow-lg" : dark ? "text-white" : "text-ink"}`
  );
}
