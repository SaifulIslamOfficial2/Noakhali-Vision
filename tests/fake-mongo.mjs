// Minimal in-memory stand-in for the MongoDB driver surface used by api/_lib/routes.js (tests only).
const get = (o, k) => o?.[k];
function match(doc, f) {
  for (const [k, cond] of Object.entries(f || {})) {
    if (k === "$or") { if (!cond.some((c) => match(doc, c))) return false; continue; }
    const v = get(doc, k);
    if (cond && typeof cond === "object" && !(cond instanceof Date) && !Array.isArray(cond)) {
      for (const [op, arg] of Object.entries(cond)) {
        if (op === "$in") { if (!arg.includes(v)) return false; }
        else if (op === "$ne") { if (v === arg) return false; }
        else if (op === "$gte") { if (!(v >= arg)) return false; }
        else if (op === "$regex") { if (!new RegExp(arg, cond.$options || "").test(String(v ?? ""))) return false; }
        else if (op === "$options") { /* handled with $regex */ }
        else throw new Error("fake-mongo: unsupported operator " + op);
      }
    } else if (v !== cond) return false;
  }
  return true;
}
const project = (d, p) => {
  if (!p) return { ...d };
  const keys = Object.keys(p);
  if (keys.every((k) => p[k] === 0)) { const o = { ...d }; keys.forEach((k) => delete o[k]); return o; }
  const o = { _id: d._id }; keys.forEach((k) => { if (p[k]) o[k] = d[k]; }); return o;
};
function applyUpdate(doc, u) {
  for (const [k, v] of Object.entries(u.$set || {})) doc[k] = v;
  for (const [k, v] of Object.entries(u.$inc || {})) doc[k] = (doc[k] || 0) + v;
}
class Cursor {
  constructor(rows, p) { this.rows = rows; this.p = p; }
  sort(s) { const ks = Object.entries(s); this.rows.sort((a, b) => { for (const [k, d] of ks) { if (a[k] < b[k]) return -d; if (a[k] > b[k]) return d; } return 0; }); return this; }
  skip(n) { this.rows = this.rows.slice(n); return this; }
  limit(n) { this.rows = this.rows.slice(0, n); return this; }
  async toArray() { return this.rows.map((d) => project(d, this.p)); }
}
class Col {
  constructor() { this.docs = []; }
  async findOne(f) { const d = this.docs.find((x) => match(x, f)); return d ? { ...d } : null; }
  find(f, o = {}) { return new Cursor(this.docs.filter((x) => match(x, f)).map((d) => ({ ...d })), o.projection); }
  async countDocuments(f) { return this.docs.filter((x) => match(x, f)).length; }
  async insertOne(d) { if (this.docs.some((x) => x._id === d._id)) throw new Error("E11000 dup"); this.docs.push({ ...d }); return { insertedId: d._id }; }
  async insertMany(ds) { for (const d of ds) await this.insertOne(d); }
  async updateOne(f, u, o = {}) {
    let d = this.docs.find((x) => match(x, f));
    if (!d && o.upsert) { d = { ...(f._id !== undefined ? { _id: f._id } : {}), ...(u.$setOnInsert || {}) }; this.docs.push(d); }
    if (d) applyUpdate(d, u);
    return { matchedCount: d ? 1 : 0 };
  }
  async findOneAndUpdate(f, u, o = {}) {
    let d = this.docs.find((x) => match(x, f));
    if (!d && o.upsert) { d = { ...(f._id !== undefined ? { _id: f._id } : {}) }; this.docs.push(d); }
    if (!d) return null;
    applyUpdate(d, u);
    return { ...d };
  }
  async deleteOne(f) { const i = this.docs.findIndex((x) => match(x, f)); if (i >= 0) this.docs.splice(i, 1); }
  async deleteMany(f) { this.docs = this.docs.filter((x) => !match(x, f)); }
  async createIndex() {}
}
export class FakeDb {
  constructor() { this.cols = {}; }
  collection(n) { return (this.cols[n] ||= new Col()); }
}
