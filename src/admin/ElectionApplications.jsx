import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Search, Trash2, Users, XCircle, X, Eye } from "lucide-react";
import Shell from "./Shell";
import api from "../utils/api";

const STATUSES = ["অপেক্ষমাণ", "পর্যালোচনাধীন", "অনুমোদিত", "বাতিল"];
const fmt = (iso) => { try { return new Date(iso).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" }); } catch { return iso || ""; } };

export default function ElectionApplications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("সব");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/election/applications");
      setRows(r.data.applications || []);
    } catch (err) {
      setNotice(err.response?.data?.message || "আবেদন লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => rows.filter((r) =>
    `${r.name} ${r.phone} ${r.upazila} ${r.union} ${r.ref}`.toLowerCase().includes(q.toLowerCase()) && (filter === "সব" || r.status === filter),
  ), [rows, q, filter]);

  async function change(id, status) {
    setNotice("");
    try {
      await api.patch(`/election/applications/${encodeURIComponent(id)}`, { status });
      setRows((list) => list.map((r) => (r._id === id ? { ...r, status } : r)));
      setDetail((d) => (d && d._id === id ? { ...d, status } : d));
    } catch (err) {
      setNotice(err.response?.data?.message || "পরিবর্তন করা যায়নি।");
    }
  }
  async function remove(id) {
    if (!window.confirm("এই আবেদনটি স্থায়ীভাবে মুছে ফেলবেন?")) return;
    try {
      await api.delete(`/election/applications/${encodeURIComponent(id)}`);
      setRows((list) => list.filter((r) => r._id !== id));
      setDetail(null);
    } catch (err) {
      setNotice(err.response?.data?.message || "মুছে ফেলা যায়নি।");
    }
  }
  async function open(id) {
    try {
      const r = await api.get(`/election/applications/${encodeURIComponent(id)}`);
      setDetail(r.data.application);
    } catch (err) {
      setNotice(err.response?.data?.message || "বিস্তারিত লোড করা যায়নি।");
    }
  }

  const stat = (label, n, Icon) => (
    <div key={label} className="rounded-xl border border-border bg-white p-5">
      <Icon className="text-primary" size={22} />
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="text-3xl font-black">{n}</p>
    </div>
  );
  const long = (label, value) => value ? <div className="sm:col-span-2"><p className="text-xs font-bold text-muted">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{value}</p></div> : null;

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">নির্বাচনী আবেদন ব্যবস্থাপনা</h1>
        <p className="mt-1 text-sm text-muted">Election Spotlight ফর্ম থেকে আসা আবেদনগুলো এখানে জমা হয়।</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stat("মোট আবেদন", rows.length, Users)}
        {stat("অপেক্ষমাণ / পর্যালোচনাধীন", rows.filter((r) => r.status === "অপেক্ষমাণ" || r.status === "পর্যালোচনাধীন").length, Clock3)}
        {stat("অনুমোদিত", rows.filter((r) => r.status === "অনুমোদিত").length, CheckCircle2)}
      </div>
      <section className="mt-6 rounded-xl border border-border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input type="search" className="w-full border border-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" aria-label="অনুসন্ধান" value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, মোবাইল, ইউনিয়ন বা রেফারেন্স দিয়ে খুঁজুন" />
          </div>
          <select className="border border-border px-3 py-2.5 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>সব</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {notice && <p className="mt-3 rounded bg-secondary/10 p-3 text-sm font-bold text-primary" role="status">{notice}</p>}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-border text-xs text-muted"><th className="p-3">প্রার্থী</th><th className="p-3">এলাকা</th><th className="p-3">পরিচয় / পদ</th><th className="p-3">জমার সময়</th><th className="p-3">অবস্থা</th><th className="p-3">অ্যাকশন</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id} className="border-b border-border/60">
                  <td className="p-3"><b className="block">{r.name}</b><small className="text-muted">{r.ref} · {r.phone}</small></td>
                  <td className="p-3">{r.upazila} · {r.union}</td>
                  <td className="p-3">{r.affiliation === "party" ? (r.party || "দলীয় মনোনীত") : "স্বতন্ত্র"}<br /><small className="text-muted">{r.position}</small></td>
                  <td className="p-3 text-xs text-muted">{fmt(r.createdAt)}</td>
                  <td className="p-3"><span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-primary">{r.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => open(r._id)} title="বিস্তারিত" className="rounded bg-gray-100 p-2"><Eye size={16} /></button>
                      <button onClick={() => change(r._id, "অনুমোদিত")} title="অনুমোদন" className="rounded bg-secondary/15 p-2 text-primary"><CheckCircle2 size={16} /></button>
                      <button onClick={() => change(r._id, "বাতিল")} title="বাতিল" className="rounded bg-red-50 p-2 text-red-700"><XCircle size={16} /></button>
                      <button onClick={() => change(r._id, "পর্যালোচনাধীন")} title="পর্যালোচনাধীন" className="rounded bg-gray-100 px-3 py-2 text-xs font-bold">রিভিউ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-8 text-center text-sm text-muted">লোড হচ্ছে…</p>}
          {!loading && filtered.length === 0 && <p className="p-8 text-center text-sm text-muted">কোনো আবেদন পাওয়া যায়নি।</p>}
        </div>
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-xl font-black">{detail.name}</h2><p className="text-sm text-muted">{detail.ref} · {fmt(detail.createdAt)}</p></div>
              <button onClick={() => setDetail(null)} aria-label="বন্ধ করুন" className="rounded p-1.5 hover:bg-gray-100"><X size={18} /></button>
            </div>
            {detail.photo && <img src={detail.photo} alt={detail.name} className="mt-4 h-40 w-40 rounded object-cover" />}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><p className="text-xs font-bold text-muted">মোবাইল</p><p className="text-sm">{detail.phone}</p></div>
              <div><p className="text-xs font-bold text-muted">ইমেইল</p><p className="text-sm">{detail.email || "—"}</p></div>
              <div><p className="text-xs font-bold text-muted">এলাকা</p><p className="text-sm">{[detail.district, detail.upazila, detail.union, detail.ward && `ওয়ার্ড ${detail.ward}`].filter(Boolean).join(", ")}</p></div>
              <div><p className="text-xs font-bold text-muted">পরিচয়</p><p className="text-sm">{detail.affiliation === "party" ? (detail.party || "দলীয় মনোনীত") : "স্বতন্ত্র"}</p></div>
              <div><p className="text-xs font-bold text-muted">নির্বাচন / পদ</p><p className="text-sm">{detail.electionType} · {detail.position}</p></div>
              <div><p className="text-xs font-bold text-muted">প্রার্থী-অবস্থা</p><p className="text-sm">{detail.candidateStatus || "—"}</p></div>
              {long("সংক্ষিপ্ত জীবনী", detail.bio)}
              {long("শিক্ষা ও পেশা", detail.education)}
              {long("জনসেবার অভিজ্ঞতা", detail.service)}
              {long("ইশতেহার / প্রতিশ্রুতি", detail.manifesto)}
              {long("কেন জানা উচিত", detail.why)}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-primary">{detail.status}</span>
              {STATUSES.filter((s) => s !== detail.status).map((s) => <button key={s} onClick={() => change(detail._id, s)} className="rounded border border-border px-3 py-1.5 text-xs font-bold hover:bg-gray-50">{s}</button>)}
              <button onClick={() => remove(detail._id)} className="ml-auto inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14} /> মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
