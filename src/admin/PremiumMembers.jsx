import {
  Activity, AlertCircle, BadgeCheck, CheckCircle2, ChevronDown,
  Edit3, Eye, Facebook, FileText, Image, MoreVertical, RefreshCw,
  RotateCcw, Search, Shield, ShieldOff, Trash2, Upload, X, XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api, { imageUrl } from "../utils/api";
import Shell from "./Shell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const daysLeft = (expiryDate) => {
  if (!expiryDate) return null;
  const diff = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  return diff;
};

const STATUS_CONFIG = {
  Active:    { bg: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-500" },
  Pending:   { bg: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
  Rejected:  { bg: "bg-red-50 text-red-700 border-red-200",         dot: "bg-red-500" },
  Suspended: { bg: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  Expired:   { bg: "bg-gray-100 text-gray-600 border-gray-200",     dot: "bg-gray-400" },
};

const NEWS_STATUS = {
  Pending:  "bg-amber-50 text-amber-700",
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

function Badge({ value }) {
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.Expired;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {value}
    </span>
  );
}

function StatCard({ label, value, color = "text-primary", icon: Icon }) {
  return (
    <div className="flex items-center gap-4 border border-border bg-white p-5 shadow-sm">
      {Icon && (
        <div className={`rounded-lg bg-gray-50 p-3 ${color}`}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className={`text-3xl font-black ${color}`}>{value ?? 0}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PremiumMembers() {
  const [members, setMembers] = useState([]);
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tab, setTab] = useState("members"); // "members" | "news"
  const [selected, setSelected] = useState(null); // member being viewed/edited
  const [form, setForm] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [shotFile, setShotFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [newsStatusFilter, setNewsStatusFilter] = useState("");
  const searchTimeout = useRef(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  async function loadStats() {
    try {
      const r = await api.get("/premium/stats");
      setStats(r.data);
    } catch {}
  }

  async function loadMembers(q = search, sf = statusFilter) {
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (sf) params.set("status", sf);
      const r = await api.get(`/premium/members?${params}`);
      setMembers(r.data.members);
    } catch {}
  }

  async function loadNews(sf = newsStatusFilter) {
    try {
      const params = sf ? `?status=${sf}` : "";
      const r = await api.get(`/premium/news${params}`);
      setNews(r.data.submissions);
    } catch {}
  }

  useEffect(() => {
    loadStats();
    loadMembers();
    loadNews();
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadMembers(search, statusFilter), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search, statusFilter]);

  useEffect(() => { loadNews(newsStatusFilter); }, [newsStatusFilter]);

  // ── Toast ───────────────────────────────────────────────────────────────────

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  // ── Member actions ──────────────────────────────────────────────────────────

  async function doAction(memberId, action, label) {
    setActionLoading(`${memberId}-${action}`);
    try {
      await api.patch(`/premium/members/${memberId}/${action}`);
      await Promise.all([loadStats(), loadMembers()]);
      if (selected?.memberId === memberId) {
        const r = await api.get(`/premium/members/${memberId}`);
        setSelected(r.data.member);
        setForm({ ...r.data.member });
      }
      showToast(`${label} successful`);
    } catch (e) {
      showToast(e.response?.data?.message || `${label} failed`);
    } finally {
      setActionLoading("");
    }
  }

  async function deleteMember(memberId) {
    if (!confirm("Delete this premium member and all their news submissions? This cannot be undone.")) return;
    try {
      await api.delete(`/premium/members/${memberId}`);
      if (selected?.memberId === memberId) setSelected(null);
      await Promise.all([loadStats(), loadMembers()]);
      showToast("Member deleted");
    } catch (e) {
      showToast(e.response?.data?.message || "Delete failed");
    }
  }

  function openMember(m) {
    setSelected(m);
    setForm({ ...m });
    setPhotoFile(null);
    setShotFile(null);
    setTab("members");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveMember(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      const fields = ["name","facebookUrl","phone","email","address","bio","bkashSenderNumber","transactionId","membershipStatus"];
      fields.forEach((k) => fd.append(k, form[k] || ""));
      if (photoFile) fd.append("photo", photoFile);
      if (shotFile) fd.append("paymentScreenshot", shotFile);
      await api.put(`/premium/members/${form.memberId}`, fd);
      await Promise.all([loadStats(), loadMembers()]);
      showToast("Member profile updated");
      setPhotoFile(null);
      setShotFile(null);
    } catch (e) {
      showToast(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function resetNewsCount() {
    if (!confirm("Reset news count for this member?")) return;
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ""));
      fd.append("resetNewsCount", "true");
      await api.put(`/premium/members/${form.memberId}`, fd);
      await loadMembers();
      setForm((f) => ({ ...f, newsCount: 0, publishedNewsCount: 0 }));
      showToast("News count reset");
    } catch (e) {
      showToast(e.response?.data?.message || "Reset failed");
    }
  }

  // ── News actions ─────────────────────────────────────────────────────────────

  async function newsAction(id, action) {
    setActionLoading(`news-${id}-${action}`);
    try {
      if (action === "delete") {
        if (!confirm("Delete this premium news submission?")) return;
        await api.delete(`/premium/news/${id}`);
        showToast("News deleted");
      } else {
        await api.patch(`/premium/news/${id}/${action}`);
        showToast(`News ${action}d`);
      }
      await Promise.all([loadNews(newsStatusFilter), loadStats(), loadMembers()]);
    } catch (e) {
      showToast(e.response?.data?.message || "Action failed");
    } finally {
      setActionLoading("");
    }
  }

  async function saveNews(e, id) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.put(`/premium/news/${id}`, fd);
      await loadNews(newsStatusFilter);
      showToast("News updated");
    } catch (e) {
      showToast(e.response?.data?.message || "Update failed");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const days = selected ? daysLeft(selected.expiryDate) : null;

  return (
    <Shell>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 border border-border bg-white px-5 py-3 shadow-lg">
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          <span className="font-semibold">{toast}</span>
        </div>
      )}

      {/* Screenshot modal */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <div className="relative max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 shadow"
              onClick={() => setScreenshotModal(null)}
            >
              <X size={16} />
            </button>
            <img
              src={imageUrl(screenshotModal)}
              className="max-h-[88vh] w-full object-contain"
              alt="Payment Screenshot"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Premium Members</h1>
          <p className="mt-1 text-sm text-muted">
            Manage membership requests, payment verification, profiles, renewals and premium news.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { loadStats(); loadMembers(); loadNews(); showToast("Refreshed"); }}
            className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-bold hover:bg-gray-50"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Members" value={stats.total} icon={BadgeCheck} />
        <StatCard label="Pending" value={stats.pending} color="text-amber-600" icon={AlertCircle} />
        <StatCard label="Active" value={stats.active} color="text-green-600" icon={Activity} />
        <StatCard label="Suspended" value={stats.suspended} color="text-purple-600" icon={ShieldOff} />
        <StatCard label="Expired" value={stats.expired} color="text-gray-500" icon={XCircle} />
        <StatCard label="News Submitted" value={stats.totalNewsSubmitted} icon={FileText} />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-0 border-b border-border">
        {[["members", "Members"], ["news", "Premium News"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Members Tab ─────────────────────────────────────────────────────── */}
      {tab === "members" && (
        <>
          {/* Search & Filter */}
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="w-full border border-border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search NV-0001, name, phone, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {["Pending","Active","Rejected","Suspended","Expired"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Member Table */}
          <div className="mt-4 overflow-x-auto border border-border">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Photo","Member ID","Name","Phone","Facebook","Join Date","Expiry","Status","News","Actions"].map((h) => (
                    <th className="p-3 text-xs font-black uppercase tracking-wide text-muted" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted">
                      No members found
                    </td>
                  </tr>
                )}
                {members.map((m) => {
                  const exp = daysLeft(m.expiryDate);
                  const loading = actionLoading.startsWith(m.memberId);
                  return (
                    <tr className="border-t border-border hover:bg-gray-50/50 transition-colors" key={m._id}>
                      {/* Photo */}
                      <td className="p-3">
                        <img
                          src={imageUrl(m.photo)}
                          alt={m.name}
                          className="h-11 w-11 rounded-full object-cover border border-border"
                          onError={(e) => { e.target.src = "/logo.svg"; }}
                        />
                      </td>
                      {/* Member ID */}
                      <td className="p-3 font-black text-primary">{m.memberId}</td>
                      {/* Name */}
                      <td className="p-3 font-semibold">{m.name}</td>
                      {/* Phone */}
                      <td className="p-3 text-muted">{m.phone}</td>
                      {/* Facebook */}
                      <td className="p-3">
                        <a
                          href={m.facebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Facebook size={13} /> View
                        </a>
                      </td>
                      {/* Join Date */}
                      <td className="p-3 text-muted">{fmtDate(m.joinDate)}</td>
                      {/* Expiry */}
                      <td className="p-3">
                        <span className={exp !== null && exp <= 30 && m.membershipStatus === "Active" ? "text-red-600 font-bold" : "text-muted"}>
                          {m.membershipStatus === "Active" || m.membershipStatus === "Expired"
                            ? fmtDate(m.expiryDate)
                            : "—"}
                          {exp !== null && exp <= 30 && exp > 0 && m.membershipStatus === "Active" && (
                            <span className="ml-1 text-xs text-red-500">({exp}d)</span>
                          )}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="p-3"><Badge value={m.membershipStatus} /></td>
                      {/* News */}
                      <td className="p-3">
                        <span className="font-semibold">{m.newsCount || 0}</span>
                        <span className="text-muted">/12</span>
                      </td>
                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          <ActionBtn
                            title="View / Edit"
                            icon={<Eye size={14} />}
                            onClick={() => openMember(m)}
                            className="border border-border hover:bg-gray-50"
                          />
                          {m.paymentScreenshot && (
                            <ActionBtn
                              title="View Payment Screenshot"
                              icon={<Image size={14} />}
                              onClick={() => setScreenshotModal(m.paymentScreenshot)}
                              className="border border-border hover:bg-gray-50"
                            />
                          )}
                          {m.membershipStatus === "Pending" && (
                            <>
                              <ActionBtn
                                title="Approve Member"
                                icon={<CheckCircle2 size={14} />}
                                onClick={() => doAction(m.memberId, "approve", "Approval")}
                                disabled={loading}
                                className="border border-green-300 text-green-700 hover:bg-green-50"
                              />
                              <ActionBtn
                                title="Reject Member"
                                icon={<XCircle size={14} />}
                                onClick={() => doAction(m.memberId, "reject", "Rejection")}
                                disabled={loading}
                                className="border border-red-200 text-red-600 hover:bg-red-50"
                              />
                            </>
                          )}
                          {m.membershipStatus === "Active" && (
                            <ActionBtn
                              title="Suspend Member"
                              icon={<ShieldOff size={14} />}
                              onClick={() => doAction(m.memberId, "suspend", "Suspension")}
                              disabled={loading}
                              className="border border-purple-200 text-purple-700 hover:bg-purple-50"
                            />
                          )}
                          {(m.membershipStatus === "Suspended" || m.membershipStatus === "Rejected") && (
                            <ActionBtn
                              title="Activate Member"
                              icon={<Activity size={14} />}
                              onClick={() => doAction(m.memberId, "activate", "Activation")}
                              disabled={loading}
                              className="border border-green-200 text-green-700 hover:bg-green-50"
                            />
                          )}
                          {(m.membershipStatus === "Active" || m.membershipStatus === "Expired") && (
                            <ActionBtn
                              title="Renew Membership"
                              icon={<RotateCcw size={14} />}
                              onClick={() => doAction(m.memberId, "renew", "Renewal")}
                              disabled={loading}
                              className="border border-primary text-primary hover:bg-primary/5"
                            />
                          )}
                          <ActionBtn
                            title="Delete Member"
                            icon={<Trash2 size={14} />}
                            onClick={() => deleteMember(m.memberId)}
                            disabled={loading}
                            className="border border-red-200 text-red-600 hover:bg-red-50"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Member Edit Panel */}
          {selected && (
            <div className="mt-8 border border-border bg-white shadow-sm">
              {/* Panel header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-gray-50 px-6 py-5">
                <div className="flex items-center gap-4">
                  <img
                    src={imageUrl(form.photo)}
                    alt={form.name}
                    className="h-16 w-16 rounded-full border-2 border-primary/20 object-cover"
                    onError={(e) => { e.target.src = "/logo.svg"; }}
                  />
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black">{form.name}</h2>
                      <Badge value={form.membershipStatus} />
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-primary">{form.memberId}</p>
                    <p className="text-xs text-muted">
                      Joined: {fmtDate(form.joinDate)} · Expires: {fmtDate(form.expiryDate)}
                      {days !== null && days <= 30 && days > 0 && form.membershipStatus === "Active" && (
                        <span className="ml-1 font-bold text-red-500">({days} days left)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.paymentScreenshot && (
                    <button
                      type="button"
                      onClick={() => setScreenshotModal(form.paymentScreenshot)}
                      className="flex items-center gap-2 border border-border bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50"
                    >
                      <Image size={15} /> View Screenshot
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-2 border border-border bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50"
                  >
                    <X size={15} /> Close
                  </button>
                </div>
              </div>

              {/* Payment info bar */}
              <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                {[
                  ["Transaction ID", form.transactionId],
                  ["bKash Sender", form.bkashSenderNumber],
                  ["News Count", `${form.newsCount || 0} / 12 (${form.publishedNewsCount || 0} published)`],
                  ["Email", form.email],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white px-4 py-3">
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold break-all">{value || "—"}</p>
                  </div>
                ))}
              </div>

              {/* Edit form */}
              <form onSubmit={saveMember} className="grid gap-5 p-6">
                <h3 className="font-black">Edit Profile</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["name","Full Name","text"],
                    ["facebookUrl","Facebook Profile URL","url"],
                    ["phone","Phone","tel"],
                    ["email","Email","email"],
                    ["bkashSenderNumber","bKash Sender Number","text"],
                    ["transactionId","Transaction ID","text"],
                  ].map(([key, label, type]) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs font-bold text-muted uppercase tracking-wide">
                        {label}
                      </label>
                      <input
                        type={type}
                        className="w-full border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={form[key] || ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted uppercase tracking-wide">
                      Membership Status
                    </label>
                    <select
                      className="w-full border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={form.membershipStatus || "Pending"}
                      onChange={(e) => setForm({ ...form, membershipStatus: e.target.value })}
                    >
                      {["Pending","Active","Rejected","Suspended","Expired"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted uppercase tracking-wide">Address</label>
                    <textarea
                      rows={2}
                      className="w-full border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={form.address || ""}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted uppercase tracking-wide">Bio</label>
                    <textarea
                      rows={2}
                      className="w-full border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={form.bio || ""}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FileUploadField
                    label="Replace Profile Photo"
                    accept="image/*"
                    file={photoFile}
                    onChange={setPhotoFile}
                  />
                  <FileUploadField
                    label="Replace Payment Screenshot"
                    accept="image/*"
                    file={shotFile}
                    onChange={setShotFile}
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Edit3 size={14} />}
                    {saving ? "Saving…" : "Save Profile"}
                  </button>
                  <button
                    type="button"
                    onClick={resetNewsCount}
                    className="flex items-center gap-2 border border-border px-5 py-2.5 text-sm font-bold hover:bg-gray-50"
                  >
                    <RotateCcw size={14} /> Reset News Count
                  </button>
                  <div className="ml-auto flex gap-2">
                    {selected.membershipStatus === "Pending" && (
                      <>
                        <button type="button" onClick={() => doAction(selected.memberId, "approve", "Approval")}
                          className="flex items-center gap-2 bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button type="button" onClick={() => doAction(selected.memberId, "reject", "Rejection")}
                          className="flex items-center gap-2 border border-red-300 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                    {selected.membershipStatus === "Active" && (
                      <>
                        <button type="button" onClick={() => doAction(selected.memberId, "renew", "Renewal")}
                          className="flex items-center gap-2 border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5">
                          <RotateCcw size={14} /> Renew
                        </button>
                        <button type="button" onClick={() => doAction(selected.memberId, "suspend", "Suspension")}
                          className="flex items-center gap-2 border border-purple-300 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50">
                          <ShieldOff size={14} /> Suspend
                        </button>
                      </>
                    )}
                    {(selected.membershipStatus === "Suspended" || selected.membershipStatus === "Rejected" || selected.membershipStatus === "Expired") && (
                      <button type="button" onClick={() => doAction(selected.memberId, "activate", "Activation")}
                        className="flex items-center gap-2 bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                        <Activity size={14} /> Activate
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* ── News Tab ──────────────────────────────────────────────────────────── */}
      {tab === "news" && (
        <>
          <div className="mt-5 flex flex-wrap gap-3">
            <select
              className="border border-border px-3 py-2.5 text-sm"
              value={newsStatusFilter}
              onChange={(e) => setNewsStatusFilter(e.target.value)}
            >
              <option value="">All News</option>
              {["Pending","Approved","Rejected"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="py-2.5 text-sm text-muted">{news.length} submissions</span>
          </div>

          <div className="mt-4 grid gap-4">
            {news.length === 0 && (
              <div className="border border-border p-8 text-center text-muted">
                No premium news submissions
              </div>
            )}
            {news.map((n) => (
              <NewsCard
                key={n._id}
                item={n}
                onAction={newsAction}
                onSave={saveNews}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBtn({ title, icon, onClick, disabled, className = "" }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded p-1.5 transition-colors disabled:opacity-40 ${className}`}
    >
      {icon}
    </button>
  );
}

function FileUploadField({ label, accept, file, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-muted uppercase tracking-wide">
        {label}
      </label>
      <label className="flex cursor-pointer items-center gap-2 border border-dashed border-border px-4 py-3 text-sm hover:bg-gray-50">
        <Upload size={15} className="text-muted" />
        <span className="text-muted">{file ? file.name : "Choose file…"}</span>
        <input type="file" accept={accept} className="sr-only" onChange={(e) => onChange(e.target.files[0] || null)} />
      </label>
    </div>
  );
}

function NewsCard({ item, onAction, onSave, actionLoading }) {
  const [expanded, setExpanded] = useState(false);
  const loading = actionLoading.startsWith(`news-${item._id}`);
  const member = item.member;

  return (
    <div className="border border-border bg-white">
      {/* Summary row */}
      <div className="flex flex-wrap items-start gap-4 p-4">
        {item.featuredImage && (
          <img
            src={imageUrl(item.featuredImage)}
            className="h-16 w-24 rounded object-cover border border-border"
            alt={item.title}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${NEWS_STATUS[item.status]}`}>
              {item.status}
            </span>
            {member && (
              <span className="text-xs font-bold text-primary">{member.memberId} — {member.name}</span>
            )}
          </div>
          <h3 className="mt-1 font-bold">{item.title}</h3>
          <p className="text-xs text-muted">{item.location} · {fmtDate(item.createdAt)}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {item.status === "Pending" && (
            <>
              <button
                disabled={loading}
                onClick={() => onAction(item._id, "approve")}
                className="flex items-center gap-1 bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={12} /> Approve
              </button>
              <button
                disabled={loading}
                onClick={() => onAction(item._id, "reject")}
                className="flex items-center gap-1 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle size={12} /> Reject
              </button>
            </>
          )}
          {item.status === "Approved" && (
            <button
              disabled={loading}
              onClick={() => onAction(item._id, "reject")}
              className="flex items-center gap-1 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle size={12} /> Reject
            </button>
          )}
          {item.status === "Rejected" && (
            <button
              disabled={loading}
              onClick={() => onAction(item._id, "approve")}
              className="flex items-center gap-1 bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 size={12} /> Approve
            </button>
          )}
          <button
            disabled={loading}
            onClick={() => onAction(item._id, "delete")}
            className="flex items-center gap-1 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={() => setExpanded((x) => !x)}
            className="flex items-center gap-1 border border-border px-3 py-1.5 text-xs font-bold hover:bg-gray-50"
          >
            <Edit3 size={12} />
            <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expanded edit */}
      {expanded && (
        <form onSubmit={(e) => onSave(e, item._id)} className="grid gap-3 border-t border-border bg-gray-50 p-4">
          <input
            name="title"
            className="w-full border border-border px-3 py-2 text-sm"
            defaultValue={item.title}
            placeholder="Title"
            required
          />
          <input
            name="location"
            className="w-full border border-border px-3 py-2 text-sm"
            defaultValue={item.location}
            placeholder="Location"
            required
          />
          <textarea
            name="shortNews"
            rows={3}
            className="w-full border border-border px-3 py-2 text-sm"
            defaultValue={item.shortNews}
            placeholder="Short News"
            required
          />
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-white">
              <Edit3 size={13} /> Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
