import { useEffect, useMemo, useState } from "react";
import { Copy, Download, MailCheck, RefreshCw, Search, Trash2, Users } from "lucide-react";
import Shell from "./Shell";
import api from "../utils/api";

const SRC = { home: "Home page", footer: "Footer", article: "News page", web: "Website" };
const fmt = (iso) => { try { return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };

function Stat({ label, value, icon: Icon }) {
  return <div className="flex items-center gap-3 border border-border bg-white p-4">
    <span className="grid h-11 w-11 place-items-center bg-primary/10 text-primary"><Icon size={20} /></span>
    <div><p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p><p className="text-2xl font-black leading-tight">{value ?? "—"}</p></div>
  </div>;
}

export default function Subscribers() {
  const [data, setData] = useState({ subscribers: [], total: 0, today: 0, last7: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/subscribers"); setData(r.data); setNotice(""); }
    catch (e) { setNotice(e.response?.data?.message || "Subscriber তালিকা লোড করা যায়নি।"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const rows = useMemo(() => { const t = q.trim().toLowerCase(); return t ? data.subscribers.filter((s) => s.email.includes(t)) : data.subscribers; }, [data, q]);
  const remove = async (s) => {
    if (!window.confirm(`${s.email} মুছে ফেলবেন?`)) return;
    try { await api.delete(`/subscribers/${s._id}`); setData((d) => ({ ...d, total: d.total - 1, subscribers: d.subscribers.filter((x) => x._id !== s._id) })); }
    catch (e) { setNotice(e.response?.data?.message || "মুছে ফেলা যায়নি।"); }
  };
  const csv = () => {
    const lines = ["email,source,language,subscribed_at", ...rows.map((s) => [s.email, s.source, s.lang, s.createdAt].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))];
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `subscribers-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const copyAll = async () => { try { await navigator.clipboard.writeText(rows.map((s) => s.email).join(", ")); setNotice(`${rows.length}টি ইমেইল কপি হয়েছে।`); } catch { setNotice("কপি করা যায়নি।"); } };

  return <Shell>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-black">Newsletter Subscribers</h1><p className="mt-1 text-sm text-muted">যারা ওয়েবসাইট থেকে নিউজলেটারে সাবস্ক্রাইব করেছেন</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={load} className="inline-flex items-center gap-2 border border-border bg-white px-3 py-2 text-sm font-bold hover:bg-gray-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button>
        <button onClick={copyAll} disabled={!rows.length} className="inline-flex items-center gap-2 border border-border bg-white px-3 py-2 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"><Copy size={15} />Copy emails</button>
        <button onClick={csv} disabled={!rows.length} className="inline-flex items-center gap-2 bg-primary px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"><Download size={15} />Export CSV</button>
      </div>
    </div>
    {notice && <div className="mb-4 border border-border bg-white p-3 text-sm font-semibold">{notice}</div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <Stat label="Total subscribers" value={data.total} icon={Users} />
      <Stat label="Today" value={data.today} icon={MailCheck} />
      <Stat label="Last 7 days" value={data.last7} icon={MailCheck} />
    </div>
    <section className="border border-border bg-white">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Search size={16} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ইমেইল খুঁজুন…" className="w-full text-sm outline-none" />
        <span className="whitespace-nowrap text-xs text-muted">{rows.length} / {data.total}</span>
      </div>
      {loading ? <p className="p-6 text-sm text-muted">লোড হচ্ছে…</p> : rows.length === 0 ? <div className="p-10 text-center text-muted"><MailCheck className="mx-auto mb-3" /><p>{q ? "কিছু পাওয়া যায়নি।" : "এখনো কেউ সাবস্ক্রাইব করেননি।"}</p></div> : (
        <div className="max-h-[68vh] overflow-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-2.5">#</th><th className="px-4 py-2.5">Email</th><th className="px-4 py-2.5">From</th><th className="px-4 py-2.5">Subscribed</th><th className="px-4 py-2.5" /></tr></thead>
            <tbody>{rows.map((s, i) => <tr key={s._id} className="border-t border-border">
              <td className="px-4 py-2.5 text-muted">{rows.length - i}</td>
              <td className="px-4 py-2.5 font-semibold"><a className="text-primary hover:underline" href={`mailto:${s.email}`}>{s.email}</a></td>
              <td className="px-4 py-2.5 text-muted">{SRC[s.source] || s.source}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{fmt(s.createdAt)}</td>
              <td className="px-4 py-2.5 text-right"><button onClick={() => remove(s)} aria-label="Delete" className="p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  </Shell>;
}
