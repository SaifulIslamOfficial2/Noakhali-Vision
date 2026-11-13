const B = "http://localhost:3001/api";
let pass = 0, failN = 0;
const check = (name, cond, extra = "") => { if (cond) pass++; else { failN++; console.log("FAIL:", name, extra); } };
const call = async (method, path, body, token) => {
  const r = await fetch(B + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body && method !== "GET" && method !== "DELETE" ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch {}
  return { s: r.status, j };
};
const EMAIL = "noakhalivision1@gmail.com", PW = "Str0ng!Pass";

// --- auth
let r = await call("POST", "/auth/login", { email: EMAIL, password: "wrong" }); check("bad login 401", r.s === 401);
r = await call("POST", "/auth/login", { email: "x@y.com", password: PW }); check("bad email 401", r.s === 401);
r = await call("POST", "/auth/login", { email: EMAIL, password: "" }); check("empty pw 401", r.s === 401);
r = await call("POST", "/auth/login", { email: EMAIL, password: PW }); check("login ok", r.s === 200 && r.j.token);
let T = r.j.token;
r = await call("GET", "/auth/me", null, T); check("me", r.s === 200 && r.j.user.email === EMAIL);
r = await call("GET", "/auth/me", null, T + "x"); check("tampered token 401", r.s === 401);
r = await call("GET", "/auth/me"); check("no token 401", r.s === 401);

// --- admin-only endpoints reject anonymous
for (const [m, p] of [["GET", "/dashboard/stats"], ["GET", "/messages"], ["POST", "/news"], ["PUT", "/settings"], ["POST", "/ads"], ["POST", "/companies"], ["POST", "/team"], ["GET", "/premium/stats"], ["GET", "/premium/news"], ["DELETE", "/news/news-1"], ["PUT", "/news/news-1"], ["PATCH", "/premium/members/NV-0001/approve"], ["DELETE", "/premium/members/NV-0001"], ["PUT", "/auth/change-password"]]) {
  r = await call(m, p, {}); check(`anon ${m} ${p} -> 401`, r.s === 401, r.s);
}

// --- news: public sees only published; admin sees drafts
r = await call("POST", "/news", { title: "Draft A", slug: "draft-a", content: "x", status: "draft", location: "বেগমগঞ্জ", category: "স্থানীয়" }, T); check("create draft", r.s === 201 && r.j.news.status === "draft");
r = await call("POST", "/news", { title: "Pub B", slug: "pub-b", content: "hello world", status: "published", location: "chatkhil", category: "স্থানীয়", gallery: ["data:image/jpeg;base64,AAA"] }, T); check("create published", r.s === 201);
const pubId = r.j.news._id;
r = await call("POST", "/news", { title: "Dup", slug: "pub-b", status: "published" }, T); check("dup slug gets suffix", r.s === 201 && r.j.news.slug !== "pub-b");
r = await call("GET", "/news"); check("public list hides draft", r.j.news.every((n) => n.status === "published") && !r.j.news.some((n) => n.slug === "draft-a"));
check("list excludes gallery", r.j.news.every((n) => !("gallery" in n)));
r = await call("GET", "/news?status=draft"); check("public cannot request drafts via status", r.j.news.every((n) => n.status === "published"));
r = await call("GET", "/news?includeDrafts=true"); check("public cannot includeDrafts", !r.j.news.some((n) => n.slug === "draft-a"));
r = await call("GET", "/news?includeDrafts=true", null, T); check("admin includeDrafts", r.j.news.some((n) => n.slug === "draft-a"));
r = await call("GET", "/news/slug/draft-a"); check("public draft by slug 404", r.s === 404);
r = await call("GET", "/news/slug/draft-a", null, T); check("admin draft by slug", r.s === 200);
r = await call("GET", "/news/slug/pub-b"); check("public published by slug", r.s === 200 && r.j.news.views === 1 && r.j.news.gallery?.length === 1);
r = await call("GET", "/news/slug/pub-b"); check("views increment", r.j.news.views === 2);
r = await call("GET", "/news/id/" + pubId); check("by id public published", r.s === 200);
r = await call("GET", "/news?search=hello"); check("search content", r.j.news.some((n) => n.slug === "pub-b"));
r = await call("GET", "/news?search=" + encodeURIComponent("a.*(")); check("regex chars escaped, no crash", r.s === 200);
r = await call("GET", "/news?location=chatkhil"); check("location filter", r.j.news.length >= 1 && r.j.news.every((n) => ["chatkhil", "Chatkhil", "চাটখিল"].includes(n.location)));
r = await call("GET", "/news?limit=2&page=1"); check("pagination", r.j.news.length === 2 && r.j.pagination.total >= 3 && r.j.pagination.pages >= 2);
r = await call("GET", "/news?sort=views&limit=1"); check("sort by views", r.j.news[0].views >= 90);
r = await call("GET", "/news/related/pub-b"); check("related", r.s === 200 && !r.j.related.some((n) => n.slug === "pub-b"));
r = await call("PUT", "/news/" + pubId, { title: "Pub B edited", gallery: ["data:image/jpeg;base64,BBB"], _id: "hack", views: 999999 }, T);
check("edit news", r.s === 200 && r.j.news.title === "Pub B edited" && r.j.news._id === pubId && r.j.news.gallery.length === 2 && r.j.news.views === 2, JSON.stringify(r.j).slice(0, 200));
r = await call("PUT", "/news/" + pubId, { "$set": { x: 1 }, "a.b": 1 }, T); check("operator keys dropped", r.s === 200 && !("a.b" in r.j.news));

// --- comments
r = await call("POST", "/comments/pub-b", { name: "Rahim", content: "Nice" }); check("comment ok", r.s === 201);
r = await call("POST", "/comments/draft-a", { name: "Rahim", content: "Nice" }); check("comment on draft 404", r.s === 404);
r = await call("POST", "/comments/pub-b", { name: "", content: "x" }); check("comment validation", r.s === 400);
r = await call("GET", "/comments/pub-b"); check("comments list", r.j.comments.length === 1 && r.j.comments[0].name === "Rahim");

// --- companies / team / ads visibility
r = await call("POST", "/ads", { title: "AdA", placement: "homepage", status: "active" }, T); check("create ad", r.s === 201);
const adId = r.j.ad._id;
r = await call("POST", "/ads", { title: "AdB", placement: "homepage", status: "inactive" }, T);
r = await call("GET", "/ads?placement=homepage"); check("public ads hide inactive", r.j.ads.length === 1 && r.j.ads[0].title === "AdA");
r = await call("GET", "/ads?placement=sidebar"); check("placement filter", r.j.ads.length === 0);
r = await call("GET", "/ads?includeDrafts=1", null, T); check("admin sees all ads", r.j.ads.length === 2);
r = await call("PUT", "/ads/" + adId, { title: "AdA2" }, T); check("edit ad", r.s === 200 && r.j.ad.title === "AdA2");
r = await call("DELETE", "/ads/" + adId, null, T); check("delete ad", r.s === 200);
r = await call("POST", "/team", { name: "Karim", role: "Editor", active: true }, T); const teamId = r.j.team._id;
r = await call("POST", "/team", { name: "Hidden", role: "X", active: false }, T); const hid = r.j.team._id;
r = await call("GET", "/team"); check("public team hides inactive", r.j.team.length === 1);
r = await call("GET", "/team/" + hid); check("hidden member 404 public", r.s === 404);
r = await call("GET", "/team/" + teamId); check("team single", r.s === 200 && r.j.team.name === "Karim");
r = await call("GET", "/team?includeDrafts=1", null, T); check("admin team all", r.j.team.length === 2);
r = await call("POST", "/companies", { name: "ACME" }, T); check("company create default status", r.j.company.status === "active");

// --- settings
r = await call("GET", "/settings"); check("settings public no counters", r.s === 200 && r.j.settings.contact && !("totalVisitors" in r.j.settings) && !("_id" in r.j.settings));
r = await call("PUT", "/settings", { contact: { phone: "+8801" }, totalVisitors: 5 }, T); check("settings update merges", r.j.settings.contact.phone === "+8801" && r.j.settings.contact.email, JSON.stringify(r.j));

// --- messages
r = await call("POST", "/messages", { name: "A", email: "a@b.c" }); check("message validation", r.s === 400);
r = await call("POST", "/messages", { name: "A", email: "a@b.c", message: "Hi", source: "partnership", role: "admin", readAt: "x" }); check("message ok", r.s === 201 || r.s === 200);
r = await call("GET", "/messages", null, T); check("inbox", r.j.messages.length === 1 && r.j.unread === 1 && r.j.messages[0].readAt === null && !("role" in r.j.messages[0]));
const mid = r.j.messages[0]._id;
r = await call("PATCH", "/messages/" + mid, { read: true }, T); check("mark read", r.j.message.readAt);
r = await call("PATCH", "/messages/" + mid, { reply: "ok", repliedAt: "2026-10-30" }, T); check("reply", r.j.message.reply === "ok");
r = await call("DELETE", "/messages/" + mid, null, T); r = await call("GET", "/messages", null, T); check("delete message", r.j.messages.length === 0);

// --- visitors / stats
await call("POST", "/visitors", { path: "/" }); await call("POST", "/visitors", { path: "/news" });
r = await call("GET", "/dashboard/stats", null, T); check("stats", r.s === 200 && r.j.totalVisitors === 2 && r.j.todayVisitors === 2 && r.j.draftNews >= 1 && r.j.totalNews >= 9, JSON.stringify(r.j));

// --- premium members
r = await call("POST", "/premium/members", { name: "Member One", phone: "01700000000", email: "m@x.com", membershipStatus: "Active", memberId: "NV-9999", status: "Active" });
check("apply: forced Pending + server memberId", r.s === 201 && r.j.member.membershipStatus === "Pending" && r.j.member.memberId === "NV-0001", JSON.stringify(r.j));
r = await call("POST", "/premium/members", { name: "Member Two", phone: "01800000000" }); check("second memberId", r.j.member.memberId === "NV-0002");
r = await call("GET", "/premium/members"); check("public list: pending hidden", r.j.members.length === 0);
r = await call("POST", "/premium/members/NV-0001/news", { title: "T", content: "C" }); check("pending member cannot submit", r.s === 403);
r = await call("PATCH", "/premium/members/NV-0001/approve", {}, T); check("approve", r.j.member.membershipStatus === "Active" && r.j.member.joinDate);
r = await call("GET", "/premium/members"); check("public list shows active, no phone/email", r.j.members.length === 1 && !("phone" in r.j.members[0]) && !("email" in r.j.members[0]), JSON.stringify(r.j));
r = await call("GET", "/premium/members/NV-0001"); check("public profile sanitized", r.s === 200 && !("phone" in r.j.member) && r.j.member.name === "Member One");
r = await call("GET", "/premium/members/NV-0001", null, T); check("admin profile full", r.j.member.phone === "01700000000");
r = await call("POST", "/premium/members/NV-0001/news", { title: "Sub1", content: "C", status: "Approved" }); check("submit forced Pending", r.s === 201 && r.j.submission.status === "Pending" && r.j.remaining === 11);
const subId = r.j.submission._id;
r = await call("GET", "/premium/members/NV-0001"); check("pending submission hidden publicly", r.j.submissions.length === 0);
r = await call("GET", "/premium/news?status=pending", null, T); check("admin sees submission", r.j.submissions.length === 1);
r = await call("PATCH", `/premium/news/${subId}/approve`, {}, T); check("approve submission", r.j.submission.status === "Approved");
r = await call("GET", "/premium/members/NV-0001"); check("approved submission visible", r.j.submissions.length === 1);
r = await call("GET", "/premium/stats", null, T); check("premium stats", r.j.total === 2 && r.j.active === 1 && r.j.pending === 1);
r = await call("PATCH", "/premium/members/NV-0002/reject", {}, T); r = await call("GET", "/premium/members/NV-0002"); check("rejected profile 404 public", r.s === 404);
r = await call("GET", "/premium/members?search=one", null, T); check("admin search", r.j.members.length === 1);
r = await call("DELETE", "/premium/news/" + subId, null, T); check("delete submission", r.s === 200);
r = await call("DELETE", "/premium/members/NV-0001", null, T); check("delete member", r.s === 200);

// --- change password
r = await call("PUT", "/auth/change-password", { currentPassword: "nope", newPassword: "NewPass123!" }, T); check("cp wrong current", r.s === 401);
r = await call("PUT", "/auth/change-password", { currentPassword: PW, newPassword: "short" }, T); check("cp too short", r.s === 400);
await new Promise((x) => setTimeout(x, 1100));
r = await call("PUT", "/auth/change-password", { currentPassword: PW, newPassword: "NewPass123!" }, T); check("cp ok", r.s === 200 && r.j.token);
const T2 = r.j.token;
r = await call("GET", "/auth/me", null, T); check("old token revoked", r.s === 401);
r = await call("GET", "/auth/me", null, T2); check("new token works", r.s === 200);
r = await call("POST", "/auth/login", { email: EMAIL, password: PW }); check("old password rejected", r.s === 401);
r = await call("POST", "/auth/login", { email: EMAIL, password: "NewPass123!" }); check("new password works", r.s === 200);

// --- unknown + rate limit on login
r = await call("GET", "/nope"); check("unknown route 404", r.s === 404);
let last; for (let i = 0; i < 10; i++) last = await call("POST", "/auth/login", { email: EMAIL, password: "bad" + i });
check("login rate limited", last.s === 429, last.s);

// --- editorial staff (admin only, stored in DB)
r = await call("GET", "/staff"); check("staff anon 401", r.s === 401);
r = await call("POST", "/staff", { name: "Rahim", email: "Rahim@Example.com", role: "Moderator", password: "Staff#Pass1" }, T2); check("staff create", r.s === 201 && r.j.member.email === "rahim@example.com" && r.j.member.role === "Moderator");
const staffId = r.j.member._id;
r = await call("POST", "/staff", { name: "Other", email: "rahim@example.com", password: "Staff#Pass1" }, T2); check("staff duplicate email 409", r.s === 409);
r = await call("POST", "/staff", { name: "X", email: "x@example.com", role: "Hacker", password: "Staff#Pass1" }, T2); check("staff bad role normalised", r.s === 201 && r.j.member.role === "News Presenter");
r = await call("PUT", "/staff/" + staffId, { status: "inactive" }, T2); check("staff update", r.s === 200 && r.j.member.status === "inactive" && r.j.member.name === "Rahim");
r = await call("GET", "/staff", null, T2); check("staff list", r.s === 200 && r.j.staff.length === 2);
// staff session must survive admin-only calls (403, not 401 → no auto-logout)
r = await call("PUT", "/staff/" + staffId, { status: "active", permissions: ["news.read"] }, T2);
{ const x = await fetch(B + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "10.9.9.9" }, body: JSON.stringify({ email: "rahim@example.com", password: "Staff#Pass1" }) }); r = { s: x.status, j: await x.json().catch(() => ({})) }; }
check("staff login", r.s === 200 && !!r.j.token, r.s);
const ST = r.j.token;
r = await call("GET", "/dashboard/stats", null, ST); check("staff admin-only -> 403 (not 401)", r.s === 403, r.s);
r = await call("GET", "/auth/me", null, ST); check("staff still logged in after 403", r.s === 200);
// staff can change their own password (no extra logins here: the login rate limit is shared by the whole suite)
r = await call("PUT", "/auth/change-password", { currentPassword: "x", newPassword: "Another#Pass1" }); check("change-password anonymous 401", r.s === 401, r.s);
r = await call("PUT", "/auth/change-password", { currentPassword: "wrong", newPassword: "Another#Pass1" }, ST); check("staff change-password wrong current 401", r.s === 401, r.s);
r = await call("PUT", "/auth/change-password", { currentPassword: "Staff#Pass1", newPassword: "short" }, ST); check("staff change-password too short 400", r.s === 400, r.s);
r = await call("PUT", "/auth/change-password", { currentPassword: "Staff#Pass1", newPassword: "Another#Pass1" }, ST);
check("staff change-password ok + fresh token", r.s === 200 && !!r.j.token, r.s);
const ST2 = r.j.token;
r = await call("GET", "/auth/me", null, ST2); check("fresh staff token works", r.s === 200 && r.j.user.role === "staff", r.s);
r = await call("PUT", "/auth/change-password", { currentPassword: "Staff#Pass1", newPassword: "Third#Pass123" }, ST2); check("old staff password is no longer the current one", r.s === 401, r.s);
r = await call("DELETE", "/staff/" + staffId, null, T2); check("staff delete", r.s === 200);

