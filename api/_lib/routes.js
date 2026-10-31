import { randomBytes, createHash } from "node:crypto";
import { getDb } from "./db.js";
import { signToken, verifyToken, hashPassword, verifyPassword, safeEqual } from "./auth.js";
import seed from "./seed.js";
import { locations } from "../../src/utils/data.js";

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => new HttpError(status, message);

const nowIso = () => new Date().toISOString();
const uid = (p) => `${p}-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
const text = (v, max) => String(v ?? "").trim().slice(0, max);
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DEFAULT_IMAGE = "/noakhali-banner.png";

/** Shallow-clean a client object so it can never inject _id / operators / dotted paths. */
const isMediaRef = (v) => typeof v === "string" && v.startsWith("/api/media/");
function clean(obj, drop = []) {
  const out = {};
  for (const [k, v] of Object.entries(obj && typeof obj === "object" ? obj : {})) {
    if (k === "_id" || k === "__proto__" || k.startsWith("$") || k.includes(".") || drop.includes(k)) continue;
    // Big images are served as /api/media/... URLs; if an editor sends that URL back, keep the stored image untouched.
    if (isMediaRef(v)) continue;
    out[k] = Array.isArray(v) ? v.filter((x) => !isMediaRef(x)) : v;
  }
  return out;
}

// ---------------------------------------------------------------- media (big base64 images -> cacheable URLs)
// Lists used to carry every image inline, which breaks Vercel's ~4.5 MB response limit after a few dozen articles.
const BIG_IMG = 4000;
const isBigImg = (v) => typeof v === "string" && v.length > BIG_IMG && v.startsWith("data:image/");
const imgHash = (v) => createHash("md5").update(v).digest("hex").slice(0, 8);
const MEDIA_COLS = ["news", "companies", "team", "ads", "members", "premiumNews"];
function slim(colName, doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return doc;
  const base = `/api/media/${colName}/${encodeURIComponent(doc._id)}`;
  const out = { ...doc };
  for (const [k, v] of Object.entries(doc)) {
    if (isBigImg(v)) out[k] = `${base}/${encodeURIComponent(k)}?v=${imgHash(v)}`;
    else if (Array.isArray(v) && v.some(isBigImg)) out[k] = v.map((x, i) => (isBigImg(x) ? `${base}/${encodeURIComponent(k)}?i=${i}&v=${imgHash(x)}` : x));
  }
  return out;
}
const PUBLIC_MEDIA_KEYS = { news: "news", related: "news", companies: "companies", company: "companies", team: "team", ads: "ads", ad: "ads" };
const MEMBER_MEDIA_KEYS = { members: "members", member: "members", submissions: "premiumNews", submission: "premiumNews" };
function slimBody(body, admin) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const out = { ...body };
  const keys = admin ? PUBLIC_MEDIA_KEYS : { ...PUBLIC_MEDIA_KEYS, ...MEMBER_MEDIA_KEYS };
  for (const [k, c] of Object.entries(keys)) {
    if (Array.isArray(out[k])) out[k] = out[k].map((d) => slim(c, d));
    else if (out[k] && typeof out[k] === "object") out[k] = slim(c, out[k]);
  }
  return out;
}

// ---------------------------------------------------------------- rate limit
const hits = new Map();
function allow(key, max, windowMs) {
  const t = Date.now();
  const arr = (hits.get(key) || []).filter((x) => t - x < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return false; }
  arr.push(t);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return true;
}

const bodySize = (d) => { try { return JSON.stringify(d).length; } catch { return Infinity; } };
const tooBig = () => fail(413, "পাঠানো তথ্য/ছবির সাইজ অনেক বড়। ছোট ছবি ব্যবহার করুন।");

// Login attempts are counted in the database, because serverless instances do not share memory.
const LOGIN_MAX = 8, LOGIN_WINDOW = 15 * 60_000;
async function loginBlocked(db, ip) {
  const r = await db.collection("loginAttempts").findOne({ _id: ip });
  return !!r && r.count >= LOGIN_MAX && Date.now() - new Date(r.at).getTime() < LOGIN_WINDOW;
}
async function loginFailed(db, ip) {
  const c = db.collection("loginAttempts");
  const r = await c.findOne({ _id: ip });
  if (r && Date.now() - new Date(r.at).getTime() < LOGIN_WINDOW) await c.updateOne({ _id: ip }, { $inc: { count: 1 } });
  else await c.updateOne({ _id: ip }, { $set: { count: 1, at: new Date() } }, { upsert: true });
}
// Start of "today" in Bangladesh time (UTC+6), as a UTC ISO string.
const dhakaDayStart = () => new Date(Date.parse(new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10) + "T00:00:00+06:00")).toISOString();

// ---------------------------------------------------------------- seed / indexes
let ready = false;
async function ensureReady(db) {
  if (ready) return;
  try {
    const meta = db.collection("meta");
    if (!(await meta.findOne({ _id: "seeded" }))) {
      if (process.env.SEED_SAMPLE !== "false" && (await db.collection("news").countDocuments({})) === 0 && seed.news?.length) {
        await db.collection("news").insertMany(seed.news.map((n) => ({ ...n })));
      }
      await db.collection("settings").updateOne(
        { _id: "site" },
        { $setOnInsert: { contact: seed.settings?.contact || {}, about: seed.settings?.about || {}, totalVisitors: 0 } },
        { upsert: true },
      );
      await meta.updateOne({ _id: "seeded" }, { $set: { at: nowIso() } }, { upsert: true });
    }
    const idx = async (col, spec, opts) => { try { await db.collection(col).createIndex(spec, opts); } catch { /* already exists / conflicting data: not fatal */ } };
    await idx("news", { slug: 1 }, { unique: true });
    await idx("news", { status: 1, createdAt: -1 });
    await idx("members", { memberId: 1 }, { unique: true });
    await idx("comments", { slug: 1, createdAt: -1 });
    await idx("visitors", { at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
    await idx("loginAttempts", { at: 1 }, { expireAfterSeconds: 15 * 60 });
  } catch (e) {
    console.error("ensureReady failed", e);
    return; // try again on the next request
  }
  ready = true;
}

// ---------------------------------------------------------------- auth helpers
function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw fail(500, "JWT_SECRET সেট করা নেই বা খুব ছোট (কমপক্ষে ১৬ অক্ষর)।");
  return s;
}
const adminEmail = () => String(process.env.ADMIN_EMAIL || "noakhalivision1@gmail.com").trim().toLowerCase();

async function getAdminDoc(db) { return db.collection("admin").findOne({ _id: "admin" }); }

async function checkPassword(db, password) {
  const doc = await getAdminDoc(db);
  if (doc?.hash) return verifyPassword(password, doc);
  const envPw = process.env.ADMIN_PASSWORD;
  if (!envPw) throw fail(500, "ADMIN_PASSWORD সেট করা নেই (Vercel → Environment Variables)।");
  return safeEqual(password, envPw);
}

async function authedAdmin(db, headers) {
  const h = headers.authorization || headers.Authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;
  const p = verifyToken(token, secret());
  if (!p || p.role !== "admin") return null;
  const doc = await getAdminDoc(db);
  if (doc?.passwordChangedAt && p.iat < Math.floor(new Date(doc.passwordChangedAt).getTime() / 1000)) return null;
  return { email: p.email };
}

// ---------------------------------------------------------------- shape helpers
const SENSITIVE = /phone|mobile|email|nid|address|whatsapp|password|birth|dob|passport|payment|bkash|nagad|transaction|screenshot/i;
function publicMember(m) {
  if (!m) return m;
  const out = {};
  for (const [k, v] of Object.entries(m)) if (!SENSITIVE.test(k)) out[k] = v;
  return out;
}
const isActiveMember = (m) => String(m.membershipStatus || m.status || "").toLowerCase() === "active";

function newsFilter(q, isAdmin) {
  const f = {};
  if (isAdmin && q.status && q.status !== "all") f.status = q.status;
  else if (!(isAdmin && (q.includeDrafts === "true" || q.includeDrafts === "1" || q.status === "all"))) f.status = "published";
  if (q.category && q.category !== "all") f.category = q.category;
  if (q.location) {
    const loc = locations.find((l) => l.slug === q.location || l.en === q.location || l.bn === q.location);
    f.location = { $in: loc ? [loc.slug, loc.en, loc.bn] : [q.location] };
  }
  const search = String(q.search || q.q || "").trim().slice(0, 100);
  if (search) {
    const re = { $regex: esc(search), $options: "i" };
    f.$or = [{ title: re }, { content: re }, { category: re }, { location: re }];
  }
  return f;
}

const COLLECTIONS = {
  companies: { key: "companies", singular: "company" },
  team: { key: "team", singular: "team" },
  ads: { key: "ads", singular: "ad" },
};
const hidden = (x) => x.status === "inactive" || x.active === false;

// ---------------------------------------------------------------- careers helpers
const JOB_STATUS = ["hiring", "opening-soon", "closed"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const JOB_MODES = ["Office", "Remote", "Hybrid"];
const CAREER_APP_STATUS = ["নতুন", "শর্টলিস্টেড", "ইন্টারভিউ", "নিয়োগ", "বাতিল"];
const listOf = (v, n = 20) => (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((x) => text(x, 300)).filter(Boolean).slice(0, n);
function pickJob(d) {
  const url = text(d.applyUrl, 500);
  return {
    title: text(d.title, 150), titleBn: text(d.titleBn, 150),
    type: JOB_TYPES.includes(d.type) ? d.type : "Full-time",
    mode: JOB_MODES.includes(d.mode) ? d.mode : "Office",
    salary: text(d.salary, 80), location: text(d.location, 100), deadline: text(d.deadline, 20),
    status: JOB_STATUS.includes(d.status) ? d.status : "hiring",
    summary: text(d.summary, 1500), summaryBn: text(d.summaryBn, 1500),
    doing: listOf(d.doing), looking: listOf(d.looking),
    applyUrl: /^https?:\/\/\S+$/i.test(url) ? url : "",
    order: Number.isFinite(Number(d.order)) ? Number(d.order) : 0,
    published: !(d.published === false || d.published === "false"),
  };
}
const CAREERS_PAGE_DEFAULT = {
  heroTitle: "Join Noakhali Vision", heroTitleBn: "নোয়াখালী ভিশনে যোগ দিন",
  heroText: "Help us tell the stories of Noakhali's upazilas, markets and people, and build the district's own digital newsroom.",
  heroTextBn: "নোয়াখালীর উপজেলা, বাজার ও মানুষের গল্প বলার কাজে আমাদের সঙ্গী হোন, গড়ে তুলুন জেলার নিজস্ব ডিজিটাল নিউজরুম।",
  whyTitle: "Life at Noakhali Vision", whyTitleBn: "নোয়াখালী ভিশনে কাজের অভিজ্ঞতা",
  whyCards: [
    { title: "Rooted in Noakhali", titleBn: "মাটির কাছাকাছি কাজ", text: "Cover the places and people you know. Local reporting that matters to your own community.", textBn: "নিজের এলাকা ও মানুষের খবর নিয়ে কাজ করুন, যা সরাসরি আপনার সমাজের কাজে লাগে।" },
    { title: "Learn by doing", titleBn: "কাজ করতে করতে শেখা", text: "Work with AI-assisted newsroom tools and pick up modern digital media skills on real projects.", textBn: "AI-সহায়ক নিউজরুম টুল ব্যবহার করে বাস্তব প্রজেক্টে আধুনিক ডিজিটাল মিডিয়ার দক্ষতা শিখুন।" },
    { title: "Flexible and open", titleBn: "নমনীয় ও খোলামেলা", text: "Office, hybrid and remote roles. Clear expectations, honest feedback, and room for your ideas.", textBn: "অফিস, হাইব্রিড ও রিমোট পদ। স্পষ্ট দায়িত্ব, সৎ মতামত, আর আপনার আইডিয়ার জায়গা।" },
  ],
  listTitle: "Open roles", listTitleBn: "খোলা পদসমূহ",
  ctaTitle: "Not on the list?", ctaTitleBn: "তালিকায় আপনার পদ নেই?",
  ctaText: "Send us a short introduction. We keep every application and reach out when something suits you.", ctaTextBn: "সংক্ষিপ্ত পরিচিতি পাঠান। উপযুক্ত পদ খোলা হলে আমরা যোগাযোগ করব।",
  contactEmail: "",
};
const CAREERS_STR_KEYS = ["heroTitle", "heroTitleBn", "heroText", "heroTextBn", "whyTitle", "whyTitleBn", "listTitle", "listTitleBn", "ctaTitle", "ctaTitleBn", "ctaText", "ctaTextBn"];
function pickCareersPage(d) {
  const out = {};
  for (const k of CAREERS_STR_KEYS) if (d[k] != null) out[k] = text(d[k], 600);
  const email = text(d.contactEmail, 160);
  out.contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
  if (Array.isArray(d.whyCards)) {
    out.whyCards = d.whyCards.slice(0, 8)
      .map((c) => ({ title: text(c?.title, 100), titleBn: text(c?.titleBn, 100), text: text(c?.text, 400), textBn: text(c?.textBn, 400) }))
      .filter((c) => c.title || c.titleBn);
  }
  return out;
}
function mergeCareersPage(stored) {
  const s = stored || {};
  const out = { ...CAREERS_PAGE_DEFAULT };
  for (const k of CAREERS_STR_KEYS) if (typeof s[k] === "string" && s[k].trim()) out[k] = s[k];
  out.contactEmail = typeof s.contactEmail === "string" ? s.contactEmail : "";
  if (Array.isArray(s.whyCards)) out.whyCards = s.whyCards;
  return out;
}

// ---------------------------------------------------------------- main router
export async function route(req) {
  const { method, pathname, query, headers, ip } = req;
  const data = req.body && typeof req.body === "object" ? req.body : {};
  const segments = pathname.split("/").filter(Boolean);
  const m = method.toUpperCase();

  // Diagnostics: shows which env variables exist (never their values) and whether the DB answers.
  if (pathname === "/health" && m === "GET") {
    const env = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16,
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    };
    let dbOk = false, dbError;
    try { const d = await getDb(); await d.command({ ping: 1 }); dbOk = true; } catch (e) { dbError = String(e?.name || "Error"); }
    return { status: 200, body: { ok: env.JWT_SECRET && dbOk, env, db: dbOk, ...(dbError ? { dbError } : {}) } };
  }

  // auth/login is handled before touching the DB so a misconfigured env gives a clear error.
  const db = await getDb();
  await ensureReady(db);
  const admin = await authedAdmin(db, headers);
  const bearer = String(headers.authorization || headers.Authorization || "").replace(/^Bearer\s+/i, "");
  const tokenPayload = bearer ? verifyToken(bearer, secret()) : null;
  let staffUser = null;
  if (tokenPayload?.role === "staff" && tokenPayload.staffId) {
    staffUser = await db.collection("staff").findOne({ _id: tokenPayload.staffId, status: "active" });
    if (staffUser?.passwordChangedAt && tokenPayload.iat < Math.floor(new Date(staffUser.passwordChangedAt).getTime() / 1000)) staffUser = null;
  }
  const isAdmin = !!admin;
  const needAdmin = () => { if (!isAdmin) throw fail(401, "অ্যাডমিন লগইন প্রয়োজন।"); };
  const can = (permission) => isAdmin || !!(staffUser && Array.isArray(staffUser.permissions) && staffUser.permissions.includes(permission));
  const needPermission = (permission) => { if (!isAdmin && !staffUser) throw fail(401, "লগইন প্রয়োজন।"); if (!can(permission)) throw fail(403, "এই কাজের অনুমতি নেই।"); };
  // Admin, or staff who may work with news: they can also see drafts.
  const newsStaff = isAdmin || !!(staffUser && Array.isArray(staffUser.permissions) && ["news.read", "news.create", "news.edit"].some((p) => staffUser.permissions.includes(p)));
  const publicWrite = () => { if (!allow(`w:${ip}`, 30, 60_000)) throw fail(429, "অনেক বেশি অনুরোধ। কিছুক্ষণ পরে চেষ্টা করুন।"); };
  const col = (n) => db.collection(n);
  const ok = (body, status = 200, cache = false) => ({ status, body, admin: isAdmin, cache: cache && !isAdmin && !headers.authorization });

  // ------------------------------------------------------------ auth
  if (pathname === "/auth/login" && m === "POST") {
    if (!allow(`login:${ip}`, 30, 15 * 60_000) || (await loginBlocked(db, ip))) throw fail(429, "অনেকবার ভুল চেষ্টা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।");
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    secret();
    const goodEmail = safeEqual(email, adminEmail());
    const goodPw = password ? await checkPassword(db, password) : false;
    if (goodEmail && goodPw) {
      await db.collection("loginAttempts").deleteOne({ _id: ip });
      const token = signToken({ role: "admin", email: adminEmail() }, secret());
      return ok({ token, user: { email: adminEmail(), role: "admin" } });
    }
    const staff = email ? await db.collection("staff").findOne({ email, status: "active" }) : null;
    if (staff?.hash && staff?.salt && password && verifyPassword(password, staff)) {
      await db.collection("loginAttempts").deleteOne({ _id: ip });
      const token = signToken({ role: "staff", staffId: staff._id, email: staff.email }, secret());
      return ok({ token, user: { email: staff.email, name: staff.name, role: "staff", permissions: staff.permissions || [] } });
    }
    await loginFailed(db, ip); throw fail(401, "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।");
  }
  if (pathname === "/auth/me" && m === "GET") { if (admin) return ok({ user: admin }); if (staffUser) return ok({ user: { email: staffUser.email, name: staffUser.name, role: "staff", permissions: staffUser.permissions || [] } }); throw fail(401, "লগইন প্রয়োজন।"); }
  if (pathname === "/auth/change-password" && m === "PUT") {
    needAdmin();
    if (!(await checkPassword(db, String(data.currentPassword || "")))) throw fail(401, "বর্তমান পাসওয়ার্ড সঠিক নয়।");
    const next = String(data.newPassword || "");
    if (next.length < 8) throw fail(400, "নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
    const { salt, hash } = hashPassword(next);
    await col("admin").updateOne({ _id: "admin" }, { $set: { salt, hash, passwordChangedAt: nowIso() } }, { upsert: true });
    // The caller's own token is now older than passwordChangedAt, so hand back a fresh one.
    const token = signToken({ role: "admin", email: adminEmail() }, secret());
    return ok({ success: true, token });
  }

  // ------------------------------------------------------------ dashboard
  if (pathname === "/dashboard/stats" && m === "GET") {
    needAdmin();
    const today = dhakaDayStart();
    const [totalNews, publishedNews, totalCompanies, totalAds, members, premiumNews, todayVisitors, site] = await Promise.all([
      col("news").countDocuments({}),
      col("news").countDocuments({ status: "published" }),
      col("companies").countDocuments({}),
      col("ads").countDocuments({}),
      col("members").find({}, { projection: { membershipStatus: 1, status: 1 } }).toArray(),
      col("premiumNews").countDocuments({}),
      col("visitors").countDocuments({ createdAt: { $gte: today } }),
      col("settings").findOne({ _id: "site" }),
    ]);
    const st = (x) => x.membershipStatus || x.status;
    return ok({
      totalNews, publishedNews, draftNews: totalNews - publishedNews, totalCompanies,
      totalPremiumMembers: members.length,
      pendingPremiumMembers: members.filter((x) => st(x) === "Pending").length,
      activePremiumMembers: members.filter((x) => String(st(x)).toLowerCase() === "active").length,
      expiredPremiumMembers: members.filter((x) => st(x) === "Expired").length,
      totalPremiumNewsSubmitted: premiumNews,
      totalVisitors: site?.totalVisitors || 0,
      todayVisitors, totalAds,
    });
  }

  // ------------------------------------------------------------ settings
  if (pathname === "/settings" && m === "GET") {
    const s = (await col("settings").findOne({ _id: "site" })) || {};
    const { _id, totalVisitors, ...pub } = s;
    return ok({ settings: pub }, 200, true);
  }
  if (pathname === "/settings" && (m === "PUT" || m === "PATCH")) {
    needAdmin();
    const old = (await col("settings").findOne({ _id: "site" })) || {};
    const body = clean(data, ["totalVisitors"]);
    const next = {
      ...body,
      contact: { ...(old.contact || {}), ...(body.contact || {}) },
      about: { ...(old.about || {}), ...(body.about || {}) },
    };
    await col("settings").updateOne({ _id: "site" }, { $set: next }, { upsert: true });
    const { _id, totalVisitors, ...pub } = (await col("settings").findOne({ _id: "site" })) || {};
    return ok({ settings: pub, success: true });
  }

  // ------------------------------------------------------------ messages (contact / partnership inbox)
  if (pathname === "/messages" && m === "POST") {
    publicWrite();
    const item = {
      _id: uid("message"),
      name: text(data.name, 120), email: text(data.email, 160), phone: text(data.phone, 40),
      subject: text(data.subject, 200), message: text(data.message, 5000), source: text(data.source, 40),
      readAt: null, reply: "", createdAt: nowIso(),
    };
    if (!item.name || !item.email || !item.message) throw fail(400, "নাম, ইমেইল ও বার্তা পূরণ করুন।");
    for (const k of ["company", "budget", "type", "website"]) if (data[k] != null) item[k] = text(data[k], 300);
    await col("messages").insertOne(item);
    return ok({ success: true, message: { _id: item._id } });
  }
  if (pathname === "/messages" && m === "GET") {
    needAdmin();
    const rows = await col("messages").find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return ok({ messages: rows, unread: rows.filter((x) => !x.readAt).length });
  }
  if (pathname.startsWith("/messages/") && segments.length === 2) {
    needAdmin();
    const item = await col("messages").findOne({ _id: segments[1] });
    if (!item) throw fail(404, "বার্তাটি পাওয়া যায়নি।");
    if (m === "PATCH" || m === "PUT") {
      const set = {};
      if (data.read === true || data.read === "true") set.readAt = item.readAt || nowIso();
      if (data.read === false || data.read === "false") set.readAt = null;
      if (data.reply != null) set.reply = text(data.reply, 5000);
      if (data.repliedAt) set.repliedAt = text(data.repliedAt, 40);
      if (Object.keys(set).length) await col("messages").updateOne({ _id: item._id }, { $set: set });
      return ok({ message: await col("messages").findOne({ _id: item._id }), success: true });
    }
    if (m === "DELETE") { await col("messages").deleteOne({ _id: item._id }); return ok({ success: true }); }
  }

  // ------------------------------------------------------------ helper endpoints
  if (pathname === "/ai/news-writer" && m === "POST") {
    needPermission("news.create");
    const content = text(data.content, 20000);
    const language = data.language === "en" ? "English" : "Bangla";
    if (content.length < 80) throw fail(400, "কমপক্ষে ৮০ অক্ষরের সংবাদ বিবরণ দিন।");
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw fail(503, "AI News Writer চালু করতে সার্ভারে OPENAI_API_KEY সেট করতে হবে।");
    const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(12000), body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: `You are a careful newsroom editor. Output JSON with headlines (exactly 3 strings), bestHeadline (one of them), summary (max 120 words), shortNews (max 180 words). Write in ${language}. Use only facts explicitly present in the source. Never invent names, dates, quotes, causes, numbers, or claims. If facts are unclear, stay general.` }, { role: "user", content }] }) });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const code = String(err?.error?.code || err?.error?.type || "");
      console.error("OpenAI error", response.status, code, err?.error?.message);
      const reasons = {
        invalid_api_key: "OPENAI_API_KEY ভুল। সঠিক key বসিয়ে Vercel-এ Redeploy করুন।",
        insufficient_quota: "OpenAI অ্যাকাউন্টে ক্রেডিট/কোটা শেষ। platform.openai.com → Billing-এ ক্রেডিট যোগ করুন (ChatGPT Plus আলাদা, API-র জন্য আলাদা billing লাগে)।",
        model_not_found: "OPENAI_MODEL নামটি ভুল বা এই key-তে সেই মডেল নেই।",
        rate_limit_exceeded: "OpenAI-তে অনেক বেশি অনুরোধ। কিছুক্ষণ পরে চেষ্টা করুন।",
      };
      throw fail(502, reasons[code] || `AI সেবা থেকে উত্তর পাওয়া যায়নি (${response.status}${code ? ", " + code : ""})।`);
    }
    const result = await response.json();
    try { return ok({ result: JSON.parse(result.choices?.[0]?.message?.content || "{}") }); } catch { throw fail(502, "AI-এর উত্তর সঠিক JSON ছিল না; আবার চেষ্টা করুন।"); }
  }
  if (pathname === "/summarize/title" && m === "POST") {
    const title = String(data.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().split(/[.!?।]/)[0].slice(0, 100);
    return ok({ title: title || "নতুন সংবাদ" });
  }
  if (pathname === "/summarize" && m === "POST") {
    const t = String(data.content || "").slice(0, 20000).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return ok({ summary: t.slice(0, 420) + (t.length > 420 ? "…" : "") });
  }
  if (pathname === "/visitors" && m === "POST") {
    if (allow(`v:${ip}`, 120, 60_000)) {
      try {
        await col("visitors").insertOne({ _id: uid("visit"), path: text(data.path, 300), createdAt: nowIso(), at: new Date() });
        await col("settings").updateOne({ _id: "site" }, { $inc: { totalVisitors: 1 } }, { upsert: true });
      } catch { /* tracking must never break the page */ }
    }
    return ok({ success: true });
  }
  if ((pathname === "/push/subscribe" || pathname === "/push/unsubscribe") && m === "POST") return ok({ success: true });

  // ------------------------------------------------------------ media (images stored as base64 in the database)
  if (pathname.startsWith("/media/") && m === "GET" && segments.length === 4) {
    const colName = segments[1];
    const id = decodeURIComponent(segments[2]);
    const field = decodeURIComponent(segments[3]);
    if (!MEDIA_COLS.includes(colName) || !/^[A-Za-z0-9_-]{1,60}$/.test(field) || field === "_id") throw fail(404, "ছবি পাওয়া যায়নি।");
    const personal = colName === "members" || colName === "premiumNews";
    if (personal && SENSITIVE.test(field)) throw fail(404, "ছবি পাওয়া যায়নি।");
    const doc = await col(colName).findOne({ _id: id });
    if (!doc) throw fail(404, "ছবি পাওয়া যায়নি।");
    if (colName === "members" && !isActiveMember(doc)) throw fail(404, "ছবি পাওয়া যায়নি।");
    if (colName === "premiumNews" && doc.status !== "Approved") throw fail(404, "ছবি পাওয়া যায়নি।");
    let v = doc[field];
    if (Array.isArray(v)) v = v[parseInt(query.i, 10)];
    const img = typeof v === "string" ? v.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,([A-Za-z0-9+/=\s]+)$/i) : null;
    if (!img) throw fail(404, "ছবি পাওয়া যায়নি।");
    return { status: 200, raw: Buffer.from(img[2], "base64"), type: img[1].toLowerCase(), body: null, admin: isAdmin };
  }

  // ------------------------------------------------------------ news
  if (pathname === "/news" && m === "GET") {
    const f = newsFilter(query, newsStaff);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 50));
    const sort = query.sort === "views" ? { views: -1, createdAt: -1 } : { createdAt: -1 };
    const [rows, total] = await Promise.all([
      col("news").find(f, { projection: { gallery: 0 } }).sort(sort).skip((page - 1) * limit).limit(limit).toArray(),
      col("news").countDocuments(f),
    ]);
    return ok({ news: rows, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }, total }, 200, true);
  }
  if (pathname === "/news" && m === "POST") {
    needPermission("news.create");
    const body = clean(data, ["views", "createdAt", "updatedAt"]);
    if (body.summary != null) body.summary = text(body.summary, 1500);
    let slug = text(body.slug, 200) || uid("story");
    if (await col("news").findOne({ slug })) slug = `${slug}-${randomBytes(2).toString("hex")}`;
    const item = { ...body, authorId: staffUser?._id || "desk", authorName: staffUser?.name || "Noakhali Vision Desk", _id: uid("news"), slug, status: body.status || "draft", createdAt: nowIso(), updatedAt: nowIso(), views: 0, image: body.image || DEFAULT_IMAGE };
    await col("news").insertOne(item);
    return ok({ news: item, success: true }, 201);
  }
  if (pathname.startsWith("/news/related/") && m === "GET") {
    const slug = decodeURIComponent(segments[2] || "");
    const rows = await col("news").find({ slug: { $ne: slug }, status: "published" }, { projection: { gallery: 0 } }).sort({ createdAt: -1 }).limit(5).toArray();
    return ok({ related: rows }, 200, true);
  }
  if (pathname.startsWith("/news/slug/") && m === "GET") {
    const slug = decodeURIComponent(segments[2] || "");
    let item = null;
    if (newsStaff) item = await col("news").findOne({ slug });
    else item = await col("news").findOneAndUpdate({ slug, status: "published" }, { $inc: { views: 1 } }, { returnDocument: "after" });
    item = item?.value !== undefined && item?._id === undefined ? item.value : item; // driver v5 vs v6+ return shape
    if (!item) throw fail(404, "সংবাদটি পাওয়া যায়নি।");
    return ok({ news: item });
  }
  if (pathname.startsWith("/news/id/") && m === "GET") {
    const item = await col("news").findOne({ _id: segments[2] });
    if (!item || (!newsStaff && item.status !== "published")) throw fail(404, "সংবাদ পাওয়া যায়নি।");
    return ok({ news: item });
  }
  if (pathname.startsWith("/news/") && segments.length === 2) {
    if (m === "DELETE") needPermission("news.delete"); else needPermission("news.edit");
    const id = decodeURIComponent(segments[1]);
    const old = (await col("news").findOne({ _id: id })) || (await col("news").findOne({ slug: id }));
    if (!old) throw fail(404, "সংবাদ পাওয়া যায়নি।");
    if (m === "PUT" || m === "PATCH") {
      const body = clean(data, ["views", "createdAt"]);
      if (body.summary != null) body.summary = text(body.summary, 1500);
      if (body.slug && body.slug !== old.slug && (await col("news").findOne({ slug: body.slug }))) body.slug = `${body.slug}-${randomBytes(2).toString("hex")}`;
      if (Array.isArray(body.gallery)) body.gallery = [...(old.gallery || []), ...body.gallery];
      await col("news").updateOne({ _id: old._id }, { $set: { ...body, updatedAt: nowIso() } });
      return ok({ news: await col("news").findOne({ _id: old._id }), success: true });
    }
    if (m === "DELETE") {
      await col("news").deleteOne({ _id: old._id });
      await col("comments").deleteMany({ slug: old.slug });
      return ok({ success: true });
    }
  }

  // ------------------------------------------------------------ comments
  if (pathname.startsWith("/comments/") && segments.length === 2) {
    const slug = decodeURIComponent(segments[1]);
    if (m === "GET") {
      const rows = await col("comments").find({ slug }).sort({ createdAt: -1 }).limit(100).toArray();
      return ok({ comments: rows.map(({ slug: _s, ...c }) => c) });
    }
    if (m === "PUT" || m === "PATCH" || m === "DELETE") {
      needPermission("comments.moderate");
      const commentId = decodeURIComponent(segments[1]);
      const oldComment = await col("comments").findOne({ _id: commentId });
      if (!oldComment) throw fail(404, "মন্তব্য পাওয়া যায়নি।");
      if (m === "DELETE") { await col("comments").deleteOne({ _id: commentId }); return ok({ success: true }); }
      const content = text(data.content, 1000); if (!content) throw fail(400, "মন্তব্য ফাঁকা রাখা যাবে না।");
      await col("comments").updateOne({ _id: commentId }, { $set: { content, editedAt: nowIso() } });
      const updated = await col("comments").findOne({ _id: commentId }); const { slug: _slug, ...out } = updated; return ok({ comment: out, success: true });
    }
    if (m === "POST") {
      publicWrite();
      const name = text(data.name, 80), content = text(data.content, 1000);
      if (!name || !content) throw fail(400, "নাম ও মন্তব্য লিখুন।");
      if (!(await col("news").findOne({ slug, status: "published" }))) throw fail(404, "সংবাদটি পাওয়া যায়নি।");
      const comment = { _id: uid("comment"), slug, name, content, createdAt: nowIso() };
      await col("comments").insertOne(comment);
      const { slug: _s, ...out } = comment;
      return ok({ comment: out, success: true }, 201);
    }
  }

  // ------------------------------------------------------------ companies / team / ads
  for (const c of Object.values(COLLECTIONS)) {
    const root = `/${c.key}`;
    const showAll = isAdmin && (query.includeDrafts === "1" || query.includeDrafts === "true");
    if (pathname === root && m === "GET") {
      let rows = await col(c.key).find({}).sort({ createdAt: -1 }).limit(500).toArray();
      if (!showAll) rows = rows.filter((x) => !hidden(x));
      if (c.key === "ads" && query.placement) rows = rows.filter((x) => !x.placement || x.placement === "all" || x.placement === query.placement);
      return ok({ [c.key]: rows }, 200, true);
    }
    if (pathname === root && m === "POST") {
      needAdmin();
      const item = { ...clean(data, ["createdAt"]), _id: uid(c.key), createdAt: nowIso() };
      item.status = item.status || "active";
      item.image = item.image || DEFAULT_IMAGE;
      await col(c.key).insertOne(item);
      return ok({ [c.singular]: item, success: true }, 201);
    }
    if (pathname.startsWith(`${root}/`) && segments.length === 2) {
      const id = decodeURIComponent(segments[1]);
      const item = await col(c.key).findOne({ _id: id });
      if (m === "GET") {
        if (!item || (!isAdmin && hidden(item))) throw fail(404, "পাওয়া যায়নি।");
        return ok({ [c.singular]: item });
      }
      needAdmin();
      if (!item) { if (m === "DELETE") return ok({ success: true }); throw fail(404, "পাওয়া যায়নি।"); }
      if (m === "PUT" || m === "PATCH") {
        await col(c.key).updateOne({ _id: id }, { $set: clean(data, ["createdAt"]) });
        return ok({ [c.singular]: await col(c.key).findOne({ _id: id }), success: true });
      }
      if (m === "DELETE") { await col(c.key).deleteOne({ _id: id }); return ok({ success: true }); }
    }
  }

  // ------------------------------------------------------------ editorial staff list (admin only)
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    needAdmin();
    const ROLES = ["News Presenter", "Moderator", "Manager"];
    const PERMISSIONS = ["news.read", "news.create", "news.edit", "news.delete", "comments.moderate", "categories.manage", "media.manage"];
    const pick = (d) => ({
      name: text(d.name, 120), email: text(d.email, 160).toLowerCase(),
      role: ROLES.includes(d.role) ? d.role : "News Presenter",
      phone: text(d.phone, 40), status: d.status === "inactive" ? "inactive" : "active",
      permissions: Array.isArray(d.permissions) ? [...new Set(d.permissions.filter(x => PERMISSIONS.includes(x)))] : [],
    });
    const safeStaff = (member) => { if (!member) return member; const { hash, salt, ...safe } = member; return safe; };
    if (pathname === "/staff" && m === "GET") return ok({ staff: (await col("staff").find({}).sort({ createdAt: -1 }).limit(500).toArray()).map(safeStaff), permissions: PERMISSIONS });
    if (pathname === "/staff" && m === "POST") {
      const s = pick(data), password = String(data.password || "");
      if (!s.name || !s.email) throw fail(400, "নাম ও ইমেইল দিন।");
      if (password.length < 8) throw fail(400, "স্টাফ পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      if (await col("staff").findOne({ email: s.email })) throw fail(409, "এই ইমেইল দিয়ে একজন সদস্য আগে থেকেই আছে।");
      const { salt, hash } = hashPassword(password);
      const item = { ...s, salt, hash, _id: uid("staff"), createdAt: nowIso() };
      await col("staff").insertOne(item);
      return ok({ member: safeStaff(item), success: true }, 201);
    }
    if (segments.length === 2) {
      const id = decodeURIComponent(segments[1]);
      const old = await col("staff").findOne({ _id: id });
      if (!old) throw fail(404, "সদস্য পাওয়া যায়নি।");
      if (m === "PUT" || m === "PATCH") {
        const s = pick({ ...old, ...data });
        if (!s.name || !s.email) throw fail(400, "নাম ও ইমেইল দিন।");
        const dup = await col("staff").findOne({ email: s.email });
        if (dup && dup._id !== id) throw fail(409, "এই ইমেইল দিয়ে একজন সদস্য আগে থেকেই আছে।");
        const update = { ...s, updatedAt: nowIso() };
        const password = String(data.password || "");
        if (password) { if (password.length < 8) throw fail(400, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।"); Object.assign(update, hashPassword(password), { passwordChangedAt: nowIso() }); }
        await col("staff").updateOne({ _id: id }, { $set: update });
        return ok({ member: safeStaff(await col("staff").findOne({ _id: id })), success: true });
      }
      if (m === "DELETE") { await col("staff").deleteOne({ _id: id }); return ok({ success: true }); }
    }
  }

  // ------------------------------------------------------------ dynamic news categories
  if (pathname === "/categories" && m === "GET") {
    const rows = await col("categories").find({}).sort({ name: 1 }).limit(300).toArray();
    return ok({ categories: rows.length ? rows : [{ _id: "local", name: "স্থানীয়", slug: "local", description: "" }, { _id: "politics", name: "রাজনীতি", slug: "politics", description: "" }, { _id: "sports", name: "খেলাধুলা", slug: "sports", description: "" }, { _id: "education", name: "শিক্ষা", slug: "education", description: "" }] }, 200, true);
  }
  if (pathname === "/categories" && m === "POST") {
    needPermission("categories.manage");
    const name = text(data.name, 100), slug = text(data.slug, 120).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!name || !slug) throw fail(400, "বিভাগের নাম ও ইংরেজি slug দিন।");
    if (await col("categories").findOne({ slug })) throw fail(409, "এই slug-এর বিভাগ আগে থেকেই আছে।");
    const item = { _id: uid("category"), name, slug, description: text(data.description, 500), createdAt: nowIso(), updatedAt: nowIso() };
    await col("categories").insertOne(item); return ok({ category: item, success: true }, 201);
  }
  if (pathname.startsWith("/categories/") && segments.length === 2) {
    needPermission("categories.manage"); const id = decodeURIComponent(segments[1]); const old = await col("categories").findOne({ _id: id });
    if (!old) throw fail(404, "বিভাগ পাওয়া যায়নি।");
    if (m === "PUT" || m === "PATCH") {
      const update = { name: text(data.name ?? old.name, 100), slug: text(data.slug ?? old.slug, 120).toLowerCase().replace(/[^a-z0-9-]/g, "-"), description: text(data.description ?? old.description, 500), updatedAt: nowIso() };
      if (!update.name || !update.slug) throw fail(400, "বিভাগের নাম ও slug প্রয়োজন।");
      const duplicate = await col("categories").findOne({ slug: update.slug }); if (duplicate && duplicate._id !== id) throw fail(409, "এই slug ব্যবহৃত হচ্ছে।");
      await col("categories").updateOne({ _id: id }, { $set: update });
      // Keep existing articles readable by changing the stored category label too.
      if (old.name !== update.name) await col("news").updateMany({ category: old.name }, { $set: { category: update.name, updatedAt: nowIso() } });
      return ok({ category: await col("categories").findOne({ _id: id }), success: true });
    }
    if (m === "DELETE") { const used = await col("news").countDocuments({ category: old.name }); if (used) throw fail(409, "এই বিভাগে সংবাদ রয়েছে। আগে সংবাদগুলোর বিভাগ পরিবর্তন করুন।"); await col("categories").deleteOne({ _id: id }); return ok({ success: true }); }
  }

  // Public author profile: only public fields and published articles are returned.
  if (pathname.startsWith("/authors/") && segments.length === 2 && m === "GET") {
    const authorId = decodeURIComponent(segments[1]);
    const staff = authorId === "desk" ? null : await col("staff").findOne({ _id: authorId, status: "active" });
    const filter = authorId === "desk" ? { status: "published", $or: [{ authorId: "desk" }, { authorId: { $exists: false } }] } : { status: "published", authorId };
    const articles = await col("news").find(filter).sort({ createdAt: -1 }).limit(100).toArray();
    if (authorId !== "desk" && !staff && !articles.length) throw fail(404, "লেখক পাওয়া যায়নি।");
    return ok({ author: staff ? { _id: staff._id, name: staff.name, role: staff.role } : { _id: "desk", name: "Noakhali Vision Desk", role: "Editorial Desk" }, news: articles });
  }

  // ------------------------------------------------------------ election spotlight applications
  const ELECTION_STATUS = ["অপেক্ষমাণ", "পর্যালোচনাধীন", "অনুমোদিত", "বাতিল"];
  if (pathname === "/election/applications" && m === "POST") {
    publicWrite();
    if (bodySize(data) > 1_500_000) throw tooBig();
    const yes = (v) => v === true || v === "true";
    const phone = text(data.phone, 30).replace(/[\s-]/g, "");
    if (!text(data.name, 120)) throw fail(400, "প্রার্থীর নাম লিখুন।");
    if (!/^01\d{9}$/.test(phone)) throw fail(400, "সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন।");
    if (!text(data.upazila, 80) || !text(data.union, 80)) throw fail(400, "উপজেলা ও ইউনিয়ন লিখুন।");
    if (!text(data.bio, 3000)) throw fail(400, "সংক্ষিপ্ত পরিচিতি লিখুন।");
    if (!yes(data.accuracy) || !yes(data.publication) || !yes(data.terms)) throw fail(400, "সবগুলো সম্মতিতে টিক দিন।");
    const photo = typeof data.photo === "string" && /^data:image\//.test(data.photo) && data.photo.length <= 1_200_000 ? data.photo : "";
    const seq = await col("meta").findOneAndUpdate({ _id: "electionSeq" }, { $inc: { n: 1 } }, { upsert: true, returnDocument: "after" });
    const n = (seq?.n ?? seq?.value?.n) || 1;
    const item = {
      _id: uid("election"), ref: `NV-E-${String(n).padStart(4, "0")}`,
      name: text(data.name, 120), phone, email: text(data.email, 160),
      district: text(data.district, 80), upazila: text(data.upazila, 80), union: text(data.union, 80), ward: text(data.ward, 40),
      affiliation: data.affiliation === "party" ? "party" : "independent", party: text(data.party, 120),
      electionType: text(data.electionType, 120), position: text(data.position, 120), candidateStatus: text(data.status, 120),
      bio: text(data.bio, 3000), education: text(data.education, 2000), service: text(data.service, 2000),
      manifesto: text(data.manifesto, 3000), why: text(data.why, 2000), photo,
      accuracy: true, publication: true, terms: true,
      status: "অপেক্ষমাণ", note: "", createdAt: nowIso(),
    };
    await col("electionApplications").insertOne(item);
    return ok({ success: true, ref: item.ref }, 201);
  }
  if (pathname === "/election/applications" && m === "GET") {
    needAdmin();
    const rows = await col("electionApplications").find({}, { projection: { photo: 0, bio: 0, education: 0, service: 0, manifesto: 0, why: 0 } }).sort({ createdAt: -1 }).limit(500).toArray();
    return ok({ applications: rows });
  }
  if (pathname.startsWith("/election/applications/") && segments.length === 3) {
    needAdmin();
    const id = decodeURIComponent(segments[2]);
    const item = await col("electionApplications").findOne({ _id: id });
    if (!item) throw fail(404, "আবেদনটি পাওয়া যায়নি।");
    if (m === "GET") return ok({ application: item });
    if (m === "PUT" || m === "PATCH") {
      const set = { updatedAt: nowIso() };
      if (data.status != null) {
        if (!ELECTION_STATUS.includes(data.status)) throw fail(400, "অজানা স্ট্যাটাস।");
        set.status = data.status;
      }
      if (data.note != null) set.note = text(data.note, 1000);
      await col("electionApplications").updateOne({ _id: id }, { $set: set });
      return ok({ application: await col("electionApplications").findOne({ _id: id }), success: true });
    }
    if (m === "DELETE") { await col("electionApplications").deleteOne({ _id: id }); return ok({ success: true }); }
  }

  // ------------------------------------------------------------ careers (jobs, page content, applications)
  if (pathname === "/careers" && m === "GET") {
    const all = isAdmin && (query.includeDrafts === "1" || query.includeDrafts === "true");
    const jobs = await col("careers").find(all ? {} : { published: { $ne: false } }).limit(200).toArray();
    const rank = (j) => JOB_STATUS.indexOf(j.status);
    jobs.sort((a, b) => rank(a) - rank(b) || (a.order || 0) - (b.order || 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
    const page = mergeCareersPage(await col("settings").findOne({ _id: "careersPage" }));
    return ok({ jobs, page }, 200, true);
  }
  if (pathname === "/careers/page" && (m === "PUT" || m === "PATCH")) {
    needAdmin();
    const old = (await col("settings").findOne({ _id: "careersPage" })) || {};
    const next = { ...pickCareersPage({ ...old, ...data }), updatedAt: nowIso() };
    await col("settings").updateOne({ _id: "careersPage" }, { $set: next }, { upsert: true });
    return ok({ page: mergeCareersPage(await col("settings").findOne({ _id: "careersPage" })), success: true });
  }
  if (pathname === "/careers/applications" && m === "GET") {
    needAdmin();
    const f = query.jobId ? { jobId: String(query.jobId) } : {};
    const rows = await col("careerApplications").find(f).sort({ createdAt: -1 }).limit(1000).toArray();
    return ok({ applications: rows, newCount: rows.filter((x) => x.status === "নতুন").length });
  }
  if (pathname.startsWith("/careers/applications/") && segments.length === 3) {
    needAdmin();
    const id = decodeURIComponent(segments[2]);
    const item = await col("careerApplications").findOne({ _id: id });
    if (!item) throw fail(404, "আবেদনটি পাওয়া যায়নি।");
    if (m === "GET") return ok({ application: item });
    if (m === "PUT" || m === "PATCH") {
      const set = { updatedAt: nowIso() };
      if (data.status != null) {
        if (!CAREER_APP_STATUS.includes(data.status)) throw fail(400, "অজানা স্ট্যাটাস।");
        set.status = data.status;
      }
      if (data.note != null) set.note = text(data.note, 1000);
      await col("careerApplications").updateOne({ _id: id }, { $set: set });
      return ok({ application: await col("careerApplications").findOne({ _id: id }), success: true });
    }
    if (m === "DELETE") { await col("careerApplications").deleteOne({ _id: id }); return ok({ success: true }); }
  }
  if (pathname === "/careers" && m === "POST") {
    needAdmin();
    const job = pickJob(data);
    if (!job.title) throw fail(400, "পদের নাম (English) দিন।");
    const item = { ...job, _id: uid("job"), createdAt: nowIso() };
    await col("careers").insertOne(item);
    return ok({ job: item, success: true }, 201);
  }
  if (segments[0] === "careers" && segments.length === 3 && segments[2] === "apply" && m === "POST") {
    publicWrite();
    if (text(data.website, 200)) return ok({ success: true, ref: "NV-C-0000" }, 201); // honeypot: bots fill hidden fields
    const job = await col("careers").findOne({ _id: decodeURIComponent(segments[1]) });
    if (!job || job.published === false) throw fail(404, "পদটি পাওয়া যায়নি।");
    if (job.status !== "hiring") throw fail(400, "এই পদে এখন আবেদন নেওয়া হচ্ছে না।");
    const email = text(data.email, 160).toLowerCase();
    const phone = text(data.phone, 30);
    const resumeUrl = text(data.resumeUrl, 500);
    if (!text(data.name, 120)) throw fail(400, "আপনার নাম লিখুন।");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, "সঠিক ইমেইল দিন।");
    if (phone.replace(/\D/g, "").length < 7) throw fail(400, "সঠিক ফোন নম্বর দিন।");
    if (resumeUrl && !/^https?:\/\/\S+$/i.test(resumeUrl)) throw fail(400, "রিজিউমের লিংক http:// বা https:// দিয়ে শুরু হতে হবে।");
    if (!resumeUrl && !text(data.coverLetter, 3000)) throw fail(400, "রিজিউমের লিংক অথবা নিজের পরিচিতি লিখুন।");
    if (await col("careerApplications").findOne({ jobId: job._id, email })) throw fail(409, "এই ইমেইল দিয়ে আপনি আগেই এই পদে আবেদন করেছেন।");
    if (!allow(`apply:${ip}`, 8, 60 * 60_000)) throw fail(429, "অনেক বেশি আবেদন পাঠানো হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।");
    const seq = await col("meta").findOneAndUpdate({ _id: "careerSeq" }, { $inc: { n: 1 } }, { upsert: true, returnDocument: "after" });
    const n = (seq?.n ?? seq?.value?.n) || 1;
    const item = {
      _id: uid("capp"), ref: `NV-C-${String(n).padStart(4, "0")}`,
      jobId: job._id, jobTitle: job.title,
      name: text(data.name, 120), email, phone, resumeUrl,
      portfolio: /^https?:\/\/\S+$/i.test(text(data.portfolio, 500)) ? text(data.portfolio, 500) : "",
      coverLetter: text(data.coverLetter, 3000),
      status: "নতুন", note: "", createdAt: nowIso(),
    };
    await col("careerApplications").insertOne(item);
    return ok({ success: true, ref: item.ref }, 201);
  }
  if (pathname.startsWith("/careers/") && segments.length === 2) {
    needAdmin();
    const id = decodeURIComponent(segments[1]);
    const old = await col("careers").findOne({ _id: id });
    if (!old) { if (m === "DELETE") return ok({ success: true }); throw fail(404, "পদটি পাওয়া যায়নি।"); }
    if (m === "GET") return ok({ job: old });
    if (m === "PUT" || m === "PATCH") {
      const job = pickJob({ ...old, ...data });
      if (!job.title) throw fail(400, "পদের নাম (English) দিন।");
      await col("careers").updateOne({ _id: id }, { $set: { ...job, updatedAt: nowIso() } });
      return ok({ job: await col("careers").findOne({ _id: id }), success: true });
    }
    if (m === "DELETE") { await col("careers").deleteOne({ _id: id }); return ok({ success: true }); }
  }

  // ------------------------------------------------------------ premium members
  if (pathname === "/premium/stats" && m === "GET") {
    needAdmin();
    const rows = await col("members").find({}, { projection: { membershipStatus: 1, status: 1 } }).toArray();
    const n = (s) => rows.filter((x) => String(x.membershipStatus || x.status).toLowerCase() === s).length;
    return ok({ total: rows.length, active: n("active"), pending: n("pending"), suspended: n("suspended"), expired: n("expired") });
  }
  if (pathname === "/premium/members" && m === "GET") {
    let rows = await col("members").find({}).sort({ createdAt: -1 }).limit(1000).toArray();
    if (!isAdmin) return ok({ members: rows.filter(isActiveMember).map(publicMember) }, 200, true);
    rows = rows.filter((x) => String(x.membershipStatus || x.status) !== "Rejected");
    if (query.search) { const t = String(query.search).toLowerCase(); rows = rows.filter((x) => `${x.name || ""} ${x.memberId || ""} ${x.phone || ""} ${x.email || ""}`.toLowerCase().includes(t)); }
    if (query.status) rows = rows.filter((x) => String(x.membershipStatus || x.status || "").toLowerCase() === String(query.status).toLowerCase());
    return ok({ members: rows });
  }
  if (pathname === "/premium/members" && m === "POST") {
    publicWrite();
    if (bodySize(data) > 2_000_000) throw tooBig();
    if (!text(data.name, 120)) throw fail(400, "নাম লিখুন।");
    const seq = await col("meta").findOneAndUpdate({ _id: "memberSeq" }, { $inc: { n: 1 } }, { upsert: true, returnDocument: "after" });
    const n = (seq?.n ?? seq?.value?.n) || 1;
    const member = {
      ...clean(data, ["memberId", "membershipStatus", "status", "createdAt", "joinDate"]),
      _id: uid("member"), memberId: `NV-${String(n).padStart(4, "0")}`,
      membershipStatus: "Pending", status: "Pending", createdAt: nowIso(),
    };
    await col("members").insertOne(member);
    return ok({ member, success: true }, 201);
  }
  if (pathname.startsWith("/premium/members/")) {
    const id = decodeURIComponent(segments[2] || "");
    const member = (await col("members").findOne({ memberId: id })) || (await col("members").findOne({ _id: id }));
    if (segments.length === 3 && m === "GET") {
      if (!member || (!isAdmin && !isActiveMember(member))) throw fail(404, "মেম্বার পাওয়া যায়নি।");
      const subs = await col("premiumNews").find({ memberId: member.memberId }).sort({ createdAt: -1 }).limit(100).toArray();
      return isAdmin
        ? ok({ member, submissions: subs })
        : ok({ member: publicMember(member), submissions: subs.filter((s) => s.status === "Approved").map(({ ...s }) => publicMember(s)) });
    }
    if (segments.length === 4 && segments[3] === "news" && m === "POST") {
      publicWrite();
      if (bodySize(data) > 3_000_000) throw tooBig();
      if (!member || !isActiveMember(member)) throw fail(403, "শুধু অনুমোদিত (Active) প্রিমিয়াম মেম্বার সংবাদ জমা দিতে পারবেন।");
      const year = nowIso().slice(0, 4);
      const used = await col("premiumNews").countDocuments({ memberId: member.memberId, createdAt: { $gte: `${year}-01-01` } });
      if (used >= 12) throw fail(429, "এই বছরের জন্য সংবাদ জমা দেওয়ার সীমা (১২টি) শেষ।");
      const submission = { ...clean(data, ["status", "memberId", "createdAt"]), _id: uid("submission"), status: "Pending", memberId: member.memberId, createdAt: nowIso() };
      await col("premiumNews").insertOne(submission);
      return ok({ submission, remaining: 12 - used - 1, success: true }, 201);
    }
    needAdmin();
    if (!member) throw fail(404, "মেম্বার পাওয়া যায়নি।");
    if (segments.length === 3 && (m === "PUT" || m === "PATCH")) {
      await col("members").updateOne({ _id: member._id }, { $set: clean(data, ["createdAt"]) });
      return ok({ member: await col("members").findOne({ _id: member._id }), success: true });
    }
    if (segments.length === 3 && m === "DELETE") { await col("members").deleteOne({ _id: member._id }); return ok({ success: true }); }
    if (segments.length >= 4 && m === "PATCH") {
      const a = String(segments[3]).toLowerCase();
      const status = a.includes("approv") ? "Active" : a.includes("reject") ? "Rejected" : a.includes("suspend") ? "Suspended" : a.includes("expire") ? "Expired" : a.includes("pend") ? "Pending" : "";
      if (!status) throw fail(400, "অজানা অ্যাকশন।");
      const set = { membershipStatus: status, status };
      if (status === "Active" && !member.joinDate) set.joinDate = nowIso();
      await col("members").updateOne({ _id: member._id }, { $set: set });
      return ok({ member: await col("members").findOne({ _id: member._id }), success: true });
    }
  }

  // ------------------------------------------------------------ premium news submissions (admin)
  if (pathname === "/premium/news" && m === "GET") {
    needAdmin();
    const f = query.status ? { status: { $regex: `^${esc(query.status)}$`, $options: "i" } } : {};
    return ok({ submissions: await col("premiumNews").find(f).sort({ createdAt: -1 }).limit(500).toArray() });
  }
  if (pathname.startsWith("/premium/news/")) {
    needAdmin();
    const id = segments[2];
    if (m === "DELETE") { await col("premiumNews").deleteOne({ _id: id }); return ok({ success: true }); }
    if (m === "PUT" || m === "PATCH") {
      const item = await col("premiumNews").findOne({ _id: id });
      if (!item) throw fail(404, "জমা দেওয়া সংবাদ পাওয়া যায়নি।");
      const set = clean(data, ["memberId", "createdAt"]);
      const a = String(segments[3] || "").toLowerCase();
      if (a) set.status = a.startsWith("approv") ? "Approved" : a.startsWith("reject") ? "Rejected" : a.startsWith("pend") ? "Pending" : item.status;
      if (Object.keys(set).length) await col("premiumNews").updateOne({ _id: id }, { $set: set });
      return ok({ submission: await col("premiumNews").findOne({ _id: id }), success: true });
    }
  }

  throw fail(404, "এই API পাওয়া যায়নি।");
}

// ---------------------------------------------------------------- HTTP entry (shared by Vercel + local dev server)
export async function handle(req) {
  try {
    const r = await route(req);
    if (!r.raw) r.body = slimBody(r.body, r.admin);
    return r;
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: { message: e.message } };
    if (e?.status && e?.message) return { status: e.status, body: { message: e.message } };
    console.error("API error:", e);
    const dbDown = /Server selection|ECONN|ENOTFOUND|MongoNetwork|MongoServerSelection|auth/i.test(String(e?.name) + String(e?.message));
    return { status: dbDown ? 503 : 500, body: { message: dbDown ? "ডেটাবেস সংযোগ করা যায়নি। MONGODB_URI ও Atlas Network Access (0.0.0.0/0) ঠিক আছে কিনা দেখুন।" : "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।" } };
  }
}
