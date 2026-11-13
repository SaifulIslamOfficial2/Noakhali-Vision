// Rich-text helpers for news content. Pure string code (no DOM, no dependencies) so the SAME
// whitelist runs in the admin editor, on the article page and in the API (api/_lib/routes.js).
//
// Content is stored as a small, safe HTML subset:
//   p br strong em u s h2 h3 blockquote ul ol li a img
// Old news was saved as plain text; toHtml() turns that into paragraphs so it keeps working.

const VOID = new Set(["br", "img"]);
// tag renames: what browsers' contentEditable tends to produce -> what we store
const RENAME = { b: "strong", i: "em", strike: "s", del: "s", div: "p", h1: "h2", h4: "h3", h5: "h3", h6: "h3" };
const ALLOWED = new Set(["p", "br", "strong", "em", "u", "s", "h2", "h3", "blockquote", "ul", "ol", "li", "a", "img"]);
// tags whose whole content is dropped, not just the tag
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|svg|math|template|noscript|textarea|select|form)\b[\s\S]*?<\/\1\s*>/gi;

const escText = (s) => s.replace(/&(?!(?:[a-zA-Z]{2,8}|#\d{1,6}|#x[0-9a-fA-F]{1,6});)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?![\/\\]))/i;
// Inline images: our own uploads (/api/media/...) or https images only. No data: / javascript: / http:
const SAFE_SRC = /^(\/api\/media\/|https:\/\/)/i;

function parseAttrs(raw) {
  const out = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(raw))) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  return out;
}
// attribute values may contain entities such as &amp; — undo the basic ones before we re-escape
const unEnt = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

export function sanitizeHtml(input) {
  let html = String(input ?? "").replace(/<!--[\s\S]*?-->/g, "").replace(DROP_WITH_CONTENT, "");
  const parts = html.split(/(<[^>]*>)/g);
  const stack = [];
  let out = "";
  for (const part of parts) {
    if (!part) continue;
    if (part[0] !== "<" || part[part.length - 1] !== ">") { out += escText(part); continue; }
    const m = part.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9]*)([\s\S]*?)\/?\s*>$/);
    if (!m) { out += escText(part); continue; }
    const closing = m[1] === "/";
    let name = m[2].toLowerCase();
    name = RENAME[name] || name;
    if (!ALLOWED.has(name)) continue; // unwrap: keep the text, drop the tag (span, font, table ...)
    if (closing) {
      if (VOID.has(name)) continue;
      const at = stack.lastIndexOf(name);
      if (at === -1) continue; // stray closing tag
      while (stack.length > at) out += `</${stack.pop()}>`;
      continue;
    }
    const attrs = parseAttrs(m[3]);
    if (name === "br") { out += "<br>"; continue; }
    if (name === "img") {
      const src = unEnt(attrs.src || "").trim();
      if (!SAFE_SRC.test(src)) continue;
      const alt = unEnt(attrs.alt || "").slice(0, 200);
      out += `<img src="${escAttr(src)}" alt="${escAttr(alt)}" loading="lazy" decoding="async">`;
      continue;
    }
    if (name === "a") {
      const href = unEnt(attrs.href || "").trim();
      if (!SAFE_HREF.test(href)) continue; // drop the link, keep its text
      out += `<a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer nofollow">`;
      stack.push("a");
      continue;
    }
    // block elements must not nest inside inline formatting (and vice versa) in a way that breaks layout
    if (name === "p" && stack.includes("p")) { while (stack.includes("p")) out += `</${stack.pop()}>`; }
    out += `<${name}>`;
    stack.push(name);
  }
  while (stack.length) out += `</${stack.pop()}>`;
  return out;
}

const HTML_HINT = /<\/?(p|br|strong|em|b|i|u|s|h[1-6]|blockquote|ul|ol|li|a|img|div|span)\b[^>]*>/i;
export const looksLikeHtml = (s) => HTML_HINT.test(String(s ?? ""));

/** Plain text (old news) -> paragraphs. HTML passes through unchanged. */
export function toHtml(content) {
  const s = String(content ?? "");
  if (looksLikeHtml(s)) return s;
  return s
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escText(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** What the article page should render: plain text or HTML in, safe HTML out. */
export const renderContent = (content) => sanitizeHtml(toHtml(content));

/** HTML (or plain text) -> readable plain text, for summaries, SEO descriptions, AI input, search. */
export function stripHtml(content) {
  return String(content ?? "")
    .replace(DROP_WITH_CONTENT, " ")
    .replace(/<\/(p|h2|h3|li|blockquote|div)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const hasImage = (content) => /<img\b/i.test(String(content ?? ""));

/** Reading time in minutes (min 1), based on ~200 words per minute. */
export const readMinutes = (content) => Math.max(1, Math.round(stripHtml(content).split(/\s+/).filter(Boolean).length / 200));
