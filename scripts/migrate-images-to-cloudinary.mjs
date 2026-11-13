// One-time migration: moves base64 images out of MongoDB into Cloudinary.
//
//   npm run migrate:images -- --dry-run     (only reports what would happen)
//   npm run migrate:images                  (does it)
//
// Needs .env.local with MONGODB_URI, (MONGODB_DB) and the three CLOUDINARY_* variables.
// Take an Atlas backup/snapshot first. Safe to run again: it only touches values that are still base64.
import { MongoClient } from "mongodb";
import { uploadImage, isBigDataImage, isCloudinaryUrl, cloudinaryOn } from "../api/_lib/cloudinary.js";

const DRY = process.argv.includes("--dry-run");
// Member / premium / election / careers pictures are NOT moved: they are private or approval-gated.
const TARGETS = [
  ["news", "noakhali-vision/news"],
  ["companies", "noakhali-vision/companies"],
  ["team", "noakhali-vision/team"],
  ["ads", "noakhali-vision/ads"],
];

if (!process.env.MONGODB_URI) { console.error("MONGODB_URI missing (.env.local)"); process.exit(1); }
if (!cloudinaryOn()) { console.error("CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET missing (.env.local)"); process.exit(1); }

const client = await new MongoClient(process.env.MONGODB_URI).connect();
const db = client.db(process.env.MONGODB_DB || "noakhali_vision");
const stat = { uploaded: 0, failed: 0, bytes: 0, docs: 0 };

async function pool(items, size, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => { while (i < items.length) { const item = items[i++]; await fn(item); } }));
}
async function move(v, folder) {
  stat.bytes += v.length;
  if (DRY) { stat.uploaded++; return v; }
  try { const u = await uploadImage(v, folder); stat.uploaded++; return u; }
  catch (e) { stat.failed++; console.error("  upload failed:", e.message); return v; }
}

// 1) pictures placed inside story bodies (newsImages) -> rewrite the references in news.content
const urlOf = new Map();
{
  const rows = await db.collection("newsImages").find({}).toArray();
  const todo = rows.filter((r) => isBigDataImage(r.image));
  console.log(`newsImages: ${todo.length} to move (of ${rows.length})`);
  await pool(todo, 3, async (r) => {
    const u = await move(r.image, "noakhali-vision/news-body");
    if (u !== r.image) {
      urlOf.set(r._id, u);
      await db.collection("newsImages").updateOne({ _id: r._id }, { $set: { image: u } }); // /api/media/newsImages/<id> now redirects
    }
  });
  if (urlOf.size) {
    const stories = await db.collection("news").find({ content: { $regex: "/api/media/newsImages/" } }, { projection: { content: 1 } }).toArray();
    for (const s of stories) {
      let html = String(s.content || ""), changed = false;
      html = html.replace(/\/api\/media\/newsImages\/([A-Za-z0-9_-]+)\/image(?:\?[^"'\s<>]*)?/g, (all, id) => { const u = urlOf.get(id); if (u) { changed = true; return u; } return all; });
      if (changed) { await db.collection("news").updateOne({ _id: s._id }, { $set: { content: html } }); console.log(`  rewrote body images in news ${s._id}`); }
    }
  }
}

// 2) top-level image fields (and arrays of images) of the public collections
for (const [name, folder] of TARGETS) {
  const rows = await db.collection(name).find({}).toArray();
  let moved = 0;
  await pool(rows, 3, async (doc) => {
    const set = {};
    for (const [k, v] of Object.entries(doc)) {
      if (isBigDataImage(v)) { const u = await move(v, folder); if (u !== v) set[k] = u; }
      else if (Array.isArray(v) && v.some(isBigDataImage)) {
        const arr = []; for (const x of v) arr.push(isBigDataImage(x) ? await move(x, folder) : x);
        if (arr.some((x, i) => x !== v[i])) set[k] = arr;
      }
    }
    if (Object.keys(set).length) {
      moved++; stat.docs++;
      if (!DRY) await db.collection(name).updateOne({ _id: doc._id }, { $set: set });
    }
  });
  console.log(`${name}: ${moved} document(s) ${DRY ? "would be " : ""}updated (of ${rows.length})`);
}

console.log(`\n${DRY ? "DRY RUN — nothing changed. " : ""}Images ${DRY ? "to move" : "moved"}: ${stat.uploaded}, failed: ${stat.failed}, ~${(stat.bytes / 1048576).toFixed(1)} MB of base64 text.`);
if (!DRY) console.log("Atlas may take a while (or a compact) before the used-storage number drops.");
await client.close();
