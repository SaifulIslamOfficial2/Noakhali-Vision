import { useEffect, useState } from "react";
import { Check, Mail, MailOpen, RefreshCw, Send, Trash2 } from "lucide-react";
import Shell from "./Shell";
import api from "../utils/api";

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/messages"); setMessages(r.data.messages || []); }
    catch (e) { setNotice(e.response?.data?.message || "ইনবক্স লোড করা যায়নি।"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const open = async (item) => {
    setSelected(item); setReply(item.reply || "");
    if (!item.readAt) {
      try { const r = await api.patch(`/messages/${item._id}`, { read: true }); setSelected(r.data.message); await load(); }
      catch { /* keep the message readable even if marking read fails */ }
    }
  };
  const saveReply = async () => {
    if (!selected) return;
    setBusy(true); setNotice("");
    try {
      const r = await api.patch(`/messages/${selected._id}`, { reply, repliedAt: new Date().toISOString() });
      setSelected(r.data.message); setMessages(prev => prev.map(m => m._id === selected._id ? r.data.message : m));
      setNotice("রিপ্লাই নোট সংরক্ষিত হয়েছে। এটি এখনো ইমেইল হিসেবে পাঠানো হয়নি।");
    } catch (e) { setNotice(e.response?.data?.message || "রিপ্লাই সংরক্ষণ করা যায়নি।"); }
    finally { setBusy(false); }
  };
  const remove = async (item) => {
    if (!window.confirm("এই বার্তাটি মুছে ফেলবেন?")) return;
    try { await api.delete(`/messages/${item._id}`); setMessages(prev => prev.filter(m => m._id !== item._id)); if (selected?._id === item._id) setSelected(null); }
    catch (e) { setNotice(e.response?.data?.message || "মুছে ফেলা যায়নি।"); }
  };
  const unread = messages.filter(m => !m.readAt).length;
  return <Shell>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">Website Inbox</h1><p className="mt-1 text-sm text-muted">ওয়েবসাইট থেকে পাঠানো বার্তা ও যোগাযোগের অনুরোধ</p></div><button onClick={load} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-bold"><RefreshCw size={15}/> Refresh</button></div>
    {notice && <div className="mb-4 border border-border bg-white p-3 text-sm font-semibold">{notice}</div>}
    <div className="mb-4 flex gap-3 text-sm"><span className="border border-border bg-white px-3 py-2">মোট বার্তা: <b>{messages.length}</b></span><span className="border border-border bg-white px-3 py-2">অপঠিত: <b>{unread}</b></span></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(280px,.8fr)_minmax(0,1.2fr)]">
      <section className="border border-border bg-white">
        {loading ? <p className="p-6 text-sm text-muted">ইনবক্স লোড হচ্ছে…</p> : messages.length === 0 ? <div className="p-10 text-center text-muted"><Mail className="mx-auto mb-3"/><p>এখনো কোনো বার্তা আসেনি।</p></div> : <div className="max-h-[70vh] overflow-y-auto">{messages.map(m => <button key={m._id} onClick={() => open(m)} className={`block w-full border-b border-border p-4 text-left hover:bg-gray-50 ${selected?._id === m._id ? "bg-primary/5" : ""}`}><div className="flex items-start gap-3"><span className="mt-1 text-primary">{m.readAt ? <MailOpen size={17}/> : <Mail size={17}/>}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><b className="truncate text-sm">{m.name}</b>{!m.readAt && <i className="h-2 w-2 rounded-full bg-primary"/>}</span><span className="mt-1 block truncate text-xs text-muted">{m.subject || "সাধারণ যোগাযোগ"}</span><span className="mt-1 block line-clamp-2 text-xs text-muted">{m.message}</span><span className="mt-2 block text-[11px] text-muted">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</span></span></div></button>)}</div>}
      </section>
      <section className="min-w-0 border border-border bg-white p-5">
        {!selected ? <div className="flex min-h-64 flex-col items-center justify-center text-center text-muted"><MailOpen size={30} className="mb-3"/><p>বিস্তারিত দেখতে বাম পাশ থেকে একটি বার্তা নির্বাচন করুন।</p></div> : <>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4"><div><h2 className="text-xl font-black">{selected.subject || "সাধারণ যোগাযোগ"}</h2><p className="mt-1 text-sm text-muted">{selected.name} · <a className="text-primary underline" href={`mailto:${selected.email}`}>{selected.email}</a>{selected.phone ? ` · ${selected.phone}` : ""}</p><p className="mt-1 text-xs text-muted">{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}</p></div><div className="flex gap-2"><button title="Mark read" onClick={async()=>{const r=await api.patch(`/messages/${selected._id}`,{read:true});setSelected(r.data.message);await load();}} className="border border-border p-2"><Check size={16}/></button><button title="Delete" onClick={()=>remove(selected)} className="border border-red-200 p-2 text-red-600"><Trash2 size={16}/></button></div></div>
          <p className="whitespace-pre-wrap py-5 text-sm leading-7">{selected.message}</p><label className="mb-2 block text-sm font-bold">Reply / Admin note</label><textarea rows={5} value={reply} onChange={e=>setReply(e.target.value)} className="w-full border border-border p-3 text-sm outline-none focus:border-primary" placeholder="রিপ্লাই লিখুন বা ফলো-আপ নোট রাখুন…"/><div className="mt-3 flex flex-wrap items-center gap-3"><a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || "Your message to Noakhali Vision"}`)}&body=${encodeURIComponent(reply)}`} className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-bold">Open Email Reply</a><button disabled={busy} onClick={saveReply} className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><Send size={15}/>{busy ? "Saving…" : "Save Reply"}</button>{selected.reply && <span className="text-xs text-muted">আগের রিপ্লাই/নোট সংরক্ষিত আছে</span>}</div><p className="mt-3 text-xs text-muted">নোট: এই ফ্রন্টএন্ড ডেমো রিপ্লাই সংরক্ষণ করে; ইমেইল পাঠাতে সার্ভার/ইমেইল সার্ভিস সংযোগ দরকার।</p>
        </>}
      </section>
    </div>
  </Shell>;
}
