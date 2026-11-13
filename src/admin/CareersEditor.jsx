import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Download, Edit, ExternalLink, Eye, EyeOff, Mail, Phone, Plus, Save, Trash2, X } from "lucide-react";
import Shell from "./Shell";
import { PageLoader } from "../components/Spinner.jsx";
import api from "../utils/api";

const STATUS = [["hiring", "Hiring (নিয়োগ চলছে)"], ["opening-soon", "Opening soon (শীঘ্রই)"], ["closed", "Closed (বন্ধ)"]];
const TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const MODES = ["Office", "Remote", "Hybrid"];
const APP_STATUS = ["নতুন", "শর্টলিস্টেড", "ইন্টারভিউ", "নিয়োগ", "বাতিল"];
const APP_COLOR = { "নতুন": "bg-blue-100 text-blue-800", "শর্টলিস্টেড": "bg-amber-100 text-amber-800", "ইন্টারভিউ": "bg-purple-100 text-purple-800", "নিয়োগ": "bg-primary/10 text-primary", "বাতিল": "bg-gray-100 text-gray-500" };
const JOB_PILL = { hiring: "bg-primary/10 text-primary", "opening-soon": "bg-amber-100 text-amber-800", closed: "bg-gray-100 text-gray-500" };

const EMPTY_JOB = {
  title: "", titleBn: "", type: "Full-time", mode: "Office", salary: "", location: "", deadline: "",
  status: "hiring", summary: "", summaryBn: "", doing: "", looking: "", applyUrl: "", order: 0, published: true,
};

const inputCls = "w-full border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none";
const labelCls = "mb-1 block text-xs font-black uppercase tracking-wider";

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 left-4 right-4 z-[60] flex items-center gap-3 px-5 py-3 text-sm font-bold text-white shadow-xl sm:left-auto sm:right-6 ${type === "success" ? "bg-primary" : "bg-red-600"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} aria-label="close"><X size={14} /></button>
    </div>
  );
}

