// Link previews for social bots (Facebook, WhatsApp, Telegram, ...).
// vercel.json sends only those bots here for /news/:slug; real visitors get the normal React app.
// /api/og?slug=...&img=1 serves the article image (stored as base64) as a real image URL.
import { getDb } from "./_lib/db.js";

export const config = { maxDuration: 10 };

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (s) => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const slug = url.searchParams.get("slug") || "";
  const wantImage = url.searchParams.get("img") === "1";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const origin = (process.env.SITE_URL || `https://${host}`).replace(/\/+$/, "");

  let item = null;
  try {
    const db = await getDb();
    item = await db.collection("news").findOne(
      { slug, status: "published" },
      { projection: wantImage ? { image: 1 } : { title: 1, content: 1, summary: 1, createdAt: 1, updatedAt: 1 } },
    );
  } catch (e) { console.error("og: db error", e); }

  if (!item) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(404).send("<!doctype html><meta charset=\"utf-8\"><title>Noakhali Vision</title><p>সংবাদটি পাওয়া যায়নি।</p>");
  }

  if (wantImage) {
    const img = String(item.image || "");
    const b64 = img.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (b64) {
      res.setHeader("Content-Type", b64[1]);
      res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
      return res.status(200).send(Buffer.from(b64[2], "base64"));
    }
    let target = `${origin}/hero-banner.jpg`;
    if (/^https?:/i.test(img)) target = img;
    else if (img.startsWith("/")) target = `${origin}${img}`;
    res.setHeader("Location", target);
    return res.status(302).end();
  }

  const title = strip(item.title) || "Noakhali Vision";
  const desc = strip(item.summary || item.content).slice(0, 200);
  const pageUrl = `${origin}/news/${encodeURIComponent(slug)}`;
  const imageUrl = `${origin}/api/og?slug=${encodeURIComponent(slug)}&img=1`;
  const published = item.createdAt ? `<meta property="article:published_time" content="${esc(item.createdAt)}" />` : "";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(`<!doctype html>
<html lang="bn"><head><meta charset="utf-8" />
<title>${esc(title)} | Noakhali Vision</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${esc(pageUrl)}" />
<meta property="og:site_name" content="Noakhali Vision | নোয়াখালী ভিশন" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta property="og:image" content="${esc(imageUrl)}" />
${published}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(imageUrl)}" />
</head><body><h1>${esc(title)}</h1><p>${esc(desc)}</p><p><a href="${esc(pageUrl)}">পুরো সংবাদ পড়ুন</a></p></body></html>`);
}