// --- election applications (public submit, admin review)
const good = { name: "মো. করিম", phone: "01712-345678", upazila: "সদর", union: "একলাশপুর", bio: "সংক্ষিপ্ত জীবনী", accuracy: "true", publication: "true", terms: "true", affiliation: "party", party: "XYZ", photo: "data:image/jpeg;base64,AAAA" };
r = await call("POST", "/election/applications", { ...good, terms: "false" }); check("election needs consent", r.s === 400);
r = await call("POST", "/election/applications", { ...good, phone: "123" }); check("election bad phone", r.s === 400);
r = await call("POST", "/election/applications", { ...good, bio: "" }); check("election needs bio", r.s === 400);
r = await call("POST", "/election/applications", good); check("election submit", r.s === 201 && r.j.ref === "NV-E-0001", JSON.stringify(r.j));
const appId = (await call("GET", "/election/applications", null, T2)).j.applications[0]._id;
r = await call("POST", "/election/applications", { ...good, photo: "javascript:alert(1)" }); check("election second ref", r.s === 201 && r.j.ref === "NV-E-0002");
r = await call("GET", "/election/applications"); check("election list anon 401", r.s === 401);
r = await call("GET", "/election/applications", null, T2); check("election list hides heavy fields", r.s === 200 && r.j.applications.length === 2 && r.j.applications.every((a) => !("photo" in a) && !("bio" in a)));
r = await call("GET", "/election/applications/" + appId, null, T2); check("election detail has bio + photo", r.s === 200 && r.j.application.bio && r.j.application.photo.startsWith("data:image/") && r.j.application.phone === "01712345678");
r = await call("GET", "/election/applications/" + appId); check("election detail anon 401", r.s === 401);
r = await call("PATCH", "/election/applications/" + appId, { status: "hacked" }, T2); check("election bad status 400", r.s === 400);
r = await call("PATCH", "/election/applications/" + appId, { status: "অনুমোদিত", note: "ok" }, T2); check("election approve", r.s === 200 && r.j.application.status === "অনুমোদিত" && r.j.application.note === "ok");
r = await call("DELETE", "/election/applications/" + appId, null, T2); check("election delete", r.s === 200);

