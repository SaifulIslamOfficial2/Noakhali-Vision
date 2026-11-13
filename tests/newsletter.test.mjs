// Newsletter tests: strict email checks, DNS check (mocked), duplicates, admin list/count/delete.
process.env.JWT_SECRET = "testsecret-testsecret-testsecret-1234567890";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "Str0ng!Pass";
const { setDb } = await import("../api/_lib/db.js");
const { FakeDb } = await import("./fake-mongo.mjs");
const { handle } = await import("../api/_lib/routes.js");
const { setMailResolver } = await import("../api/_lib/mailDomain.js");
const { checkEmail } = await import("../src/utils/emailCheck.js");
setDb(new FakeDb());
// pretend only these domains exist
const REAL = new Set(["gmail.com", "yahoo.com", "outlook.com", "noakhalivision.com", "company.com.bd"]);
const nx = () => Object.assign(new Error("nx"), { code: "ENOTFOUND" });
setMailResolver({ mx: async (d) => { if (REAL.has(d)) return [{ exchange: `mx.${d}`, priority: 10 }]; if (d === "flaky.com") throw Object.assign(new Error("t"), { code: "ESERVFAIL" }); throw nx(); }, a: async () => { throw nx(); } });

let pass = 0, failN = 0;
const check = (name, ok, extra = "") => { if (ok) pass++; else { failN++; console.log("FAIL:", name, extra); } };
let n = 0;
const call = (method, pathname, body, token) => handle({ method, pathname, query: {}, headers: token ? { authorization: `Bearer ${token}` } : {}, body: body || {}, ip: `9.9.${++n % 200}.1` });
const T = (await call("POST", "/auth/login", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })).body.token;
const sub = (email, extra = {}) => call("POST", "/newsletter", { email, ...extra });

// ---- pure checks
const bad = { "": "invalid", "abc": "invalid", "a@b": "invalid", "a b@gmail.com": "invalid", "john..doe@gmail.com": "invalid", "john@gmial.com": "typo", "john.smith@yahooo.com": "typo",
  "x@mailinator.com": "disposable", "someone@sub.yopmail.com": "disposable", "real.person@example.com": "placeholder", "test@company.com.bd": "placeholder", "asdf@outlook.com": "placeholder",
  "aaaa@outlook.com": "placeholder", "fake@gmail.com": "placeholder", "rahim@gmail.com": "invalid", "rahim_uddin@gmail.com": "invalid", "me@host.test": "placeholder", "user@localhost": "invalid" };
for (const [e, code] of Object.entries(bad)) { const r = checkEmail(e); check(`reject ${e || "(empty)"} -> ${code}`, !r.ok && r.code === code, JSON.stringify(r)); }
for (const e of ["rahim.uddin@gmail.com", "Karim2026@Gmail.com", "info@noakhalivision.com", "nasrin@company.com.bd", "m.hossain+news@outlook.com"]) check(`accept ${e}`, checkEmail(e).ok, JSON.stringify(checkEmail(e)));
check("typo suggestion", checkEmail("john@gmial.com").suggest === "john@gmail.com");
check("gmail dots/+tag are the same person", checkEmail("rahim.uddin+x@gmail.com").key === checkEmail("rahimuddin@gmail.com").key);

// ---- API
let r = await sub("rahim@no-such-domain-xyz.com"); check("unknown domain -> 400 nodomain", r.status === 400 && r.body.code === "nodomain", JSON.stringify(r.body));
r = await sub("x@mailinator.com"); check("disposable -> 400", r.status === 400 && r.body.code === "disposable");
r = await sub("john@gmial.com", { lang: "en" }); check("typo -> english hint", r.status === 400 && /john@gmail\.com/.test(r.body.message), r.body.message);
r = await sub("rahim.uddin@gmail.com", { source: "footer" }); check("valid -> 201 saved", r.status === 201 && r.body.already === false, JSON.stringify(r));
r = await sub("Rahim.Uddin+news@gmail.com"); check("same gmail person -> already, no second row", r.status === 200 && r.body.already === true, JSON.stringify(r));
r = await sub("owner@flaky.com"); check("DNS outage never blocks a visitor", r.status === 201, JSON.stringify(r));
r = await sub("bot@gmail.com", { website: "http://spam" }); check("honeypot filled -> pretends ok, not saved", r.status === 200 && !r.body.already);
await sub("karim2026@outlook.com", { source: "home" });

// ---- admin
r = await call("GET", "/subscribers"); check("public cannot list", r.status === 401 || r.status === 403, String(r.status));
r = await call("GET", "/subscribers", null, T);
check("admin list + counts", r.status === 200 && r.body.total === 3 && r.body.today === 3 && r.body.last7 === 3 && r.body.subscribers.length === 3, JSON.stringify({ t: r.body.total, today: r.body.today }));
check("internal key not exposed", !("key" in r.body.subscribers[0]));
r = await call("GET", "/dashboard/stats", null, T); check("dashboard has subscriber count", r.body.totalSubscribers === 3, String(r.body.totalSubscribers));
const id = (await call("GET", "/subscribers", null, T)).body.subscribers[0]._id;
r = await call("DELETE", `/subscribers/${id}`); check("public cannot delete", r.status === 401 || r.status === 403);
r = await call("DELETE", `/subscribers/${id}`, null, T); check("admin delete", r.status === 200 && (await call("GET", "/subscribers", null, T)).body.total === 2);
console.log(`${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
