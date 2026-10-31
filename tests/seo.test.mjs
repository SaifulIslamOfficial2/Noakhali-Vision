// Tests api/og.js and api/sitemap.js directly (no HTTP server needed).
import { setDb } from "../api/_lib/db.js";
import { FakeDb } from "./fake-mongo.mjs";
import og from "../api/og.js";
import sitemap from "../api/sitemap.js";

const db = new FakeDb();
setDb(db);
await db.collection("news").insertOne({ _id: "n1", slug: "hello-news", title: "Hello <b>\"News\"</b>", content: "<p>First paragraph of the story.</p>", status: "published", createdAt: "2026-10-30T10:00:00.000Z", image: "data:image/jpeg;base64,/9j/4AAQ" });
await db.collection("news").insertOne({ _id: "n2", slug: "secret-draft", title: "Draft", content: "x", status: "draft", createdAt: "2026-10-30T11:00:00.000Z", image: "/noakhali-banner.png" });
await db.collection("news").insertOne({ _id: "n3", slug: "path-image", title: "P", content: "x", status: "published", createdAt: "2026-10-29T11:00:00.000Z", image: "/noakhali-banner.png" });

let pass = 0, failN = 0;
const check = (n, c, e = "") => { if (c) pass++; else { failN++; console.log("FAIL:", n, e); } };
function run(handler, url) {
  return new Promise(async (resolve) => {
    const out = { status: 0, headers: {}, body: undefined };
    const res = {
      setHeader: (k, v) => { out.headers[k.toLowerCase()] = v; },
      status(c) { out.status = c; return this; },
      send(b) { out.body = b; resolve(out); },
      end() { resolve(out); },
    };
    await handler({ url, headers: { host: "example.com" } }, res);
  });
}

let r = await run(og, "/api/og?slug=hello-news");
check("og 200 html", r.status === 200 && /text\/html/.test(r.headers["content-type"]));
check("og title escaped", r.body.includes('og:title" content="Hello &quot;News&quot;"') && !r.body.includes("<b>"), r.body.slice(0, 400));
check("og description stripped", r.body.includes("First paragraph of the story."));
check("og absolute image url", r.body.includes("https://example.com/api/og?slug=hello-news&amp;img=1") || r.body.includes("https://example.com/api/og?slug=hello-news&img=1"));
check("og url", r.body.includes("https://example.com/news/hello-news"));
r = await run(og, "/api/og?slug=secret-draft"); check("og draft 404", r.status === 404);
r = await run(og, "/api/og?slug=nope"); check("og missing 404", r.status === 404);
r = await run(og, "/api/og?slug=hello-news&img=1"); check("og base64 image served as bytes", r.status === 200 && r.headers["content-type"] === "image/jpeg" && Buffer.isBuffer(r.body) && r.body.length > 0);
r = await run(og, "/api/og?slug=path-image&img=1"); check("og path image redirects to absolute", r.status === 302 && r.headers.location === "https://example.com/noakhali-banner.png", JSON.stringify(r.headers));

r = await run(sitemap, "/api/sitemap");
check("sitemap xml", r.status === 200 && /application\/xml/.test(r.headers["content-type"]) && r.body.startsWith("<?xml"));
check("sitemap lists published article", r.body.includes("https://example.com/news/hello-news") && r.body.includes("<lastmod>2026-10-30</lastmod>"));
check("sitemap hides drafts", !r.body.includes("secret-draft"));
check("sitemap static pages", r.body.includes("https://example.com/news</loc>"));

console.log(`\n${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