// --- premium member profile is public only after approval
r = await call("POST", "/premium/members", { name: "Pending Person", phone: "01900000000" }); check("member register", r.s === 201);
const memId = r.j.member.memberId;
r = await call("GET", "/premium/members/" + memId); check("pending profile hidden from public", r.s === 404);
r = await call("PATCH", "/premium/members/" + memId + "/approve", {}, T2); check("approve member", r.s === 200);
r = await call("GET", "/premium/members/" + memId); check("active profile public, no phone", r.s === 200 && !("phone" in r.j.member));

// --- big images are served as cacheable /api/media URLs (keeps list responses small)
const ORIGIN = "http://localhost:3001";
const bigImg = "data:image/jpeg;base64," + "QUJD".repeat(3000);
r = await call("POST", "/news", { title: "Img news", slug: "img-news", content: "c", status: "published", image: bigImg }, T2);
check("create news with big image", r.s === 201);
const imgId = r.j.news._id;
r = await call("GET", "/news"); const imgNews = r.j.news.find((n) => n.slug === "img-news");
check("list returns media url, not base64", imgNews && imgNews.image.startsWith("/api/media/news/" + imgId + "/image?v="), imgNews?.image?.slice(0, 60));
check("list payload stays small", JSON.stringify(r.j).length < 20000, JSON.stringify(r.j).length);
let mr = await fetch(ORIGIN + imgNews.image);
check("media serves image bytes", mr.status === 200 && mr.headers.get("content-type") === "image/jpeg" && (await mr.arrayBuffer()).byteLength === 9000);
check("media sandboxed + cacheable", /immutable/.test(mr.headers.get("cache-control") || "") && /sandbox/.test(mr.headers.get("content-security-policy") || ""));
r = await call("GET", "/news/slug/img-news"); check("detail also uses media url", r.j.news.image.startsWith("/api/media/news/"));
r = await call("PUT", "/news/" + imgId, { title: "Img news edited", image: imgNews.image }, T2); check("editor sending media url back is accepted", r.s === 200 && r.j.news.title === "Img news edited");
mr = await fetch(ORIGIN + imgNews.image); check("stored image survives that update", mr.status === 200 && (await mr.arrayBuffer()).byteLength === 9000);
r = await call("POST", "/news", { title: "Svg", slug: "svg-news", status: "published", image: "data:image/svg+xml;base64," + "QUJD".repeat(3000) }, T2);
const svgUrl = (await call("GET", "/news")).j.news.find((n) => n.slug === "svg-news").image;
mr = await fetch(ORIGIN + svgUrl); check("svg is never served from our origin", mr.status === 404);
mr = await fetch(ORIGIN + "/api/media/news/" + imgId + "/..%2Fsecret"); check("media rejects odd field names", mr.status === 404);
mr = await fetch(ORIGIN + "/api/media/settings/site/image"); check("media only for whitelisted collections", mr.status === 404);
r = await call("POST", "/premium/members", { name: "Photo Person", phone: "01800000000", photo: bigImg, paymentScreenshot: bigImg });
const pm = r.j.member;
mr = await fetch(ORIGIN + "/api/media/members/" + pm._id + "/photo"); check("pending member photo not public", mr.status === 404);
await call("PATCH", "/premium/members/" + pm.memberId + "/approve", {}, T2);
r = await call("GET", "/premium/members"); const pub = r.j.members.find((x) => x.memberId === pm.memberId);
check("public member list: photo url, no screenshot", pub && pub.photo.startsWith("/api/media/members/") && !("paymentScreenshot" in pub) && !("phone" in pub));
mr = await fetch(ORIGIN + "/api/media/members/" + pm._id + "/photo"); check("active member photo public", mr.status === 200);
mr = await fetch(ORIGIN + "/api/media/members/" + pm._id + "/paymentScreenshot"); check("payment screenshot never public", mr.status === 404);
r = await call("GET", "/premium/members/" + pm.memberId, null, T2); check("admin still gets full screenshot", r.j.member.paymentScreenshot === bigImg);

