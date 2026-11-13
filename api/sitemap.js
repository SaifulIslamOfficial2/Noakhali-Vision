// Dynamic sitemap: static pages + every published news article (served at /sitemap.xml via vercel.json).
import { getDb } from "./_lib/db.js";

export const config = { maxDuration: 10 };

const x = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const PAGES = ["/", "/news", "/about", "/team", "/company", "/partnership", "/premium-members", "/premium-member", "/election-spotlight", "/careers"];

export default async function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const origin = (process.env.SITE_URL || `https://${host}`).replace(/\/+$/, "");
  let rows = [];
  try {
    const db = await getDb();
    rows = await db.collection("news").find({ status: "published" }, { projection: { slug: 1, createdAt: 1, updatedAt: 1 } }).sort({ createdAt: -1 }).limit(2000).toArray();
  } catch (e) { console.error("sitemap: db error", e); }

  const urls = [
    ...PAGES.map((p) => `<url><loc>${x(origin + p)}</loc></url>`),
    ...rows.filter((r) => r.slug).map((r) => {
      const last = String(r.updatedAt || r.createdAt || "").slice(0, 10);
      return `<url><loc>${x(`${origin}/news/${encodeURIComponent(r.slug)}`)}</loc>${last ? `<lastmod>${last}</lastmod>` : ""}</url>`;
    }),
  ];
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`);
}
