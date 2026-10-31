import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users, Trash2, ShieldCheck, Newspaper } from "lucide-react";
import Shell from "./Shell";
import api from "../utils/api";

const ROLES = ["News Presenter", "Moderator", "Manager"];
const empty = { name: "", email: "", role: "News Presenter", phone: "", status: "active", password: "", permissions: ["news.read"] };
const PERMISSIONS = [{id:"news.read",label:"সংবাদ দেখা"},{id:"news.create",label:"সংবাদ তৈরি"},{id:"news.edit",label:"সংবাদ সম্পাদনা"},{id:"news.delete",label:"সংবাদ মুছুন"},{id:"comments.moderate",label:"মন্তব্য পরিচালনা"},{id:"categories.manage",label:"বিভাগ পরিচালনা"},{id:"media.manage",label:"মিডিয়া পরিচালনা"}];

export default function StaffRoles() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api.get("/staff");
      setStaff(r.data.staff || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "তালিকা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function save(e) {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form }; if (!payload.password) delete payload.password; await api.put(`/staff/${encodeURIComponent(editing)}`, payload);
        setMessage("সদস্যের তথ্য আপডেট হয়েছে।");
      } else {
        await api.post("/staff", form);
        setMessage("নতুন সম্পাদকীয় সদস্য সংরক্ষণ হয়েছে।");
      }
      setForm(empty);
      setEditing("");
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  }

  function edit(member) {
    setForm({ name: member.name, email: member.email, role: member.role, phone: member.phone || "", status: member.status || "active", password: "", permissions: member.permissions || ["news.read"] });
    setEditing(member._id);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id) {
    if (!window.confirm("এই সদস্যকে তালিকা থেকে মুছে ফেলবেন?")) return;
    try {
      await api.delete(`/staff/${encodeURIComponent(id)}`);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "মুছে ফেলা যায়নি।");
    }
  }

  const input = "w-full rounded border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
  return (
    <Shell>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3 text-primary"><Users size={24} /></div>
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Editorial Staff & Roles</h1>
          <p className="mt-1 text-sm text-muted">News Presenter, Moderator এবং Manager-এর তালিকা ও ভূমিকা পরিচালনা করুন।</p>
        </div>
      </div>
      <div className="mb-6 rounded-lg border border-secondary/30 bg-secondary/10 p-4 text-sm leading-6">
        <strong>নোট:</strong> এখানে সদস্য যোগ করলে আলাদা লগইন অ্যাকাউন্ট তৈরি হবে। পাসওয়ার্ড হ্যাশ করে সংরক্ষিত হয় এবং অনুমতি সার্ভারেও যাচাই করা হয়।
      </div>
      <form onSubmit={save} className="mb-8 grid gap-4 rounded-xl border border-border bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2 flex items-center gap-2 font-bold"><UserPlus size={18} className="text-primary" />{editing ? "সদস্যের তথ্য সম্পাদনা" : "নতুন সদস্য যোগ করুন"}</div>
        <label className="grid gap-1 text-sm font-semibold">পূর্ণ নাম<input className={input} required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="নাম লিখুন" /></label>
        <label className="grid gap-1 text-sm font-semibold">ইমেইল<input className={input} type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" /></label>
        <label className="grid gap-1 text-sm font-semibold">ভূমিকা<select className={input} value={form.role} onChange={(e) => set("role", e.target.value)}>{ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">মোবাইল (ঐচ্ছিক)<input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="মোবাইল নম্বর" /></label>
        <label className="grid gap-1 text-sm font-semibold">স্ট্যাটাস<select className={input} value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label className="grid gap-1 text-sm font-semibold">{editing ? "নতুন পাসওয়ার্ড (পরিবর্তন করতে চাইলে দিন)" : "লগইন পাসওয়ার্ড *"}<input className={input} type="password" minLength={8} required={!editing} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="কমপক্ষে ৮ অক্ষর" /></label>
        <fieldset className="sm:col-span-2 rounded border border-border p-3"><legend className="px-1 text-sm font-bold">সেকশনভিত্তিক অনুমতি</legend><div className="grid gap-2 sm:grid-cols-2">{PERMISSIONS.map(p => <label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.permissions.includes(p.id)} onChange={e => set("permissions", e.target.checked ? [...form.permissions,p.id] : form.permissions.filter(x => x !== p.id))} />{p.label}</label>)}</div></fieldset>
        <div className="flex items-end gap-2">
          <button disabled={saving} className="rounded bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60" type="submit">{saving ? "সংরক্ষণ হচ্ছে…" : editing ? "তথ্য আপডেট করুন" : "সদস্য যোগ করুন"}</button>
          {editing && <button type="button" className="rounded border border-border px-4 py-2.5 text-sm font-bold" onClick={() => { setEditing(""); setForm(empty); }}>বাতিল</button>}
        </div>
        {message && <p className="sm:col-span-2 text-sm font-semibold text-primary" role="status">{message}</p>}
      </form>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black">সদস্য তালিকা</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{staff.length} জন</span>
      </div>
      {loading ? <p className="p-6 text-sm text-muted">লোড হচ্ছে…</p> : staff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted"><ShieldCheck className="mx-auto mb-3 text-primary" size={30} />এখনো কোনো সম্পাদকীয় সদস্য যোগ করা হয়নি।</div>
      ) : (
        <div className="grid gap-3">
          {staff.map((member) => (
            <article key={member._id} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 transition hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary/15 p-3 text-primary"><Newspaper size={20} /></div>
                <div>
                  <h3 className="font-bold">{member.name}</h3>
                  <p className="text-sm text-muted">{member.email}{member.phone ? ` · ${member.phone}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{member.role}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${member.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{member.status === "active" ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(member)} className="rounded border border-border px-3 py-2 text-sm font-bold transition hover:border-primary hover:text-primary">Edit</button>
                <button onClick={() => remove(member._id)} aria-label={`${member.name} মুছুন`} className="rounded border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Shell>
  );
}