// --- careers
for (const [m, pth] of [["POST", "/careers"], ["PUT", "/careers/page"], ["GET", "/careers/applications"], ["DELETE", "/careers/x"], ["PATCH", "/careers/applications/x"]]) {
  r = await call(m, pth, {}); check(`anon ${m} ${pth} -> 401`, r.s === 401, r.s);
}
r = await call("GET", "/careers"); check("careers public default page, no jobs", r.s === 200 && Array.isArray(r.j.jobs) && r.j.page.heroTitle && r.j.page.whyCards.length >= 1);
r = await call("POST", "/careers", { title: "" }, T2); check("job needs title", r.s === 400);
r = await call("POST", "/careers", { title: "R&D Executive", type: "Full-time", mode: "Office", salary: "30,000 - 35,000 BDT", status: "hiring", doing: "A\nB\n\nC", looking: ["X", "Y"], applyUrl: "javascript:alert(1)", _id: "hack" }, T2);
check("create job", r.s === 201 && r.j.job._id !== "hack" && r.j.job.doing.length === 3 && r.j.job.applyUrl === "", JSON.stringify(r.j).slice(0, 200));
const c_job1 = r.j.job;
r = await call("POST", "/careers", { title: "Soon Role", status: "opening-soon", type: "Bogus", mode: "Nope" }, T2); check("bad enums fall back", r.s === 201 && r.j.job.type === "Full-time" && r.j.job.mode === "Office");
const c_job2 = r.j.job;
r = await call("POST", "/careers", { title: "Hidden Role", published: false }, T2); const c_job3 = r.j.job;
r = await call("GET", "/careers"); check("public hides unpublished", r.j.jobs.length === 2 && !r.j.jobs.some((j) => j._id === c_job3._id));
r = await call("GET", "/careers?includeDrafts=1"); check("public cannot see unpublished via includeDrafts", !r.j.jobs.some((j) => j._id === c_job3._id));
r = await call("GET", "/careers?includeDrafts=1", null, T2); check("admin sees unpublished", r.j.jobs.some((j) => j._id === c_job3._id));
r = await call("PUT", "/careers/" + c_job2._id, { title: "Soon Role 2", status: "hiring" }, T2); check("edit job keeps other fields", r.s === 200 && r.j.job.title === "Soon Role 2" && r.j.job.status === "hiring");
r = await call("PUT", "/careers/" + c_job2._id, { status: "opening-soon" }, T2);
// apply
const careerApp = { name: "Rahim", email: "Rahim@Example.com", phone: "01712345678", resumeUrl: "https://drive.example.com/cv", coverLetter: "hello" };
r = await call("POST", `/careers/${c_job2._id}/apply`, careerApp); check("cannot apply to non-hiring job", r.s === 400);
r = await call("POST", `/careers/${c_job3._id}/apply`, careerApp); check("cannot apply to unpublished job", r.s === 404);
r = await call("POST", `/careers/nope/apply`, careerApp); check("apply unknown job 404", r.s === 404);
r = await call("POST", `/careers/${c_job1._id}/apply`, { ...careerApp, name: "" }); check("apply needs name", r.s === 400);
r = await call("POST", `/careers/${c_job1._id}/apply`, { ...careerApp, email: "bad" }); check("apply needs valid email", r.s === 400);
r = await call("POST", `/careers/${c_job1._id}/apply`, { ...careerApp, phone: "12" }); check("apply needs phone", r.s === 400);
r = await call("POST", `/careers/${c_job1._id}/apply`, { ...careerApp, resumeUrl: "javascript:alert(1)" }); check("apply rejects non-http resume url", r.s === 400);
r = await call("POST", `/careers/${c_job1._id}/apply`, { name: "N", email: "n@e.com", phone: "01712345678" }); check("apply needs resume or intro", r.s === 400);
r = await call("POST", `/careers/${c_job1._id}/apply`, careerApp); check("apply ok", r.s === 201 && /^NV-C-\d{4}$/.test(r.j.ref), JSON.stringify(r.j));
const c_appRef = r.j.ref;
r = await call("POST", `/careers/${c_job1._id}/apply`, careerApp); check("duplicate apply 409", r.s === 409);
r = await call("POST", `/careers/${c_job1._id}/apply`, { ...careerApp, email: "bot@e.com", website: "spam" }); check("honeypot silently ok", r.s === 201);
r = await call("GET", "/careers/applications", null, T2); check("admin lists applications", r.s === 200 && r.j.applications.length === 1 && r.j.applications[0].ref === c_appRef && r.j.applications[0].email === "rahim@example.com" && r.j.newCount === 1, JSON.stringify(r.j).slice(0, 200));
const c_appId = r.j.applications[0]._id;
r = await call("GET", "/careers/applications?jobId=" + c_job2._id, null, T2); check("filter applications by job", r.j.applications.length === 0);
r = await call("PATCH", "/careers/applications/" + c_appId, { status: "bogus" }, T2); check("bad application status 400", r.s === 400);
r = await call("PATCH", "/careers/applications/" + c_appId, { status: "শর্টলিস্টেড", note: "careerApp fit" }, T2); check("update application", r.s === 200 && r.j.application.status === "শর্টলিস্টেড" && r.j.application.note === "careerApp fit");
r = await call("GET", "/careers/applications", null, T2); check("newCount drops", r.j.newCount === 0);
// page content
r = await call("PUT", "/careers/page", { heroTitle: "Work with us", contactEmail: "jobs@noakhalivision.com", whyCards: [{ title: "A", text: "a" }, { title: "" }], _id: "x" }, T2);
check("edit page content", r.s === 200 && r.j.page.heroTitle === "Work with us" && r.j.page.contactEmail === "jobs@noakhalivision.com" && r.j.page.whyCards.length === 1);
r = await call("GET", "/careers"); check("public sees edited page, other defaults kept", r.j.page.heroTitle === "Work with us" && r.j.page.ctaTitle && r.j.page.contactEmail === "jobs@noakhalivision.com");
r = await call("GET", "/settings"); check("careers page not leaked into site settings", !("heroTitle" in r.j.settings));
r = await call("DELETE", "/careers/applications/" + c_appId, null, T2); check("delete application", r.s === 200);
r = await call("DELETE", "/careers/" + c_job3._id, null, T2); check("delete job", r.s === 200);
r = await call("PUT", "/careers/" + c_job2._id, { status: "closed" }, T2); r = await call("GET", "/careers"); check("hiring jobs sorted before closed", r.j.jobs[0].status === "hiring" && r.j.jobs[r.j.jobs.length - 1].status === "closed");
r = await call("GET", "/careers"); check("deleted job gone", r.j.jobs.length === 2);

