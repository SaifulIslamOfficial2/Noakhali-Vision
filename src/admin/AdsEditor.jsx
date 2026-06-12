import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Shell from "./Shell";
import api, { imageUrl } from "../utils/api";

const blank = { title: "", link: "", placement: "homepage", adType: "banner", status: "active" };

/* ── Confirm Delete Modal ────────────────────────────────────────── */
function ConfirmModal({ item, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white border border-border p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-black mb-2">Ad ডিলিট করবেন?</h3>
        <p className="text-sm text-gray-600 mb-5">
          <span className="font-bold text-gray-900">"{item.title}"</span> — এই ad টি স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 bg-red-600 text-white font-bold py-2.5 hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting ? "মুছছে..." : "হ্যাঁ, ডিলিট করুন"}
          </button>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 border border-border font-bold py-2.5 hover:bg-gray-50 transition-colors"
          >
            বাতিল
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdsEditor({ list }) {
  const [items, setItems]       = useState([]);
  const [form, setForm]         = useState(blank);
  const [file, setFile]         = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // item to delete
  const [deleting, setDeleting] = useState(false);
  const { id } = useParams();
  const nav = useNavigate();

  useEffect(() => {
    if (list) api.get("/ads").then(r => setItems(r.data.ads || [])).catch(() => {});
    if (id)   api.get(`/ads/${id}`).then(r => setForm(r.data.ad)).catch(() => {});
  }, [list, id]);

  async function save(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const b = new FormData();
      Object.entries(form).forEach(([k, v]) => b.append(k, v || ""));
      if (file) b.append("image", file);
      id ? await api.put(`/ads/${id}`, b) : await api.post("/ads", b);
      nav("/admin/ads");
    } catch (err) {
      setError(err.response?.data?.message || "সংরক্ষণ করা যায়নি।");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/ads/${deleteTarget._id}`);
      setItems(prev => prev.filter(a => a._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "ডিলিট করা যায়নি।");
    } finally {
      setDeleting(false);
    }
  }

  const inp = "border border-border px-4 py-3 w-full focus:outline-none focus:border-primary";

  /* ── List view ── */
  if (list) return (
    <Shell>
      {deleteTarget && (
        <ConfirmModal
          item={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Ad Cards</h1>
        <Link className="bg-primary px-4 py-3 font-bold text-white hover:opacity-90" to="/admin/ads/new">+ Add Ad</Link>
      </div>

      <div className="mt-6 grid gap-3">
        {items.length === 0 && <p className="text-muted text-sm">No ads yet.</p>}
        {items.map(a => (
          <div key={a._id} className="flex items-center gap-4 border border-border p-4 hover:border-primary transition-colors">
            {/* Thumbnail */}
            <img className="h-14 w-24 object-cover border border-border flex-shrink-0" src={imageUrl(a.image)} alt={a.title} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <b className="font-bold">{a.title}</b>
              <p className="text-xs text-muted">{a.placement} · {a.adType || "banner"} · {a.status}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Link
                to={`/admin/ads/${a._id}/edit`}
                className="px-3 py-2 text-xs font-bold border border-border hover:border-primary hover:text-primary transition-colors"
              >
                ✏ Edit
              </Link>
              <button
                onClick={() => setDeleteTarget(a)}
                className="px-3 py-2 text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );

  /* ── Create / Edit form ── */
  return (
    <Shell>
      <div className="flex items-center gap-3 mb-1">
        <Link to="/admin/ads" className="text-sm text-muted hover:text-primary">← Back to Ads</Link>
      </div>
      <h1 className="text-3xl font-black">{id ? "Edit" : "Add"} Ad Card</h1>

      <form onSubmit={save} className="mt-6 grid max-w-4xl gap-5 border border-border p-5">
        {error && <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">⚠ {error}</div>}

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Ad Title</label>
          <input className={inp} placeholder="Ad Title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Ad Image</label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} required={!id} />
          {form.image && !file && <img className="mt-2 h-20 w-auto object-cover border border-border" src={imageUrl(form.image)} alt="" />}
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Ad Link (URL)</label>
          <input className={inp} placeholder="https://example.com" value={form.link}
            onChange={e => setForm({ ...form, link: e.target.value })} />
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Ad Type (ধরন)</label>
          <select className={inp} value={form.adType || "banner"} onChange={e => setForm({ ...form, adType: e.target.value })}>
            <option value="banner">Banner (চওড়া — যেমন সালাদ ad)</option>
            <option value="square">Square (চৌকো — যেমন Crede ad)</option>
          </select>
          <p className="mt-1 text-xs text-gray-400">Banner: full width, চাপা। Square: portrait/box style।</p>
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Placement</label>
          <select className={inp} value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })}>
            <option value="homepage">Homepage</option>
            <option value="news-details">News Details</option>
            <option value="company">Company Page</option>
            <option value="partnership">Partnership Page</option>
            <option value="all">All Pages</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Status</label>
          <select className={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button disabled={saving} className="bg-primary px-5 py-3 font-bold text-white hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving..." : "Save Ad"}
          </button>
          <Link to="/admin/ads" className="px-5 py-3 border border-border font-bold hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </Shell>
  );
}
