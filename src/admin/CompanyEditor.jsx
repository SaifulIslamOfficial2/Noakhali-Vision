import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Shell from "./Shell";
import api, { imageUrl } from "../utils/api";

const blank = { name: "", slug: "", description: "", website: "", contactEmail: "", status: "active" };

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* ── Confirm Delete Modal ────────────────────────────────────────── */
function ConfirmModal({ item, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white border border-border p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-black mb-2">Company ডিলিট করবেন?</h3>
        <p className="text-sm text-gray-600 mb-5">
          <span className="font-bold text-gray-900">"{item.name}"</span> — এই company টি স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
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

export default function CompanyEditor({ list }) {
  const [items, setItems]       = useState([]);
  const [form, setForm]         = useState(blank);
  const [file, setFile]         = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { id } = useParams();
  const nav = useNavigate();

  useEffect(() => {
    if (list) api.get("/companies").then(r => setItems(r.data.companies || [])).catch(() => {});
    if (id)   api.get(`/companies/${id}`).then(r => setForm(r.data.company)).catch(() => {});
  }, [list, id]);

  async function save(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const b = new FormData();
      Object.entries(form).forEach(([k, v]) => b.append(k, v || ""));
      if (file) b.append("logo", file);
      id ? await api.put(`/companies/${id}`, b) : await api.post("/companies", b);
      nav("/admin/companies");
    } catch (err) {
      setError(err.response?.data?.message || "সংরক্ষণ করা যায়নি।");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/companies/${deleteTarget._id}`);
      setItems(prev => prev.filter(c => c._id !== deleteTarget._id));
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
        <h1 className="text-3xl font-black">Companies</h1>
        <Link className="bg-primary px-4 py-3 font-bold text-white hover:opacity-90" to="/admin/companies/new">+ Add Company</Link>
      </div>

      <div className="mt-6 grid gap-3">
        {items.length === 0 && <p className="text-muted text-sm">No companies yet.</p>}
        {items.map(c => (
          <div key={c._id} className="flex items-center gap-4 border border-border p-4 hover:border-primary transition-colors">
            {/* Logo */}
            <img className="h-12 w-12 object-cover border border-border flex-shrink-0 rounded"
              src={imageUrl(c.logo || "/logo.svg")} alt={c.name} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <b className="font-bold">{c.name}</b>
              <p className="text-xs text-muted">{c.status}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Link
                to={`/admin/companies/${c._id}/edit`}
                className="px-3 py-2 text-xs font-bold border border-border hover:border-primary hover:text-primary transition-colors"
              >
                ✏ Edit
              </Link>
              <button
                onClick={() => setDeleteTarget(c)}
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
        <Link to="/admin/companies" className="text-sm text-muted hover:text-primary">← Back to Companies</Link>
      </div>
      <h1 className="text-3xl font-black">{id ? "Edit" : "Add"} Company</h1>

      <form onSubmit={save} className="mt-6 grid max-w-4xl gap-5 border border-border p-5">
        {error && <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">⚠ {error}</div>}

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Company Name</label>
          <input className={inp} placeholder="Company Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value, slug: form.slug || toSlug(e.target.value) })} required />
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Slug</label>
          <input className={inp} placeholder="company-slug" value={form.slug}
            onChange={e => setForm({ ...form, slug: toSlug(e.target.value) })} required />
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Logo</label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
          {form.logo && !file && <img className="mt-2 h-16 w-16 object-cover border border-border rounded" src={imageUrl(form.logo)} alt="" />}
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Description</label>
          <textarea className={`${inp} min-h-32`} placeholder="Company description..." value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} required />
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Website</label>
          <input className={inp} placeholder="https://example.com" value={form.website}
            onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase text-gray-500">Contact Email</label>
          <input className={inp} type="email" placeholder="contact@example.com" value={form.contactEmail}
            onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
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
            {saving ? "Saving..." : "Save Company"}
          </button>
          <Link to="/admin/companies" className="px-5 py-3 border border-border font-bold hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </Shell>
  );
}
