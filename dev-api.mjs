// Local API server for development (mirrors what Vercel runs in production).
// Reads variables from .env.local automatically:  npm run dev:api   (then `npm run dev` in another terminal)
import http from "node:http";

try { process.loadEnvFile(".env.local"); } catch { /* no .env.local: use real environment variables */ }

const { handle } = await import("./api/_lib/routes.js");
const PORT = Number(process.env.API_PORT || 3001);
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
    headers: req.headers, body, ip: req.socket.remoteAddress || "local",
  });
  if (result.raw) {
    res.writeHead(result.status, { "Content-Type": result.type, "Content-Security-Policy": "default-src 'none'; sandbox", "Cache-Control": "public, max-age=31536000, immutable" });
    return res.end(result.raw);
  }
  res.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(result.body));
}).listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
