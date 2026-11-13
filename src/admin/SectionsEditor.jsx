import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Shell from "./Shell";
import SectionBlock from "../components/SectionBlock";
import api from "../utils/api";
import { categories as builtIn, locations } from "../utils/data";

const blank = {
  title: "", titleEn: "", kicker: "", kickerEn: "", description: "",
  source: "latest", category: "", location: "", count: 4,
  layout: "grid4", cardStyle: "plain", ratio: "4/5", theme: "light", bg: "#f4f6f8", accent: "#0B4D35",
  showAuthor: true, showDate: true, showReadTime: true, showCategory: false, showAllLink: true,
  badge: true, badgeDays: 14, visible: true, order: 50,
};
const LAYOUTS = [["grid4", "৪ কলাম গ্রিড"], ["grid3", "৩ কলাম গ্রিড"], ["featured", "ফিচার্ড (১টি বড়)"], ["list", "লিস্ট"], ["scroller", "স্লাইডার"]];
const CARDS = [["plain", "সাধারণ"], ["boxed", "বক্স"], ["overlay", "ছবির উপর লেখা"]];
const RATIOS = [["16/10", "16:10"], ["16/9", "16:9"], ["4/5", "৪:৫ (ফটোকার্ড)"], ["1/1", "১:১"]];
const BGS = ["#f4f6f8", "#ffffff", "#eef6ee", "#fff7e6", "#0B4D35", "#111827"];
const ACCENTS = ["#0B4D35", "#55B52E", "#e11d48", "#2563eb", "#d97706", "#7c3aed"];
const inp = "border border-border px-3 py-2.5 w-full focus:outline-none focus:border-primary bg-white";
const Field = ({ label, children, hint }) => <div><label className="mb-1 block text-xs font-bold uppercase text-gray-500">{label}</label>{children}{hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}</div>;
const Seg = ({ value, options, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map(([v, l]) => (
      <button type="button" key={v} onClick={() => onChange(v)} className={`border px-3 py-1.5 text-xs font-bold ${value === v ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary"}`}>{l}</button>
    ))}
  </div>
);
const Swatches = ({ value, colors, onChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    {colors.map((c) => <button type="button" key={c} onClick={() => onChange(c)} aria-label={c} className={`h-7 w-7 rounded-full border-2 ${value.toLowerCase() === c.toLowerCase() ? "border-primary ring-2 ring-primary/30" : "border-gray-300"}`} style={{ background: c }} />)}
    <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer border border-border bg-white p-0.5" aria-label="custom colour" />
  </div>
);
const Check = ({ label, checked, onChange }) => <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;

export default function SectionsEditor() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try { const r = await api.get("/sections?all=1"); setItems(r.data.sections || []); } catch { setError("সেকশন লোড করা যায়নি।"); }
  }, []);
  useEffect(() => {
    load();
    api.get("/categories").then((r) => setCats((r.data.categories || []).map((c) => c.name))).catch(() => {});
  }, [load]);
  const catNames = [...new Set([...builtIn.filter((c) => c.en !== "all").map((c) => c.en), ...cats])];

  async function save(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (editing) await api.put(`/sections/${encodeURIComponent(editing)}`, form); else await api.post("/sections", form);
      setForm(blank); setEditing(""); await load();
    } catch (err) { setError(err.response?.data?.message || "সংরক্ষণ করা যায়নি।"); }
    finally { setBusy(false); }
  }
  async function remove(it) {
    if (!window.confirm(`“${it.title || it.titleEn}” সেকশনটি মুছবেন?`)) return;
    try { await api.delete(`/sections/${encodeURIComponent(it._id)}`); if (editing === it._id) { setEditing(""); setForm(blank); } await load(); } catch (err) { setError(err.response?.data?.message || "মুছা যায়নি।"); }
  }
  async function toggle(it) {
    try { await api.put(`/sections/${encodeURIComponent(it._id)}`, { visible: it.visible === false }); await load(); } catch (err) { setError(err.response?.data?.message || "পরিবর্তন করা যায়নি।"); }
  }
  const edit = (it) => { setEditing(it._id); setForm({ ...blank, ...it }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // live preview needs a valid-looking object even before the form is complete
  const preview = { ...form, source: form.source === "category" && !form.category ? "latest" : form.source, title: form.title || form.titleEn || "সেকশনের নাম", count: Number(form.count) || 4 };

  return (
    <Shell>
      <h1 className="text-3xl font-black">Website Sections</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">নিজের ডিজাইনে নতুন সেকশন বানান: কোন সংবাদ দেখাবে, কতগুলো, কোন লেআউট ও রঙে। সংরক্ষণ করলে সেকশনটি হোম পেজে (শীর্ষ সংবাদের পরে) প্রকাশ হবে। নতুন সেকশনের শিরোনামের উপরে ছোট করে <b className="rounded bg-[#e11d48] px-1 text-[10px] text-white">NEW</b> লেখা থাকবে।</p>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <form onSubmit={save} className="grid gap-4 border border-border bg-white p-5">
          <h2 className="text-lg font-black">{editing ? "সেকশন সম্পাদনা" : "নতুন সেকশন"}</h2>
          {error && <div role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">⚠ {error}</div>}

          <fieldset className="grid gap-3 border border-border p-3"><legend className="px-1 text-sm font-black">১. কনটেন্ট</legend>
            <Field label="সেকশনের নাম (বাংলা)"><input className={inp} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="যেমন: সম্পাদকীয়" /></Field>
            <Field label="Section title (English)"><input className={inp} value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} placeholder="e.g. Editorial" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="ছোট লেবেল (বাংলা)" hint="শিরোনামের উপরের ছোট লেখা"><input className={inp} value={form.kicker} onChange={(e) => set("kicker", e.target.value)} placeholder="মতামত ও বিশ্লেষণ" /></Field>
              <Field label="Small label (English)"><input className={inp} value={form.kickerEn} onChange={(e) => set("kickerEn", e.target.value)} placeholder="OPINION & ANALYSIS" /></Field>
            </div>
            <Field label="ছোট বিবরণ (ঐচ্ছিক)"><input className={inp} maxLength={300} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="কোন সংবাদ দেখাবে"><Seg value={form.source} onChange={(v) => set("source", v)} options={[["latest", "সর্বশেষ"], ["popular", "সবচেয়ে বেশি পড়া"], ["category", "একটি বিভাগের"]]} /></Field>
            {form.source === "category" && (
              <Field label="বিভাগ"><select className={inp} value={form.category} onChange={(e) => set("category", e.target.value)} required><option value="">-- বিভাগ বেছে নিন --</option>{catNames.map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="এলাকা (ঐচ্ছিক)"><select className={inp} value={form.location} onChange={(e) => set("location", e.target.value)}><option value="">সব এলাকা</option>{locations.map((l) => <option key={l.slug} value={l.slug}>{l.bn}</option>)}</select></Field>
              <Field label={`সংবাদের সংখ্যা: ${form.count}`}><input type="range" min="1" max="12" value={form.count} onChange={(e) => set("count", e.target.value)} className="w-full" /></Field>
            </div>
          </fieldset>

          <fieldset className="grid gap-3 border border-border p-3"><legend className="px-1 text-sm font-black">২. ডিজাইন</legend>
            <Field label="লেআউট"><Seg value={form.layout} onChange={(v) => set("layout", v)} options={LAYOUTS} /></Field>
            <Field label="কার্ডের স্টাইল"><Seg value={form.cardStyle} onChange={(v) => set("cardStyle", v)} options={CARDS} /></Field>
            <Field label="ছবির অনুপাত"><p className="text-xs text-muted">খবরের মূল ছবি সবসময় ১২০০ × ১৫০০ (৪:৫) অনুপাতে দেখায়।</p></Field>
            <Field label="পেছনের রঙ"><Swatches value={form.bg} colors={BGS} onChange={(c) => set("bg", c)} /></Field>
            <Field label="লেখা"><Seg value={form.theme} onChange={(v) => set("theme", v)} options={[["light", "গাঢ় লেখা (হালকা পেছনে)"], ["dark", "সাদা লেখা (গাঢ় পেছনে)"]]} /></Field>
            <Field label="অ্যাক্সেন্ট রঙ (লেবেল, নাম, লিংক)"><Swatches value={form.accent} colors={ACCENTS} onChange={(c) => set("accent", c)} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Check label="লেখকের নাম" checked={form.showAuthor} onChange={(v) => set("showAuthor", v)} />
              <Check label="তারিখ" checked={form.showDate} onChange={(v) => set("showDate", v)} />
              <Check label="পড়ার সময়" checked={form.showReadTime} onChange={(v) => set("showReadTime", v)} />
              <Check label="বিভাগের নাম" checked={form.showCategory} onChange={(v) => set("showCategory", v)} />
              <Check label="“সব দেখুন” লিংক" checked={form.showAllLink} onChange={(v) => set("showAllLink", v)} />
            </div>
          </fieldset>

          <fieldset className="grid gap-3 border border-border p-3"><legend className="px-1 text-sm font-black">৩. প্রকাশ</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="ক্রম (ছোট সংখ্যা আগে)"><input type="number" min="0" max="999" className={inp} value={form.order} onChange={(e) => set("order", e.target.value)} /></Field>
              <Field label="NEW ট্যাগ">
                <div className="flex items-center gap-2"><Check label="দেখাও" checked={form.badge} onChange={(v) => set("badge", v)} />
                  <input type="number" min="1" max="90" disabled={!form.badge} className={`${inp} max-w-20`} value={form.badgeDays} onChange={(e) => set("badgeDays", e.target.value)} /><span className="text-sm text-muted">দিন</span></div>
              </Field>
            </div>
            <Check label="হোম পেজে দেখাও" checked={form.visible !== false} onChange={(v) => set("visible", v)} />
          </fieldset>

          <div className="flex gap-3">
            <button disabled={busy} className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Plus size={16} />{busy ? "সংরক্ষণ হচ্ছে..." : editing ? "আপডেট করুন" : "সেকশন প্রকাশ করুন"}</button>
            {editing && <button type="button" onClick={() => { setEditing(""); setForm(blank); }} className="border border-border px-5 py-2.5 text-sm font-bold">বাতিল</button>}
          </div>
        </form>

        <div className="xl:sticky xl:top-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">লাইভ প্রিভিউ — ওয়েবসাইটে ঠিক এমনই দেখাবে</p>
          <div className="overflow-hidden border border-border"><SectionBlock section={preview} preview /></div>
        </div>
      </div>

      <div className="mt-10 max-w-4xl">
        <h2 className="mb-3 text-lg font-black">প্রকাশিত সেকশন ({items.length})</h2>
        {items.length === 0 && <p className="border border-dashed border-border p-6 text-center text-sm text-muted">এখনো কোনো সেকশন বানানো হয়নি।</p>}
        <div className="grid gap-2">
          {items.map((it) => (
            <div key={it._id} className="flex flex-wrap items-center gap-3 border border-border bg-white p-3">
              <span className="h-8 w-8 shrink-0 rounded border border-black/10" style={{ background: it.bg }} />
              <span className="w-10 text-center text-xs font-bold text-muted">#{it.order}</span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate">{it.title || it.titleEn}</strong>
                <span className="block truncate text-xs text-muted">{LAYOUTS.find(([v]) => v === it.layout)?.[1]} • {it.source === "category" ? `বিভাগ: ${it.category}` : it.source === "popular" ? "বেশি পড়া" : "সর্বশেষ"} • {it.count}টি</span>
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
