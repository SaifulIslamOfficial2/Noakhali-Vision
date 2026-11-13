// One-time: writes an AI summary for every story that has none yet (needs GEMINI_API_KEY or OPENAI_API_KEY in .env.local).
//   npm run backfill:summaries -- --dry-run     (only counts)
//   npm run backfill:summaries                  (does it; add --limit=20 to try a few first)
// Safe to run again: it only touches stories whose Summary is still empty. Stories are never rewritten otherwise.
import { MongoClient } from "mongodb";
import { generateSummary, aiOn } from "../api/_lib/ai.js";

const DRY = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Math.max(1, parseInt(limitArg.split("=")[1], 10) || 0) : Infinity;

if (!process.env.MONGODB_URI) { console.error("MONGODB_URI missing (.env.local)"); process.exit(1); }
if (!aiOn()) { console.error("GEMINI_API_KEY (or OPENAI_API_KEY) missing in .env.local"); process.exit(1); }

const client = await new MongoClient(process.env.MONGODB_URI).connect();
const db = client.db(process.env.MONGODB_DB || "noakhali_vision");
const rows = await db.collection("news").find({ $or: [{ summary: { $exists: false } }, { summary: "" }, { summary: null }] }, { projection: { title: 1, content: 1 } }).sort({ createdAt: -1 }).toArray();
console.log(`${rows.length} stor${rows.length === 1 ? "y has" : "ies have"} no summary.`);
let done = 0, failed = 0;
for (const r of rows) {
  if (done + failed >= LIMIT) break;
  if (DRY) { done++; continue; }
  const s = await generateSummary(r.content, { timeoutMs: 20000 });
  if (!s) { failed++; console.error(`  skipped (no text or AI error): ${r.title}`); continue; }
  await db.collection("news").updateOne({ _id: r._id }, { $set: { summary: s, summaryAi: true } });
  done++; console.log(`  ✓ ${r.title}`);
}
console.log(`\n${DRY ? "DRY RUN — nothing changed. Would write" : "Written"}: ${done}, skipped: ${failed}.`);
await client.close();
