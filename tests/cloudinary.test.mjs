// Cloudinary offload tests: a local mock plays the Cloudinary API (no network, no real account needed).
import http from "node:http";
import { createHash } from "node:crypto";

process.env.JWT_SECRET = "testsecret-testsecret-testsecret-1234567890";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "Str0ng!Pass";
const SECRET = "mock-secret";

let failNext = false;
const seen = [];
const mock = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString("utf8");
  const field = (n) => (body.match(new RegExp(`name="${n}"\\r\\n\\r\\n([^\\r]*)`)) || [])[1];
  const folder = field("folder"), timestamp = field("timestamp"), signature = field("signature");
  const expected = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${SECRET}`).digest("hex");
  seen.push({ path: req.url, folder, signatureOk: signature === expected, hasFile: /name="file"/.test(body) && body.includes("data:image/") });
  res.setHeader("Content-Type", "application/json");
  if (failNext) { failNext = false; res.statusCode = 500; return res.end(JSON.stringify({ error: { message: "boom" } })); }
  res.end(JSON.stringify({ secure_url: `https://res.cloudinary.com/demo/image/upload/v1/${folder}/abc.jpg` }));
});
await new Promise((r) => mock.listen(0, r));
process.env.CLOUDINARY_API_BASE = `http://localhost:${mock.address().port}`;

const { setDb } = await import("../api/_lib/db.js");
const { FakeDb } = await import("./fake-mongo.mjs");
const { handle } = await import("../api/_lib/routes.js");
const { ogImageUrl } = await import("../api/_lib/cloudinary.js");
setDb(new FakeDb());

let pass = 0, failN = 0;
const check = (name, ok, extra = "") => { if (ok) pass++; else { failN++; console.log("FAIL:", name, extra); } };
const call = (method, pathname, body, token) => handle({ method, pathname, query: {}, headers: token ? { authorization: `Bearer ${token}` } : {}, body: body || {}, ip: "1.2.3.4" });

const login = await call("POST", "/auth/login", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
const T = login.body.token;
check("admin login", !!T);

const big = "data:image/jpeg;base64," + "QUJD".repeat(3000);
const CLOUD = (folder) => new RegExp(`^https://res\\.cloudinary\\.com/demo/image/upload/v1/${folder}/abc\\.jpg$`);

// --- cloudinary OFF: old behaviour, nothing uploaded
let r = await call("POST", "/news", { title: "Off", slug: "off", status: "published", content: "c", image: big }, T);
check("off: story saved", r.status === 201);
check("off: image stays in the database (served via /api/media)", r.body.news.image.startsWith("/api/media/news/"));
check("off: no upload call", seen.length === 0);

// --- cloudinary ON
process.env.CLOUDINARY_CLOUD_NAME = "demo"; process.env.CLOUDINARY_API_KEY = "key123"; process.env.CLOUDINARY_API_SECRET = SECRET;

r = await call("POST", "/news", { title: "On", slug: "on", status: "published", content: "c", image: big, gallery: [big, big] }, T);
check("on: story saved", r.status === 201);
const stored = r.body.news;
check("on: main image is a Cloudinary URL", CLOUD("noakhali-vision/news").test(stored.image), stored.image?.slice(0, 80));
check("on: gallery images are Cloudinary URLs", Array.isArray(stored.gallery) && stored.gallery.length === 2 && stored.gallery.every((u) => CLOUD("noakhali-vision/news").test(u)));
check("on: signature accepted by the (mock) Cloudinary", seen.length === 3 && seen.every((s) => s.signatureOk && s.hasFile && s.path === "/v1_1/demo/image/upload"), JSON.stringify(seen));

// small / non-image / svg values are left alone
const n0 = seen.length;
r = await call("POST", "/news", { title: "Small", slug: "small", status: "published", content: "c", image: "/noakhali-banner.png", gallery: ["data:image/svg+xml;base64," + "QUJD".repeat(3000)] }, T);
check("on: plain paths untouched, SVG never uploaded", r.body.news.image === "/noakhali-banner.png" && seen.length === n0 && !/cloudinary/.test(JSON.stringify(r.body.news.gallery)));

// editor sends the Cloudinary URL back on edit: kept as is, no new upload
const before = seen.length;
r = await call("PUT", "/news/" + stored._id, { title: "On edited", image: stored.image }, T);
check("on: edit with URL keeps image", r.status === 200 && r.body.news.image === stored.image && seen.length === before);

// upload failure is fail-soft: base64 kept, editor does not lose the picture
failNext = true;
r = await call("POST", "/news", { title: "Soft", slug: "soft", status: "published", content: "c", image: big }, T);
check("fail-soft: story still saved", r.status === 201 && r.body.news.image.startsWith("/api/media/news/"), r.body?.news?.image?.slice(0, 40));

// inline picture inside the story body
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
r = await call("POST", "/news-media", { image: PNG }, T);
check("inline image uploaded to Cloudinary", r.status === 201 && CLOUD("noakhali-vision/news-body").test(r.body.url), r.body?.url);

// companies / team / ads
r = await call("POST", "/ads", { title: "Ad", image: big }, T);
check("ads image uploaded too", r.status === 201 && CLOUD("noakhali-vision/ads").test(r.body.ad.image), r.body?.ad?.image);

// old /api/media links redirect once the image lives on Cloudinary
const mr = await call("GET", `/media/news/${stored._id}/image`);
check("media route redirects to Cloudinary", mr.status === 302 && mr.redirect === stored.image, JSON.stringify(mr).slice(0, 100));

// public listing never exposes base64
r = await call("GET", "/news");
check("listing has Cloudinary URL for migrated story", r.body.news.some((n) => n.slug === "on" && n.image === stored.image));

// OG helper
const og = ogImageUrl(stored.image);
check("og image is 1200x630 padded", og.includes("/image/upload/c_pad,b_blurred:400:15,w_1200,h_630,f_jpg,q_auto/v1/"), og);
check("og helper ignores non-Cloudinary", ogImageUrl("https://example.com/a.jpg") === null && ogImageUrl("data:image/png;base64,AA") === null);

mock.close();
console.log(`${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
