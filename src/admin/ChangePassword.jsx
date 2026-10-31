import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import Shell from "./Shell";
import api from "../utils/api";

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [status, setStatus] = useState(null); // null | "success" | "error"
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (form.newPassword.length < 8) {
      setStatus("error"); setMsg("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।"); return;
    }
    if (form.newPassword !== form.confirm) {
      setStatus("error"); setMsg("নতুন পাসওয়ার্ড দুটি মিলছে না।"); return;
    }
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setStatus("success");
      setMsg("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। অন্য ডিভাইসের পুরোনো লগইন বাতিল হয়ে গেছে।");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setStatus("error");
      setMsg(err?.response?.data?.message || "পাসওয়ার্ড পরিবর্তন করা যায়নি।");
    } finally { setLoading(false); }
  }

  const inp = "w-full border border-border px-4 py-3 focus:outline-none focus:border-primary";

  return (
    <Shell>
      <div className="max-w-md">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound size={22} className="text-primary" />
          <h1 className="text-3xl font-black">Change Password</h1>
        </div>
        <p className="text-sm text-muted mb-6">নতুন পাসওয়ার্ড hash করে ডেটাবেসে সংরক্ষিত হয় এবং সব ডিভাইসে প্রযোজ্য হয়। পরিবর্তনের পর অন্য জায়গার লগইন বাতিল হবে।</p>

        <form onSubmit={handleSubmit} className="border border-border p-5 bg-white grid gap-4">
          <div>
            <label className="block mb-1 text-xs font-bold uppercase text-gray-500">বর্তমান পাসওয়ার্ড</label>
            <input type={show.current ? "text" : "password"} className={inp} placeholder="••••••••" required
              value={form.currentPassword} onChange={e => set("currentPassword", e.target.value)} />
            <button type="button" onClick={() => setShow(v => ({ ...v, current: !v.current }))} className="mt-1 inline-flex items-center gap-1 text-sm text-primary">{show.current ? <EyeOff size={15}/> : <Eye size={15}/>} {show.current ? "Hide" : "Show"}</button>
          </div>
          <div>
            <label className="block mb-1 text-xs font-bold uppercase text-gray-500">নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label>
            <input type={show.next ? "text" : "password"} className={inp} placeholder="••••••••" required minLength={8}
              value={form.newPassword} onChange={e => set("newPassword", e.target.value)} />
            <button type="button" onClick={() => setShow(v => ({ ...v, next: !v.next }))} className="mt-1 inline-flex items-center gap-1 text-sm text-primary">{show.next ? <EyeOff size={15}/> : <Eye size={15}/>} {show.next ? "Hide" : "Show"}</button>
          </div>
          <div>
            <label className="block mb-1 text-xs font-bold uppercase text-gray-500">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
            <input type={show.confirm ? "text" : "password"} className={inp} placeholder="••••••••" required
              value={form.confirm} onChange={e => set("confirm", e.target.value)} />
            <button type="button" onClick={() => setShow(v => ({ ...v, confirm: !v.confirm }))} className="mt-1 inline-flex items-center gap-1 text-sm text-primary">{show.confirm ? <EyeOff size={15}/> : <Eye size={15}/>} {show.confirm ? "Hide" : "Show"}</button>
          </div>

          {status && (
            <div className={`px-4 py-3 text-sm font-bold ${status === "success" ? "bg-primary/5 text-primary border border-primary/20" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {status === "success" ? "✓ " : "✗ "}{msg}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-3 font-bold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
