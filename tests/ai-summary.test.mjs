// AI summary tests: a local mock plays the OpenAI API (no network, no real key needed).
import http from "node:http";

process.env.JWT_SECRET = "testsecret-testsecret-testsecret-1234567890";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "Str0ng!Pass";

let calls = 0, failNext = false;
const mock = http.createServer(async (req, res) => {
  for await (const _ of req) { /* drain */ }
  calls++;
  res.setHeader("Content-Type", "application/json");
  if (failNext) { failNext = false; res.statusCode = 500; return res.end("{}"); }
  res.end(JSON.stringify({ choices: [{ message: { content: "AI wrote this short summary." } }] }));
});
await new Promise((r) => mock.listen(0, r));
process.env.OPENAI_API_BASE = `http://localhost:${mock.address().port}`;

const { setDb } = await import("../api/_lib/db.js");
const { FakeDb } = await import("./fake-mongo.mjs");
const { handle } = await import("../api/_lib/routes.js");
setDb(new FakeDb());

let pass = 0, failN = 0;
const check = (name, ok, extra = "") => { if (ok) pass++; else { failN++; console.log("FAIL:", name, extra); } };
const call = (method, pathname, body, token) => handle({ method, pathname, query: {}, headers: token ? { authorization: `Bearer ${token}` } : {}, body: body || {}, ip: "1.2.3.4" });
const T = (await call("POST", "/auth/login", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })).body.token;
const longText = "Noakhali news story text. ".repeat(10);

// key OFF -> nothing generated, story saved as before
let r = await call("POST", "/news", { title: "A", slug: "a", status: "published", content: longText }, T);
check("off: saved", r.status === 201);
check("off: no summary, no AI call", !r.body.news.summary && !r.body.news.summaryAi && calls === 0);

process.env.OPENAI_API_KEY = "sk-test";
// key ON, empty summary -> AI writes it and it is flagged
r = await call("POST", "/news", { title: "B", slug: "b", status: "published", content: longText, summary: "" }, T);
check("on: AI summary stored", r.body.news.summary === "AI wrote this short summary." && r.body.news.summaryAi === true, JSON.stringify(r.body.news.summary));
// editor-written summary is kept and not flagged
r = await call("POST", "/news", { title: "C", slug: "c", status: "published", content: longText, summary: "Mine", summaryAi: "" }, T);
check("manual summary kept, not AI", r.body.news.summary === "Mine" && r.body.news.summaryAi === false);
// AI draft applied in the editor keeps the flag
r = await call("POST", "/news", { title: "D", slug: "d", status: "published", content: longText, summary: "From draft", summaryAi: "true" }, T);
check("AI-draft summary flagged", r.body.news.summaryAi === true);
// AI failure: story still saves
failNext = true;
r = await call("POST", "/news", { title: "E", slug: "e", status: "published", content: longText }, T);
check("AI error: story still saved without summary", r.status === 201 && !r.body.news.summary && !r.body.news.summaryAi);
// short story: no AI call
const before = calls;
r = await call("POST", "/news", { title: "F", slug: "f", status: "published", content: "short" }, T);
check("short story: no AI call", calls === before && !r.body.news.summary);
// edit of story with empty summary -> generated; edit with summary present -> untouched
r = await call("PUT", `/news/${(await call("POST", "/news", { title: "G", slug: "g", status: "draft", content: "short" }, T)).body.news._id}`, { content: longText }, T);
check("edit: empty summary gets AI text", r.body.news.summary === "AI wrote this short summary." && r.body.news.summaryAi === true);
const c0 = calls;
r = await call("PUT", `/news/${r.body.news._id}`, { title: "G2" }, T);
check("edit: existing summary untouched, no AI call", calls === c0 && r.body.news.summary === "AI wrote this short summary." && r.body.news.summaryAi === true);
r = await call("PUT", `/news/${r.body.news._id}`, { summary: "Edited by hand", summaryAi: "" }, T);
check("edit: manual rewrite clears AI flag", r.body.news.summary === "Edited by hand" && r.body.news.summaryAi === false);

console.log(`${pass} passed, ${failN} failed`);
mock.close();
process.exit(failN ? 1 : 0);
