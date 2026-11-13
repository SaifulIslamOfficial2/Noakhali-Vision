import { MongoClient } from "mongodb";

let injected = null;
/** Tests / local tooling can inject a database (anything with .collection()). */
export function setDb(db) { injected = db; }

const cache = (globalThis.__nvMongo ||= { promise: null });

export async function getDb() {
  if (injected) return injected;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const e = new Error("MONGODB_URI সেট করা নেই (Vercel → Settings → Environment Variables)।");
    e.status = 500;
    throw e;
  }
  if (!cache.promise) {
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
    cache.promise = client.connect().then(() => client).catch((err) => { cache.promise = null; throw err; });
  }
  const client = await cache.promise;
  return client.db(process.env.MONGODB_DB || "noakhali_vision");
}
