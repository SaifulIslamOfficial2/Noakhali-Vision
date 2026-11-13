// Local API server for development (mirrors what Vercel runs in production).
// Reads variables from .env.local automatically:  npm run dev:api   (then `npm run dev` in another terminal)
import http from "node:http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Prefer .env.local; fall back to .env. Existing shell variables take precedence.
for (const file of [".env.local", ".env"]) {
  if (!existsSync(resolve(file))) continue;
  try { process.loadEnvFile(resolve(file)); }
  catch (error) { console.warn(`[Noakhali Vision API] Could not load ${file}:`, error.message); }
}

const { handle } = await import("./api/_lib/routes.js");
const PORT = Number(process.env.API_PORT || 3001);
const missing = [];
if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) missing.push("JWT_SECRET (minimum 32 characters)");
if (!process.env.ADMIN_EMAIL) missing.push("ADMIN_EMAIL");
if (!process.env.ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD (required for the initial admin login unless a password hash already exists in MongoDB)");
if (missing.length) {
  console.warn("\n[Noakhali Vision API] Missing environment configuration:");
  for (const item of missing) console.warn(`  - ${item}`);
  console.warn("Copy .env.example to .env.local, fill in your values, then restart the API.\n");
}
http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  let body = {};
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { /* ignore */ }
  const url = new URL(req.url, "http://localhost");
  const result = await handle({
    method: req.method,
    pathname: url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/",
    query: Object.fromEntries(url.searchParams.entries()),
    headers: req.headers, body, ip: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "local",
  });
  if (result.redirect) { res.writeHead(302, { Location: result.redirect }); return res.end(); }
  if (result.raw) {
    res.writeHead(result.status, { "Content-Type": result.type, "Content-Security-Policy": "default-src 'none'; sandbox", "Cache-Control": result.shortCache ? "public, max-age=3600" : "public, max-age=31536000, immutable" });
    return res.end(result.raw);
  }
  res.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(result.body));
}).listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
