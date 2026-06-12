import { useEffect, useRef, useState } from "react";
import { Edit, Plus, Trash2, Users, X, CheckCircle, AlertCircle, Upload } from "lucide-react";
import Shell from "./Shell";
import api, { imageUrl } from "../utils/api";

const EMPTY = {
  name: "", nameBn: "", role: "", roleBn: "",
  bio: "", email: "", facebook: "", order: 0, active: true,
};

// ─── Toast ───
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 px-5 py-3 shadow-xl text-white text-sm font-bold ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// ─── Confirm Modal ───
function ConfirmModal({ name, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-border p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-black mb-2">Delete Member?</h3>
        <p className="text-sm text-muted mb-6">
          <span className="font-bold text-ink">{name}</span> কে ডিলিট করবেন? এটা পূর্বাবস্থায় ফেরানো যাবে না।
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-red-600 py-2.5 text-sm font-black uppercase text-white hover:bg-red-700">
            হ্যাঁ, ডিলিট করুন
          </button>
          <button onClick={onCancel} className="flex-1 border border-border py-2.5 text-sm font-bold hover:bg-gray-50">
            বাতিল
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member Form ───
function MemberForm({ initial, onSave, onCancel }) {
  const [form, setForm]       = useState(initial || EMPTY);
  const [photo, setPhoto]     = useState(null);
  const [preview, setPreview] = useState(initial?.photo ? imageUrl(initial.photo) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pickPhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { setError("নাম (English) আবশ্যক।"); return; }
    if (!form.role.trim()) { setError("Role (English) আবশ্যক।"); return; }
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append("photo", photo);
      if (initial?._id) await api.put(`/team/${initial._id}`, fd);
      else              await api.post("/team", fd);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally { setLoading(false); }
  };

  const field = (label, key, type = "text", placeholder = "", required = false) => (
    <div>
      <label className="mb-1 block text-xs font-black uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        className="w-full border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">

      {/* Photo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div
          className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-gray-100 cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview
            ? <img src={preview} className="h-full w-full object-cover" alt="preview" />
            : <div className="flex h-full w-full flex-col items-center justify-center text-gray-300 gap-1">
                <Users size={28} /><span className="text-xs">Photo</span>
              </div>
          }
        </div>
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wider">ছবি</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-bold hover:bg-gray-50"
          >
            <Upload size={14} /> ছবি বেছে নিন
          </button>
          <p className="mt-1 text-xs text-muted">600×600 recommended (square)</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
        </div>
      </div>

      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("Name (English)", "name", "text", "e.g. Md. Karim", true)}
        {field("নাম (বাংলায়)", "nameBn", "text", "যেমন: মো. করিম")}
        {field("Role (English)", "role", "text", "e.g. Editor in Chief", true)}
        {field("পদবি (বাংলায়)", "roleBn", "text", "যেমন: সম্পাদক")}
        {field("Email", "email", "email", "email@example.com")}
        {field("Facebook URL", "facebook", "url", "https://facebook.com/...")}
        {field("Display Order", "order", "number", "0")}
      </div>

      {/* Bio */}
      <div>
        <label className="mb-1 block text-xs font-black uppercase tracking-wider">Bio</label>
        <textarea
          className="w-full border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none resize-none"
          rows={3}
          value={form.bio}
          onChange={e => set("bio", e.target.value)}
          placeholder="Short bio..."
        />
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => set("active", !form.active)}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? "bg-primary" : "bg-gray-300"}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.active ? "left-6" : "left-1"}`} />
        </div>
        <span className="text-sm font-bold">{form.active ? "Public টিম পেজে দেখাবে" : "লুকানো (Hidden)"}</span>
      </label>

      {error && <p className="text-sm font-bold text-red-600 flex items-center gap-1"><AlertCircle size={14} />{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
        <button
          type="submit"
          disabled={loading}
          className="sm:flex-1 bg-primary px-6 py-2.5 text-sm font-black uppercase text-white hover:bg-secondary transition-colors disabled:opacity-60"
        >
          {loading ? "সেভ হচ্ছে..." : initial?._id ? "✓ আপডেট করুন" : "+ যোগ করুন"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="sm:flex-1 border border-border px-6 py-2.5 text-sm font-bold hover:bg-gray-50"
        >
          বাতিল
        </button>
      </div>
    </form>
  );
}

// ─── Main TeamEditor ───
export default function TeamEditor() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState("list"); // list | add | edit
  const [editing, setEditing]   = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/team?includeDrafts=1");
      setMembers(r.data.team);
    } catch {
      setMembers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = () => {
    showToast(editing ? "সদস্য আপডেট হয়েছে ✓" : "নতুন সদস্য যোগ হয়েছে ✓");
    setView("list");
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/team/${delTarget._id}`);
      showToast("সদস্য মুছে ফেলা হয়েছে।", "error");
      setDelTarget(null);
      load();
    } catch {
      showToast("ডিলিট করা যায়নি।", "error");
    } finally { setDeleting(false); }
  };

  // ── Form view ──
  if (view !== "list") return (
    <Shell>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => { setView("list"); setEditing(null); }}
            className="flex items-center gap-1 text-sm text-muted hover:text-primary font-bold"
          >
            ← Back
          </button>
          <h1 className="text-xl sm:text-2xl font-black">
            {view === "add" ? "নতুন সদস্য যোগ করুন" : `Edit — ${editing?.name}`}
          </h1>
        </div>
        <div className="border border-border bg-white p-4 sm:p-6">
          <MemberForm
            initial={view === "edit" ? editing : null}
            onSave={handleSave}
            onCancel={() => { setView("list"); setEditing(null); }}
          />
        </div>
      </div>
    </Shell>
  );

  // ── List view ──
  return (
    <Shell>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {delTarget && (
        <ConfirmModal
          name={delTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Team Members</h1>
          <p className="text-sm text-muted mt-0.5">{members.length} জন সদস্য</p>
        </div>
        <button
          onClick={() => { setEditing(null); setView("add"); }}
          className="flex items-center justify-center gap-2 bg-primary px-5 py-2.5 text-sm font-black uppercase text-white hover:bg-secondary transition-colors"
        >
          <Plus size={16} /> নতুন সদস্য যোগ করুন
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-24 text-center text-muted font-semibold">Loading...</div>
      ) : members.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-black text-lg mb-1">কোনো সদস্য নেই</p>
          <p className="text-sm text-muted mb-6">প্রথম টিম সদস্য যোগ করুন।</p>
          <button
            onClick={() => setView("add")}
            className="bg-primary px-6 py-2.5 text-sm font-black uppercase text-white hover:bg-secondary"
          >
            <Plus size={14} className="inline mr-1" /> যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map(m => (
            <div key={m._id} className="border border-border bg-white p-4 sm:p-5 flex flex-col gap-4">

              {/* Photo + info */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-gray-100">
                  {m.photo
                    ? <img src={imageUrl(m.photo)} className="h-full w-full object-cover" alt={m.name} />
                    : <div className="flex h-full w-full items-center justify-center text-gray-300"><Users size={22} /></div>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black truncate">{m.name}</p>
                  {m.nameBn && <p className="text-xs text-muted truncate">{m.nameBn}</p>}
                  <p className="text-xs font-bold text-primary mt-0.5 truncate">{m.role}</p>
                  {m.roleBn && <p className="text-xs text-muted truncate">{m.roleBn}</p>}
                </div>
              </div>

              {m.bio && <p className="text-xs text-muted line-clamp-2">{m.bio}</p>}

              {/* Status + actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border mt-auto">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {m.active ? "● Active" : "○ Hidden"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(m); setView("edit"); }}
                    className="flex items-center gap-1 border border-border px-3 py-1.5 text-xs font-bold hover:bg-gray-50 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setDelTarget(m)}
                    disabled={deleting}
                    className="flex items-center gap-1 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
