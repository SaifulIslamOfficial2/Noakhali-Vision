import {
  Activity, BadgeDollarSign, BadgeCheck, Building2, Edit, Eye,
  FileText, Newspaper, ShieldOff, Trash2, Users, XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "./Shell";
import api, { imageUrl } from "../utils/api";

function StatCard({ label, value, icon: Icon, color = "text-primary", bg = "bg-primary/5" }) {
  return (
    <div className="flex items-center gap-4 border border-border bg-white p-5 shadow-sm">
      <div className={`rounded-lg p-3 ${bg}`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className={`mt-0.5 text-3xl font-black ${color}`}>{value ?? 0}</p>
      </div>
    </div>
  );
}

const STATUS_COLOR = {
  published: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
};

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [news, setNews] = useState([]);

  async function loadData() {
    try {
      const [s, n] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/news?includeDrafts=true"),
      ]);
      setStats(s.data);
      setNews(n.data.news);
    } catch {}
  }

  useEffect(() => { loadData(); }, []);

  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  async function confirmDelete() {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/news/${delTarget._id}`);
      setNews(prev => prev.filter(n => n._id !== delTarget._id));
      const s = await api.get("/dashboard/stats");
      setStats(s.data);
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
      setDelTarget(null);
    }
  }

  return (
    <Shell>
      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white border border-border p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black mb-2">নিউজ ডিলেট করবেন?</h3>
            <p className="text-sm text-muted mb-6">
              <span className="font-bold text-ink">"{delTarget.title}"</span> — এটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? "ডিলেট হচ্ছে..." : "হ্যাঁ, ডিলেট করুন"}
              </button>
              <button onClick={() => setDelTarget(null)}
                className="flex-1 border border-border py-2.5 text-sm font-bold hover:bg-gray-50">
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-black">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Overview of all activity on Noakhali Vision</p>

      {/* News stats */}
      <section className="mt-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted">News</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total News" value={stats.totalNews} icon={Newspaper} />
          <StatCard label="Published" value={stats.publishedNews} icon={Eye} color="text-green-600" bg="bg-green-50" />
          <StatCard label="Drafts" value={stats.draftNews} icon={FileText} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Companies" value={stats.totalCompanies} icon={Building2} color="text-blue-600" bg="bg-blue-50" />
        </div>
      </section>

      {/* Premium Member stats */}
      <section className="mt-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted">Premium Members</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Members" value={stats.totalPremiumMembers} icon={Users} />
          <StatCard label="Pending Requests" value={stats.pendingPremiumMembers} icon={BadgeCheck} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Active Members" value={stats.activePremiumMembers} icon={Activity} color="text-green-600" bg="bg-green-50" />
          <StatCard label="Expired Members" value={stats.expiredPremiumMembers} icon={XCircle} color="text-gray-500" bg="bg-gray-100" />
          <StatCard label="News Submitted" value={stats.totalPremiumNewsSubmitted} icon={FileText} color="text-purple-600" bg="bg-purple-50" />
        </div>
        {stats.pendingPremiumMembers > 0 && (
          <div className="mt-3">
            <Link
              to="/admin/premium-members"
              className="inline-flex items-center gap-2 border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100"
            >
              <BadgeCheck size={15} />
              {stats.pendingPremiumMembers} pending membership{stats.pendingPremiumMembers > 1 ? "s" : ""} awaiting approval →
            </Link>
          </div>
        )}
      </section>

      {/* Visitors & Ads */}
      <section className="mt-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted">Traffic & Ads</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Visitors" value={stats.totalVisitors} icon={Eye} />
          <StatCard label="Today Visitors" value={stats.todayVisitors} icon={Activity} color="text-green-600" bg="bg-green-50" />
          <StatCard label="Ad Cards" value={stats.totalAds} icon={BadgeDollarSign} color="text-blue-600" bg="bg-blue-50" />
        </div>
      </section>

      {/* Recent News table */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Recent News</h2>
          <Link to="/admin/news/new" className="bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">
            + Add News
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto border border-border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Thumbnail", "Title", "Location", "Status", "Actions"].map((h) => (
                  <th key={h} className="p-3 text-xs font-black uppercase tracking-wide text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {news.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">No news yet</td>
                </tr>
              )}
              {news.map((n) => (
                <tr className="border-t border-border hover:bg-gray-50/50" key={n._id}>
                  <td className="p-3">
                    <img
                      src={imageUrl(n.image)}
                      className="h-11 w-16 rounded object-cover border border-border"
                      alt={n.title}
                      onError={(e) => { e.target.src = "/logo.svg"; }}
                    />
                  </td>
                  <td className="p-3 font-semibold">{n.title}</td>
                  <td className="p-3 text-muted">{n.location}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[n.status] || "bg-gray-100 text-gray-600"}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/news/${n._id}/edit`}
                        className="inline-flex items-center gap-1 border border-border p-2 hover:bg-gray-50 text-gray-600"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </Link>
                      <button
                        onClick={() => setDelTarget(n)}
                        className="inline-flex items-center gap-1 border border-red-200 p-2 text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
