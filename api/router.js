import { handle } from "./_lib/routes.js";

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  // vercel.json rewrites /api/<anything> -> /api/router?p=<anything>, so nested paths
  // like /api/auth/login always reach this function (no reliance on [...catch-all] file routing).
  const p = url.searchParams.get("p");
  url.searchParams.delete("p");
  let pathname = p != null ? "/" + p.replace(/^\/+/, "") : (url.pathname.replace(/^\/api/, "").replace(/^\/router$/, "") || "/");
  pathname = pathname.replace(/\/+$/, "") || "/";

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }

  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const result = await handle({
    method: req.method || "GET",
    pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: req.headers,
    body: body && typeof body === "object" ? body : {},
    ip: fwd || req.socket?.remoteAddress || "unknown",
  });

  if (result.raw) {
    res.setHeader("Content-Type", result.type);
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(result.status).send(result.raw);
  }
  res.setHeader("Cache-Control", result.cache ? "public, s-maxage=20, stale-while-revalidate=60" : "private, no-store");
  res.status(result.status).json(result.body);
}