// --- rich text news body + inline images
{
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  let rr = await call("POST", "/news-media", { image: PNG });
  check("inline image upload needs login", rr.s === 401, rr.s);
  rr = await call("POST", "/news-media", { image: "data:text/html;base64,PHNjcmlwdD4=" }, T2);
  check("inline image rejects non-image", rr.s === 400, rr.s);
  rr = await call("POST", "/news-media", { image: "javascript:alert(1)" }, T2);
  check("inline image rejects junk", rr.s === 400, rr.s);
  rr = await call("POST", "/news-media", { image: PNG }, T2);
  check("inline image upload ok", rr.s === 201 && /^\/api\/media\/newsImages\/.+\/image\?v=/.test(rr.j.url || ""), JSON.stringify(rr.j));
  const imgUrl = rr.j.url;
  const mediaRes = await fetch("http://localhost:3001" + imgUrl);
  check("inline image is publicly served as image", mediaRes.status === 200 && /^image\/png/.test(mediaRes.headers.get("content-type") || ""), mediaRes.status);

  const dirty = `<p>Hello <b>bold</b> and <i>italic</i></p><script>alert(1)</script><p onclick="x()">click</p><a href="javascript:alert(1)">bad</a><img src="${imgUrl}" onerror="alert(1)"><img src="data:image/png;base64,AAAA"><iframe src="https://evil.example"></iframe>`;
  rr = await call("POST", "/news", { title: "Rich", slug: "rich-text-news", content: dirty, status: "published", category: "স্থানীয়" }, T2);
  check("rich news created", rr.s === 201, rr.s);
  const saved = rr.j.news.content;
  check("rich: bold/italic kept", saved.includes("<strong>bold</strong>") && saved.includes("<em>italic</em>"), saved);
  check("rich: script removed", !/script|alert\(1\)\s*<\/|onclick|onerror|iframe|javascript:/i.test(saved.replace(/<img[^>]*>/g, "")), saved);
  check("rich: own image kept, data: image dropped", saved.includes(`src="${imgUrl}"`) && !saved.includes("data:image"), saved);
  rr = await call("PUT", "/news/" + rr.j.news._id, { content: "<h2>Title</h2><p>x <u>u</u></p><div onmouseover=1>d</div>" }, T2);
  check("rich: edit sanitizes too", rr.s === 200 && rr.j.news.content === "<h2>Title</h2><p>x <u>u</u></p><p>d</p>", rr.j.news?.content);
  rr = await call("POST", "/news", { title: "Plain", slug: "plain-old-news", content: "পুরোনো সাদা লেখা\n\nদ্বিতীয় অনুচ্ছেদ a < b", status: "published", category: "স্থানীয়" }, T2);
  check("plain-text news stays plain", rr.s === 201 && rr.j.news.content === "পুরোনো সাদা লেখা\n\nদ্বিতীয় অনুচ্ছেদ a < b", rr.j.news?.content);
}