function Confirm({ title, text, onYes, onNo }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm border border-border bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-lg font-black">{title}</h3>
        <p className="mb-6 text-sm text-muted">{text}</p>
        <div className="flex gap-3">
          <button onClick={onYes} className="flex-1 bg-red-600 py-2.5 text-sm font-black uppercase text-white hover:bg-red-700">হ্যাঁ, ডিলিট করুন</button>
          <button onClick={onNo} className="flex-1 border border-border py-2.5 text-sm font-bold hover:bg-gray-50">বাতিল</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Job form
function JobForm({ initial, onSaved, onCancel, notify }) {
  const [f, setF] = useState(() => initial
    ? { ...EMPTY_JOB, ...initial, doing: (initial.doing || []).join("\n"), looking: (initial.looking || []).join("\n") }
    : EMPTY_JOB);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) { setErr("পদের নাম (English) আবশ্যক।"); return; }
    setErr(""); setBusy(true);
    try {
      if (initial?._id) await api.put(`/careers/${initial._id}`, f);
      else await api.post("/careers", f);
      notify(initial?._id ? "পদ আপডেট হয়েছে ✓" : "নতুন পদ যোগ হয়েছে ✓");
      onSaved();
    } catch (er) {
      setErr(er.response?.data?.message || "সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally { setBusy(false); }
  };

  const txt = (label, key, ph = "", type = "text") => (
    <div><label className={labelCls}>{label}</label><input type={type} className={inputCls} value={f[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} /></div>
  );
  const sel = (label, key, opts) => (
    <div><label className={labelCls}>{label}</label>
      <select className={inputCls} value={f[key]} onChange={(e) => set(key, e.target.value)}>
        {opts.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
      </select></div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {txt("Job title (English) *", "title", "e.g. Content Executive")}
        {txt("পদের নাম (বাংলায়)", "titleBn", "যেমন: কনটেন্ট এক্সিকিউটিভ")}
        {sel("Status", "status", STATUS)}
        {sel("Type", "type", TYPES)}
        {sel("Work mode", "mode", MODES)}
        {txt("Salary", "salary", "e.g. 20,000 - 30,000 BDT (ফাঁকা = আলোচনাসাপেক্ষ)")}
        {txt("Location", "location", "e.g. Noakhali Sadar")}
        {txt("Deadline (শেষ তারিখ)", "deadline", "e.g. 30 Nov 2026")}
        {txt("External apply link (ঐচ্ছিক)", "applyUrl", "https://… (দিলে সাইটের ফর্মের বদলে এই লিংক যাবে)", "url")}
        {txt("Display order (ছোট নম্বর আগে)", "order", "0", "number")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={labelCls}>Summary (English)</label><textarea rows={3} className={`${inputCls} resize-none`} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></div>
        <div><label className={labelCls}>সারসংক্ষেপ (বাংলায়)</label><textarea rows={3} className={`${inputCls} resize-none`} value={f.summaryBn} onChange={(e) => set("summaryBn", e.target.value)} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={labelCls}>যা করবেন — প্রতি লাইনে একটি</label><textarea rows={6} className={`${inputCls} resize-y`} value={f.doing} onChange={(e) => set("doing", e.target.value)} placeholder={"Write and edit local news\nManage social posts"} /></div>
        <div><label className={labelCls}>যা খুঁজছি — প্রতি লাইনে একটি</label><textarea rows={6} className={`${inputCls} resize-y`} value={f.looking} onChange={(e) => set("looking", e.target.value)} placeholder={"Strong Bangla writing\nBasic computer skills"} /></div>
      </div>
      <label className="flex cursor-pointer select-none items-center gap-3">
        <span onClick={() => set("published", !f.published)} className={`relative h-6 w-11 rounded-full transition-colors ${f.published ? "bg-primary" : "bg-gray-300"}`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${f.published ? "left-6" : "left-1"}`} />
        </span>
        <span className="text-sm font-bold">{f.published ? "Careers পেজে দেখাবে" : "লুকানো (Draft)"}</span>
      </label>
      {err && <p className="flex items-center gap-1 text-sm font-bold text-red-600"><AlertCircle size={14} />{err}</p>}
      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
        <button disabled={busy} className="bg-primary px-6 py-2.5 text-sm font-black uppercase text-white hover:bg-primary/90 disabled:opacity-60 sm:flex-1">{busy ? "সেভ হচ্ছে…" : initial?._id ? "✓ আপডেট করুন" : "+ যোগ করুন"}</button>
        <button type="button" onClick={onCancel} className="border border-border px-6 py-2.5 text-sm font-bold hover:bg-gray-50 sm:flex-1">বাতিল</button>
      </div>
    </form>
  );
}

// ───────────────────────── Jobs tab
function JobsTab({ jobs, apps, reload, notify }) {
  const [editing, setEditing] = useState(null); // null | "new" | job
  const [del, setDel] = useState(null);
  const counts = useMemo(() => { const c = {}; apps.forEach((a) => { c[a.jobId] = (c[a.jobId] || 0) + 1; }); return c; }, [apps]);

  const togglePublish = async (j) => {
    try { await api.put(`/careers/${j._id}`, { published: j.published === false }); notify(j.published === false ? "পদ প্রকাশিত ✓" : "পদ লুকানো হয়েছে"); reload(); }
    catch { notify("আপডেট করা যায়নি।", "error"); }
  };
  const remove = async () => {
    try { await api.delete(`/careers/${del._id}`); notify("পদ মুছে ফেলা হয়েছে।", "error"); setDel(null); reload(); }
    catch { notify("ডিলিট করা যায়নি।", "error"); }
  };

  if (editing) {
    return (
      <div className="mx-auto max-w-3xl border border-border bg-white p-4 sm:p-6">
        <h2 className="mb-5 text-xl font-black">{editing === "new" ? "নতুন পদ যোগ করুন" : `Edit — ${editing.title}`}</h2>
        <JobForm initial={editing === "new" ? null : editing} notify={notify} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      </div>
    );
  }

  return (
    <>
      {del && <Confirm title="পদটি ডিলিট করবেন?" text={`“${del.title}” মুছে যাবে। এই পদের আগের আবেদনগুলো Applications ট্যাবে থেকে যাবে।`} onYes={remove} onNo={() => setDel(null)} />}
      <div className="mb-5 flex justify-end">
        <button onClick={() => setEditing("new")} className="flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-black uppercase text-white hover:bg-primary/90"><Plus size={16} /> নতুন পদ যোগ করুন</button>
      </div>
      {jobs.length === 0 ? (
        <div className="border border-dashed border-border py-20 text-center">
          <p className="mb-1 text-lg font-black">কোনো পদ নেই</p>
          <p className="text-sm text-muted">প্রথম নিয়োগ বিজ্ঞপ্তি যোগ করুন।</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((j) => (
            <div key={j._id} className={`flex flex-col gap-3 border border-border bg-white p-4 ${j.published === false ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black">{j.title}</p>
                  {j.titleBn && <p className="truncate text-xs text-muted">{j.titleBn}</p>}
                </div>
                <span className={`shrink-0 px-2.5 py-1 text-[11px] font-black uppercase ${JOB_PILL[j.status]}`}>{j.status}</span>
              </div>
              <p className="text-xs text-muted">{j.type} · {j.mode}{j.location ? ` · ${j.location}` : ""} · {j.salary || "Negotiable"}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-xs font-bold">
                  {j.published === false ? <span className="text-gray-500">○ Draft</span> : <span className="text-primary">● Public</span>}
                  <span className="ml-3 text-muted">{counts[j._id] || 0} আবেদন</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={() => togglePublish(j)} className="flex items-center gap-1 border border-border px-3 py-1.5 text-xs font-bold hover:bg-gray-50">{j.published === false ? <Eye size={12} /> : <EyeOff size={12} />}{j.published === false ? "Publish" : "Hide"}</button>
                  <button onClick={() => setEditing(j)} className="flex items-center gap-1 border border-border px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary"><Edit size={12} /> Edit</button>
                  <button onClick={() => setDel(j)} className="flex items-center gap-1 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ───────────────────────── Applications tab
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

function AppCard({ a, reload, notify, onDelete }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(a.note || "");
  const [saving, setSaving] = useState(false);

  const setStatus = async (status) => {
    try { await api.patch(`/careers/applications/${a._id}`, { status }); notify("স্ট্যাটাস আপডেট হয়েছে ✓"); reload(); }
    catch { notify("আপডেট করা যায়নি।", "error"); }
  };
  const saveNote = async () => {
    setSaving(true);
    try { await api.patch(`/careers/applications/${a._id}`, { note }); notify("নোট সেভ হয়েছে ✓"); reload(); }
    catch { notify("সেভ করা যায়নি।", "error"); } finally { setSaving(false); }
  };

  return (
    <div className="border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <button onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <p className="truncate font-black">{a.name} <span className="ml-1 text-xs font-bold text-muted">{a.ref}</span></p>
          <p className="truncate text-xs text-muted">{a.jobTitle} · {new Date(a.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
        </button>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-[11px] font-black ${APP_COLOR[a.status] || ""}`}>{a.status}</span>
          <select value={a.status} onChange={(e) => setStatus(e.target.value)} className="border border-border bg-white px-2 py-1.5 text-xs font-bold" aria-label="status">
            {APP_STATUS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => onDelete(a)} aria-label="delete" className="border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
        </div>
      </div>
      {open && (
        <div className="space-y-3 border-t border-border bg-gray-50/60 p-4 text-sm">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={`mailto:${a.email}`} className="flex items-center gap-1.5 font-bold text-primary"><Mail size={14} />{a.email}</a>
            <a href={`tel:${a.phone}`} className="flex items-center gap-1.5 font-bold text-primary"><Phone size={14} />{a.phone}</a>
            {a.resumeUrl && <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-bold text-primary"><ExternalLink size={14} />Resume</a>}
            {a.portfolio && <a href={a.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-bold text-primary"><ExternalLink size={14} />Portfolio</a>}
          </div>
          {a.coverLetter && <p className="whitespace-pre-line border border-border bg-white p-3 leading-relaxed">{a.coverLetter}</p>}
          <div>
            <label className={labelCls}>অভ্যন্তরীণ নোট (শুধু অ্যাডমিন দেখবে)</label>
            <textarea rows={2} className={`${inputCls} resize-none`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
            <button onClick={saveNote} disabled={saving || note === (a.note || "")} className="mt-2 bg-primary px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50">{saving ? "সেভ হচ্ছে…" : "নোট সেভ করুন"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationsTab({ jobs, apps, reload, notify }) {
  const [jobFilter, setJobFilter] = useState("all");
  const [stFilter, setStFilter] = useState("all");
  const [q, setQ] = useState("");
  const [del, setDel] = useState(null);

  const shown = apps.filter((a) =>
    (jobFilter === "all" || a.jobId === jobFilter) &&
    (stFilter === "all" || a.status === stFilter) &&
    (!q.trim() || `${a.name} ${a.email} ${a.phone} ${a.ref}`.toLowerCase().includes(q.trim().toLowerCase())));

  const remove = async () => {
    try { await api.delete(`/careers/applications/${del._id}`); notify("আবেদন মুছে ফেলা হয়েছে।", "error"); setDel(null); reload(); }
    catch { notify("ডিলিট করা যায়নি।", "error"); }
  };
  const exportCsv = () => {
    const head = ["Ref", "Date", "Job", "Name", "Email", "Phone", "Resume", "Portfolio", "Status", "Note", "Cover letter"];
    const rows = shown.map((a) => [a.ref, a.createdAt, a.jobTitle, a.name, a.email, a.phone, a.resumeUrl, a.portfolio, a.status, a.note, a.coverLetter]);
    const csv = "﻿" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const el = document.createElement("a");
    el.href = url; el.download = `career-applications-${new Date().toISOString().slice(0, 10)}.csv`; el.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      {del && <Confirm title="আবেদন ডিলিট করবেন?" text={`${del.name} (${del.ref}) এর আবেদন মুছে যাবে।`} onYes={remove} onNo={() => setDel(null)} />}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম / ইমেইল / ফোন / রেফারেন্স…" className={`${inputCls} max-w-xs`} />
        <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className={`${inputCls} max-w-[14rem]`}>
          <option value="all">সব পদ</option>
          {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
        </select>
        <select value={stFilter} onChange={(e) => setStFilter(e.target.value)} className={`${inputCls} max-w-[10rem]`}>
          <option value="all">সব স্ট্যাটাস</option>
          {APP_STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={exportCsv} disabled={!shown.length} className="ml-auto flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"><Download size={15} /> CSV</button>
      </div>
      {shown.length === 0 ? (
        <p className="border border-dashed border-border py-16 text-center font-semibold text-muted">{apps.length ? "এই ফিল্টারে কোনো আবেদন নেই।" : "এখনো কোনো আবেদন আসেনি।"}</p>
      ) : (
        <div className="space-y-3">{shown.map((a) => <AppCard key={a._id} a={a} reload={reload} notify={notify} onDelete={setDel} />)}</div>
      )}
    </>
  );
}

// ───────────────────────── Page content tab
function PageTab({ page, reload, notify }) {
  const [f, setF] = useState(page);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF(page); }, [page]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setCard = (i, k, v) => setF((p) => ({ ...p, whyCards: p.whyCards.map((c, n) => (n === i ? { ...c, [k]: v } : c)) }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.put("/careers/page", f); notify("Careers পেজের কনটেন্ট সেভ হয়েছে ✓"); reload(); }
    catch (er) { notify(er.response?.data?.message || "সেভ করা যায়নি।", "error"); } finally { setBusy(false); }
  };

  const pair = (label, en, bn, area) => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label className={labelCls}>{label} (English)</label>{area
        ? <textarea rows={3} className={`${inputCls} resize-none`} value={f[en] || ""} onChange={(e) => set(en, e.target.value)} />
        : <input className={inputCls} value={f[en] || ""} onChange={(e) => set(en, e.target.value)} />}</div>
      <div><label className={labelCls}>{label} (বাংলা)</label>{area
        ? <textarea rows={3} className={`${inputCls} resize-none`} value={f[bn] || ""} onChange={(e) => set(bn, e.target.value)} />
        : <input className={inputCls} value={f[bn] || ""} onChange={(e) => set(bn, e.target.value)} />}</div>
    </div>
  );

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <section className="space-y-4 border border-border bg-white p-5">
        <h2 className="text-lg font-black">Hero (উপরের অংশ)</h2>
        {pair("Title", "heroTitle", "heroTitleBn")}
        {pair("Text", "heroText", "heroTextBn", true)}
      </section>

      <section className="space-y-4 border border-border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">“Life at Noakhali Vision” কার্ড</h2>
          <button type="button" disabled={(f.whyCards || []).length >= 8} onClick={() => set("whyCards", [...(f.whyCards || []), { title: "", titleBn: "", text: "", textBn: "" }])} className="flex items-center gap-1 border border-border px-3 py-1.5 text-xs font-bold hover:bg-gray-50 disabled:opacity-50"><Plus size={13} /> কার্ড যোগ</button>
        </div>
        {pair("Section title", "whyTitle", "whyTitleBn")}
        {(f.whyCards || []).map((c, i) => (
          <div key={i} className="space-y-3 border border-border bg-gray-50/60 p-4">
            <div className="flex items-center justify-between"><span className="text-xs font-black text-muted">কার্ড {i + 1}</span>
              <button type="button" onClick={() => set("whyCards", f.whyCards.filter((_, n) => n !== i))} className="flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 size={12} /> মুছুন</button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputCls} placeholder="Title (English)" value={c.title || ""} onChange={(e) => setCard(i, "title", e.target.value)} />
              <input className={inputCls} placeholder="শিরোনাম (বাংলা)" value={c.titleBn || ""} onChange={(e) => setCard(i, "titleBn", e.target.value)} />
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Text (English)" value={c.text || ""} onChange={(e) => setCard(i, "text", e.target.value)} />
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="লেখা (বাংলা)" value={c.textBn || ""} onChange={(e) => setCard(i, "textBn", e.target.value)} />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4 border border-border bg-white p-5">
        <h2 className="text-lg font-black">খোলা পদের শিরোনাম</h2>
        {pair("Section title", "listTitle", "listTitleBn")}
      </section>

      <section className="space-y-4 border border-border bg-white p-5">
        <h2 className="text-lg font-black">নিচের CTA অংশ ও যোগাযোগ</h2>
        {pair("CTA title", "ctaTitle", "ctaTitleBn")}
        {pair("CTA text", "ctaText", "ctaTextBn", true)}
        <div><label className={labelCls}>Contact email (CTA-র “ইমেইল করুন” বাটন)</label>
          <input type="email" className={`${inputCls} max-w-md`} value={f.contactEmail || ""} onChange={(e) => set("contactEmail", e.target.value)} placeholder="jobs@noakhalivision.com (ফাঁকা = Partnership পেজে যাবে)" /></div>
      </section>

      <button disabled={busy} className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-black uppercase text-white hover:bg-primary/90 disabled:opacity-60"><Save size={16} />{busy ? "সেভ হচ্ছে…" : "Save Page Content"}</button>
    </form>
  );
}

// ───────────────────────── Main
export default function CareersEditor() {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const notify = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([api.get("/careers?includeDrafts=1"), api.get("/careers/applications")]);
      setJobs(a.data.jobs); setPage(a.data.page); setApps(b.data.applications);
    } catch (er) {
      notify(er.response?.data?.message || "ডেটা লোড করা যায়নি।", "error");
    } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const newCount = apps.filter((a) => a.status === "নতুন").length;
  const tabs = [["jobs", `Jobs (${jobs.length})`], ["apps", `Applications (${apps.length})`], ["page", "Page Content"]];

  return (
    <Shell>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Careers</h1>
          <p className="mt-0.5 text-sm text-muted">নিয়োগ বিজ্ঞপ্তি, আবেদন ও Careers পেজের কনটেন্ট এক জায়গা থেকে নিয়ন্ত্রণ করুন{newCount ? ` · ${newCount}টি নতুন আবেদন` : ""}</p>
        </div>
        <a href="/careers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-bold hover:bg-gray-50"><ExternalLink size={14} /> পেজ দেখুন</a>
      </div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`relative -mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-black ${tab === k ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"}`}>
            {label}
            {k === "apps" && newCount > 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-white">{newCount}</span>}
          </button>
        ))}
      </div>
      {loading ? <PageLoader minHeight="40vh" /> : (
        <>
          {tab === "jobs" && <JobsTab jobs={jobs} apps={apps} reload={load} notify={notify} />}
          {tab === "apps" && <ApplicationsTab jobs={jobs} apps={apps} reload={load} notify={notify} />}
          {tab === "page" && page && <PageTab page={page} reload={load} notify={notify} />}
        </>
      )}
    </Shell>
  );
}
