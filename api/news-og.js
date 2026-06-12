// Vercel Serverless Function
// /api/news-og?slug=... → OG HTML for bots

const BOT_AGENTS = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Slackbot|Discordbot|vkShare|W3C_Validator|Pinterest|bingbot|Googlebot/i;

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) return res.status(400).send("Missing slug");

  const BACKEND = process.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5000";
  const SITE    = process.env.VITE_SITE_URL || "https://noakhalivision.vercel.app";

  try {
    // Backend থেকে news fetch করো
    const r = await fetch(`${BACKEND}/api/news/slug/${slug}`);
    if (!r.ok) throw new Error("not found");
    const data = await r.json();
    const news = data.news;
    if (!news) throw new Error("not found");

    const title       = news.title || "Noakhali Vision";
    const description = (news.content || "").replace(/<[^>]*>/g, "").substring(0, 200) + "...";
    const pageUrl     = `${SITE}/news/${slug}`;

    // Image URL fix
    let image = news.image || "";
    if (image && !image.startsWith("http")) {
      image = `${BACKEND}/${image.replace(/^\//, "")}`;
    }
    if (!image) image = `${SITE}/og.svg`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.send(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Noakhali Vision | নোয়াখালী ভিশন" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="bn_BD" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body><a href="${pageUrl}">Loading...</a></body>
</html>`);
  } catch {
    return res.redirect(302, `${SITE}/news/${slug}`);
  }
}