// --- navbar menu items + designed website sections
{
  let rr = await call("GET", "/nav-items"); check("nav-items public list ok", rr.s === 200 && Array.isArray(rr.j.navItems), rr.s);
  rr = await call("POST", "/nav-items", { labelBn: "মতামত", type: "category", target: "মতামত" }); check("nav-items create needs login", rr.s === 401, rr.s);
  rr = await call("POST", "/nav-items", { type: "category", target: "x" }, T2); check("nav-items needs a label", rr.s === 400, rr.s);
  rr = await call("POST", "/nav-items", { labelBn: "x", type: "link", target: "javascript:alert(1)" }, T2); check("nav-items rejects javascript: link", rr.s === 400, rr.s);
  rr = await call("POST", "/nav-items", { labelBn: "মতামত", labelEn: "Opinion", type: "category", target: "স্থানীয়", order: 5, badge: true, badgeDays: 9999 }, T2);
  check("nav-items create", rr.s === 201 && rr.j.item.badgeDays === 90 && rr.j.item.order === 5 && rr.j.item.visible === true, JSON.stringify(rr.j));
  const nid = rr.j.item._id;
  rr = await call("POST", "/nav-items", { labelEn: "Hidden", type: "page", target: "/team", visible: false, order: 1 }, T2);
  const hid = rr.j.item._id;
  rr = await call("GET", "/nav-items"); check("nav-items public hides hidden ones", rr.j.navItems.some((x) => x._id === nid) && !rr.j.navItems.some((x) => x._id === hid));
  rr = await call("GET", "/nav-items?all=1", null, T2); check("nav-items admin sees hidden, sorted by order", rr.j.navItems.some((x) => x._id === hid) && rr.j.navItems[0]._id === hid);
  rr = await call("PUT", "/nav-items/" + nid, { visible: false }, T2); check("nav-items partial update keeps label", rr.s === 200 && rr.j.item.visible === false && rr.j.item.labelBn === "মতামত", JSON.stringify(rr.j));
  rr = await call("DELETE", "/nav-items/" + nid, null, T2); check("nav-items delete", rr.s === 200);
  await call("DELETE", "/nav-items/" + hid, null, T2);

  rr = await call("POST", "/sections", { title: "x" }); check("sections create needs login", rr.s === 401, rr.s);
  rr = await call("POST", "/sections", {}, T2); check("sections need a title", rr.s === 400, rr.s);
  rr = await call("POST", "/sections", { title: "x", source: "category" }, T2); check("category source needs a category", rr.s === 400, rr.s);
  rr = await call("POST", "/sections", { title: "সম্পাদকীয়", titleEn: "Editorial", source: "category", category: "স্থানীয়", count: 99, layout: "evil", bg: "red;background:url(x)", accent: "#55B52E", cardStyle: "overlay" }, T2);
  check("sections create clamps/validates design fields", rr.s === 201 && rr.j.item.count === 12 && rr.j.item.layout === "grid4" && rr.j.item.bg === "#f4f6f8" && rr.j.item.accent === "#55B52E" && rr.j.item.cardStyle === "overlay", JSON.stringify(rr.j));
  const sid = rr.j.item._id;
  rr = await call("GET", "/sections"); check("sections public list shows it", rr.s === 200 && rr.j.sections.some((x) => x._id === sid));
  rr = await call("PUT", "/sections/" + sid, { layout: "featured", visible: false }, T2); check("sections update", rr.s === 200 && rr.j.item.layout === "featured" && rr.j.item.title === "সম্পাদকীয়", JSON.stringify(rr.j));
  rr = await call("GET", "/sections"); check("hidden section not public", !rr.j.sections.some((x) => x._id === sid));
  rr = await call("DELETE", "/sections/" + sid, null, T2); check("sections delete", rr.s === 200);
}

