import {
  BadgeDollarSign, Building2, KeyRound, LayoutDashboard, LogOut, Menu, Newspaper,
  Plus, ShieldCheck, Users, X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const NAV = [
  { to: "/admin/dashboard",       icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/premium-members", icon: ShieldCheck,     label: "Premium Members" },
  { to: "/admin/news/new",        icon: Plus,            label: "Add News", highlight: true },
  { to: "/admin/companies",       icon: Building2,       label: "Companies" },
  { to: "/admin/ads",             icon: BadgeDollarSign, label: "Ads Cards" },
  { to: "/admin/team",            icon: Users,           label: "Team Members" },
  { to: "/admin/change-password", icon: KeyRound,        label: "Change Password" },
];

export default function Shell({ children }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => { localStorage.removeItem("nv_token"); nav("/admin"); };

  const SidebarContent = () => (
    <>
      <Link className="flex items-center gap-3 border-b border-border p-5" to="/admin/dashboard" onClick={() => setMobileOpen(false)}>
        <img src="/logo.svg" className="h-9 w-9" alt="Logo" />
        <span className="text-xl font-black leading-tight uppercase tracking-wider">Noakhali<br />Vision</span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV.map(({ to, icon: Icon, label, highlight }) => {
          const active = pathname === to || (to !== "/admin/dashboard" && pathname.startsWith(to));
          return (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded px-4 py-2.5 text-sm font-bold transition-colors ${
                highlight
                  ? "bg-primary text-white hover:opacity-90"
                  : active
                  ? "bg-primary/10 text-primary"
                  : "text-ink hover:bg-gray-100"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded px-4 py-2.5 text-sm font-bold text-muted hover:bg-gray-100">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-white md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 flex flex-col border-r border-border bg-white shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 hover:bg-gray-100 rounded" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <Newspaper size={18} className="text-primary hidden sm:block" />
            <span className="text-sm font-bold text-muted">Admin Panel</span>
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm font-bold hover:bg-gray-50">
            <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
