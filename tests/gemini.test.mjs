// Gemini provider tests: a local mock plays the Gemini REST API (no network, no real key).
import http from "node:http";

process.env.JWT_SECRET = "testsecret-testsecret-testsecret-1234567890";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "Str0ng!Pass";

const seen = [];
let mode = "ok";
const mock = http.createServer(async (req, res) => {
  let body = ""; for await (const c of req) body += c;
  seen.push({ url: req.url, key: req.headers["x-goog-api-key"], body: body ? JSON.parse(body) : {} });
  res.setHeader("Content-Type", "application/json");
  if (mode === "badkey") { res.statusCode = 400; return res.end(JSON.stringify({ error: { message: "API key not valid. Please pass a valid API key.", status: "INVALID_ARGUMENT" } })); }
  if (mode === "quota") { res.statusCode = 429; return res.end(JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED" } })); }
  if (req.url.includes("gemini-2.0-flash")) { res.statusCode = 404; return res.end(JSON.stringify({ error: { message: "model not found", status: "NOT_FOUND" } })); }
  const wantsJson = seen.at(-1).body.generationConfig?.responseMimeType === "application/json";
  const text = wantsJson ? "```json\n" + JSON.stringify({ headlines: ["a", "b", "c"], bestHeadline: "a", summary: "s", shortNews: "n" }) + "\n```" : "Gemini wrote this short summary.";
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ thought: true, text: "thinking…" }, { text }] } }] }));
});
await new Promise((r) => mock.listen(0, r));
process.env.GEMINI_API_BASE = `http://localhost:${mock.address().port}`;
process.env.GEMINI_API_KEY = "AQ.test-key";

const { setDb } = await import("../api/_lib/db.js");
const { FakeDb } = await import("./fake-mongo.mjs");
const { handle } = await import("../api/_lib/routes.js");
const { generateSummary } = await import("../api/_lib/ai.js");
setDb(new FakeDb());

let pass = 0, failN = 0;
const check = (name, ok, extra = "") => { if (ok) pass++; else { failN++; console.log("FAIL:", name, extra); } };
const call = (method, pathname, body, token) => handle({ method, pathname, query: {}, headers: token ? { authorization: `Bearer ${token}` } : {}, body: body || {}, ip: "1.2.3.4" });
const T = (await call("POST", "/auth/login", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })).body.token;
const longText = "নোয়াখালীর সুবর্ণচরে নতুন সেতু উদ্বোধন করা হয়েছে। ".repeat(8);

// 1) summary through Gemini: right URL, key in header (not URL), thought parts dropped
let s = await generateSummary(longText);
check("summary text", s === "Gemini wrote this short summary.", s);
check("default model + path", seen[0].url === "/v1beta/models/gemini-3.5-flash-lite:generateContent", seen[0].url);
check("key sent in header, not URL", seen[0].key === "AQ.test-key" && !seen[0].url.includes("AQ."));

// 2) retired model in GEMINI_MODEL -> retried once with the default
process.env.GEMINI_MODEL = "gemini-2.0-flash"; seen.length = 0;
s = await generateSummary(longText);
check("retired model falls back", s === "Gemini wrote this short summary." && seen.length === 2 && seen[1].url.includes("gemini-3.5-flash-lite"), JSON.stringify(seen.map((x) => x.url)));
delete process.env.GEMINI_MODEL;

// 3) story saved without summary -> Gemini writes it, flagged as AI
let r = await call("POST", "/news", { title: "A", slug: "a", status: "published", content: longText }, T);
check("save: AI summary stored", r.body.news.summary === "Gemini wrote this short summary." && r.body.news.summaryAi === true, JSON.stringify(r.body.news.summary));

// 4) AI News Writer: fenced JSON is cleaned and parsed
r = await call("POST", "/ai/news-writer", { content: longText, language: "bn" }, T);
check("news-writer JSON", r.status === 200 && r.body.result?.bestHeadline === "a", JSON.stringify(r.body));

// 5) errors: bad key -> clear 502 message, summary silently skipped
mode = "badkey";
r = await call("POST", "/ai/news-writer", { content: longText }, T);
check("bad key message", r.status === 502 && /GEMINI_API_KEY/.test(r.body.message || r.body.error || JSON.stringify(r.body)), JSON.stringify(r.body));
check("bad key: summary skipped, no throw", (await generateSummary(longText)) === "");
mode = "quota";
r = await call("POST", "/ai/news-writer", { content: longText }, T);
check("quota message", r.status === 502, JSON.stringify(r.body));
mode = "ok";

// 6) no keys at all -> off
delete process.env.GEMINI_API_KEY;
check("no key: empty summary", (await generateSummary(longText)) === "");
r = await call("POST", "/ai/news-writer", { content: longText }, T);
check("no key: 503", r.status === 503, String(r.status));

mock.close();
console.log(`${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