// --- admin panel fixes: gallery removal, staff password, built-in categories, ad links
{
  let rr;
  // gallery pictures can be removed by index while new ones are still appended
  rr = await call("POST", "/news", { title: "Gallery Test", slug: "gallery-test", content: "x", status: "draft", gallery: ["data:image/jpeg;base64,AAA", "data:image/jpeg;base64,BBB", "data:image/jpeg;base64,CCC"] }, T2);
  check("gallery test create", rr.s === 201 && rr.j.news.gallery.length === 3, rr.s);
  const gid = rr.j.news._id;
  rr = await call("PUT", "/news/" + gid, { galleryRemove: "[1]" }, T2);
  check("gallery remove one by index", rr.s === 200 && rr.j.news.gallery.join("|") === "data:image/jpeg;base64,AAA|data:image/jpeg;base64,CCC" && !("galleryRemove" in rr.j.news), JSON.stringify(rr.j).slice(0, 200));
  rr = await call("PUT", "/news/" + gid, { galleryRemove: "[0]", gallery: ["data:image/jpeg;base64,DDD"] }, T2);
  check("gallery remove + add in one save", rr.s === 200 && rr.j.news.gallery.join("|") === "data:image/jpeg;base64,CCC|data:image/jpeg;base64,DDD", JSON.stringify(rr.j.news.gallery));
  rr = await call("PUT", "/news/" + gid, { galleryRemove: "not-json" }, T2);
  check("bad galleryRemove ignored", rr.s === 200 && rr.j.news.gallery.length === 2 && !("galleryRemove" in rr.j.news), rr.s);
  rr = await call("PUT", "/news/" + gid, { title: "Gallery Test 2" }, T2);
  check("editing without gallery fields keeps pictures", rr.s === 200 && rr.j.news.gallery.length === 2, rr.s);

  // built-in categories stay in the list after the first custom category is added
  rr = await call("GET", "/categories"); check("public categories: built-in defaults", rr.s === 200 && rr.j.categories.length === 4, rr.s);
  rr = await call("GET", "/categories", null, T2); check("admin categories: defaults stored", rr.s === 200 && rr.j.categories.length === 4 && rr.j.categories.some((c) => c.name === "স্থানীয়"), JSON.stringify(rr.j).slice(0, 200));
  rr = await call("POST", "/categories", { name: "মতামত", slug: "opinion" }, T2); check("category create", rr.s === 201, rr.s);
  rr = await call("GET", "/categories"); check("defaults still there after adding a category", rr.s === 200 && rr.j.categories.length === 5 && rr.j.categories.some((c) => c.name === "স্থানীয়") && rr.j.categories.some((c) => c.name === "মতামত"), JSON.stringify(rr.j.categories.map((c) => c.name)));
  rr = await call("DELETE", "/categories/local", null, T2); check("category in use cannot be deleted", rr.s === 409, rr.s);
  rr = await call("DELETE", "/categories/sports", null, T2); check("unused built-in category can be deleted", rr.s === 200, rr.s);
  rr = await call("GET", "/categories"); check("deleted default does not come back", rr.s === 200 && rr.j.categories.length === 4 && !rr.j.categories.some((c) => c.slug === "sports"), JSON.stringify(rr.j.categories.map((c) => c.name)));

  // ad links are rendered as href on the public site: only http(s) and site paths
  rr = await call("POST", "/ads", { title: "Bad link", link: "javascript:alert(1)", placement: "homepage", status: "active" }, T2); check("ad javascript: link rejected", rr.s === 400, rr.s);
  rr = await call("POST", "/ads", { title: "Good link", link: "https://example.com/offer", placement: "homepage", status: "active" }, T2); check("ad https link ok", rr.s === 201, rr.s);
  const goodAd = rr.j.ad?._id;
  rr = await call("PUT", "/ads/" + goodAd, { link: "data:text/html,x" }, T2); check("ad update with bad link rejected", rr.s === 400, rr.s);
  rr = await call("PUT", "/ads/" + goodAd, { link: "/premium-member" }, T2); check("ad site-path link ok", rr.s === 200 && rr.j.ad.link === "/premium-member", rr.s);
  rr = await call("DELETE", "/ads/" + goodAd, null, T2);
}

// --- session revocation, comment spam guards
{
  const T9 = T2; let rr;
  rr = await call("GET", "/auth/me", null, T9); check("fresh token works", rr.s === 200);
  rr = await call("POST", "/auth/logout", {}, T9); check("logout ok", rr.s === 200);
  rr = await call("GET", "/auth/me", null, T9); check("token is dead after logout", rr.s === 401, rr.s);
  rr = await call("POST", "/comments/pub-b", { name: "Spam", content: "a http://x.com b http://y.com c http://z.com" }); check("comment with 3 links rejected", rr.s === 400, rr.s);
  rr = await call("POST", "/comments/pub-b", { name: "Karim", content: "Unique one" }); check("comment unique ok", rr.s === 201, rr.s);
  rr = await call("POST", "/comments/pub-b", { name: "Karim", content: "Unique one" }); check("duplicate comment rejected", rr.s === 409, rr.s);
}

console.log(`\n${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
