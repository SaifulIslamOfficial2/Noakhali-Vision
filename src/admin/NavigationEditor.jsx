import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Shell from "./Shell";
import api from "../utils/api";
import { categories as builtIn } from "../utils/data";

const PAGES = [
  ["/news", "সব সংবাদ (News)"], ["/team", "টিম (Team)"], ["/about", "আমাদের সম্পর্কে (About)"], ["/careers", "ক্যারিয়ার (Careers)"],
  ["/company", "কোম্পানি (Company)"], ["/partnership", "পার্টনারশিপ (Partnership)"], ["/premium-member", "প্রিমিয়াম মেম্বার"],
  ["/premium-members", "প্রিমিয়াম মেম্বার তালিকা"], ["/election-spotlight", "নির্বাচনী স্পটলাইট"],
];
const blank = { labelBn: "", labelEn: "", type: "category", target: "", order: 50, visible: true, badge: true, badgeDays: 14 };
const inp = "border border-border px-3 py-2.5 w-full focus:outline-none focus:border-primary bg-white";
const Field = ({ label, hint, children }) => (
  <div><label className="mb-1 block text-xs font-bold uppercase text-gray-500">{label}</label>{children}{hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}</div>
);

export default function NavigationEditor() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try { const r = await api.get("/nav-items?all=1"); setItems(r.data.navItems || []); } catch { setError("মেনু লোড করা যায়নি।"); }
  }, []);
  useEffect(() => {
    load();
    api.get("/categories").then((r) => setCats((r.data.categories || []).map((c) => c.name))).catch(() => {});
  }, [load]);

  const catNames = [...new Set([...builtIn.filter((c) => c.en !== "all").map((c) => c.en), ...cats])];

  async function save(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (editing) await api.put(`/nav-items/${encodeURIComponent(editing)}`, form); else await api.post("/nav-items", form);
      setForm(blank); setEditing(""); await load();
    } catch (err) { setError(err.response?.data?.message || "সংরক্ষণ করা যায়নি।"); }
    finally { setBusy(false); }
  }
  async function remove(it) {
    if (!window.confirm(`“${it.labelBn || it.labelEn}” মেনু আইটেমটি মুছবেন?`)) return;
    try { await api.delete(`/nav-items/${encodeURIComponent(it._id)}`); await load(); } catch (err) { setError(err.response?.data?.message || "মুছা যায়নি।"); }
  }
  async function toggle(it) {
    try { await api.put(`/nav-items/${encodeURIComponent(it._id)}`, { visible: it.visible === false }); await load(); } catch (err) { setError(err.response?.data?.message || "পরিবর্তন করা যায়নি।"); }
  }
  const edit = (it) => { setEditing(it._id); setForm({ ...blank, ...it }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const pickCategory = (name) => setForm((f) => ({ ...f, target: name, labelBn: f.labelBn || name, labelEn: f.labelEn || name }));

  return (
    <Shell>
      <h1 className="text-3xl font-black">Navbar Menu</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">এখানে যোগ করা আইটেম ওয়েবসাইটের মেনুতে (ডেস্কটপ ও মোবাইল) আগের মেনুগুলোর পরে দেখাবে। নতুন আইটেমের উপরে ছোট করে <b className="rounded bg-[#e11d48] px-1 text-[10px] text-white">NEW</b> লেখা কয়েকদিন থাকবে, তারপর নিজে থেকে সরে যাবে।</p>

      <form onSubmit={save} className="mt-6 grid max-w-3xl gap-4 border border-border bg-white p-5">
        <h2 className="text-lg font-black">{editing ? "মেনু আইটেম সম্পাদনা" : "নতুন মেনু আইটেম"}</h2>
        {error && <div role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">⚠ {error}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="কোথায় যাবে (Type)">
            <select className={inp} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, target: "" }))}>
              <option value="category">একটি বিভাগ (Category page)</option>
              <option value="page">ওয়েবসাইটের একটি পেজ</option>
              <option value="link">নিজের লিংক (URL)</option>
            </select>
          </Field>
          <Field label={form.type === "category" ? "বিভাগ" : form.type === "page" ? "পেজ" : "লিংক"}>
            {form.type === "category" ? (
              <select className={inp} value={form.target} onChange={(e) => pickCategory(e.target.value)} required>
                <option value="">-- বিভাগ বেছে নিন --</option>
                {catNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            ) : form.type === "page" ? (
              <select className={inp} value={form.target} onChange={(e) => set("target", e.target.value)} required>
                <option value="">-- পেজ বেছে নিন --</option>
                {PAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <input className={inp} placeholder="https://example.com অথবা /my-page" value={form.target} onChange={(e) => set("target", e.target.value)} required />
            )}
          </Field>
          <Field label="মেনুর নাম (বাংলা)"><input className={inp} value={form.labelBn} onChange={(e) => set("labelBn", e.target.value)} placeholder="যেমন: মতামত" /></Field>
          <Field label="Menu name (English)"><input className={inp} value={form.labelEn} onChange={(e) => set("labelEn", e.target.value)} placeholder="e.g. Opinion" /></Field>
          <Field label="ক্রম (ছোট সংখ্যা আগে)"><input type="number" min="0" max="999" className={inp} value={form.order} onChange={(e) => set("order", e.target.value)} /></Field>
          <Field label="NEW ট্যাগ কতদিন থাকবে">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={!!form.badge} onChange={(e) => set("badge", e.target.checked)} /> দেখাও</label>
              <input type="number" min="1" max="90" disabled={!form.badge} className={`${inp} max-w-24`} value={form.badgeDays} onChange={(e) => set("badgeDays", e.target.value)} /> <span className="text-sm text-muted">দিন</span>
            </div>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.visible !== false} onChange={(e) => set("visible", e.target.checked)} /> মেনুতে দেখাও</label>

        <div className="flex gap-3">
          <button disabled={busy} className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Plus size={16} />{busy ? "সংরক্ষণ হচ্ছে..." : editing ? "আপডেট করুন" : "মেনুতে যোগ করুন"}</button>
          {editing && <button type="button" onClick={() => { setEditing(""); setForm(blank); }} className="border border-border px-5 py-2.5 text-sm font-bold">বাতিল</button>}
        </div>
      </form>

      <div className="mt-8 max-w-3xl">
        <h2 className="mb-3 text-lg font-black">বর্তমান কাস্টম মেনু ({items.length})</h2>
        {items.length === 0 && <p className="border border-dashed border-border p-6 text-center text-sm text-muted">এখনো কোনো আইটেম যোগ করা হয়নি।</p>}
        <div className="grid gap-2">
          {items.map((it) => (
            <div key={it._id} className="flex flex-wrap items-center gap-3 border border-border bg-white p-3">
              <span className="w-10 text-center text-xs font-bold text-muted">#{it.order}</span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate">{it.labelBn || it.labelEn}{it.labelBn && it.labelEn ? ` / ${it.labelEn}` : ""}</strong>
                <span className="block truncate text-xs text-muted">{it.type === "category" ? `বিভাগ: ${it.target}` : it.target}{it.badge ? ` • NEW ${it.badgeDays} দিন` : ""}</span>
              </div>
              <button onClick={() => toggle(it)} className={`rounded px-2.5 py-1 text-xs font-bold ${it.visible === false ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-800"}`}>{it.visible === false ? "লুকানো" : "দৃশ্যমান"}</button>
              <button onClick={() => edit(it)} className="grid h-8 w-8 place-items-center border border-border hover:border-primary" aria-label="Edit"><Pencil size={14} /></button>
              <button onClick={() => remove(it)} className="grid h-8 w-8 place-items-center border border-red-200 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
