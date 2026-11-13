import { stripHtml } from "./richText";

/* Helpers for the Gridlove-style card layouts (home, news page, article sidebar). */

/* Category pill colours, same five colours as the reference design. A category always gets the same colour. */
const PILLS = ["#f59a00", "#d50000", "#5fc236", "#0a9cf5", "#a66bc6"];
export function catColor(name) {
  const s = String(name || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PILLS[h % PILLS.length];
}

const bnNum = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

/* "4 weeks ago" style date, falling back to a plain date for old stories */
export function whenLabel(value, lang) {
  if (!value) return "";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const bn = lang === "bn";
  const n = (v) => (bn ? bnNum(v) : v);
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return bn ? "এইমাত্র" : "Just now";
  if (mins < 60) return bn ? `${n(mins)} মিনিট আগে` : `${mins} min ago`;
  if (hours < 24) return bn ? `${n(hours)} ঘণ্টা আগে` : `${hours} hr ago`;
  if (days < 7) return bn ? `${n(days)} দিন আগে` : `${days} ${days === 1 ? "day" : "days"} ago`;
  if (days < 31) return bn ? `${n(weeks)} সপ্তাহ আগে` : `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  try {
    return new Date(t).toLocaleDateString(bn ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

/* Editor/AI summary wins; otherwise the first words of the story */
export function excerptOf(news, limit = 150) {
  const saved = stripHtml(String(news?.summary || "").replace(/\n+/g, " "));
  const text = saved || stripHtml(news?.content || "");
  return text.length > limit ? text.slice(0, limit).trimEnd() + "…" : text;
}

export const keyOf = (n, i = 0) => n?.slug || n?._id || `${n?.title}-${i}`;
