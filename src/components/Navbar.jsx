import { Bell, BellOff, ChevronDown, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { locations } from "../utils/data";
import { useLang } from "../utils/LanguageContext";
import { useTheme } from "../utils/ThemeContext";
import { usePushNotification } from "../utils/usePushNotification";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loc,  setLoc]  = useState(false);
  const [so,   setSo]   = useState(false);
  const [q,    setQ]    = useState("");
  const nav = useNavigate();
  const { lang, toggle, tr } = useLang();
  const { dark, toggle: toggleDark } = useTheme();
  const { status, loading, subscribe, unsubscribe } = usePushNotification();
  const n   = tr.nav;
  const ref = useRef();

  // Desktop location dropdown outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setLoc(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Body scroll lock when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close mobile menu on route change
  const closeMenu = () => setOpen(false);

  const go = e => {
    e.preventDefault();
    if (q.trim()) { setSo(false); closeMenu(); nav(`/search?q=${encodeURIComponent(q.trim())}`); setQ(""); }
  };

  const linkCls = ({ isActive }) =>
    `font-black uppercase tracking-wide text-sm whitespace-nowrap transition-colors ${
      isActive ? "text-primary" : "text-ink hover:text-primary"
    }`;

  const navLinks = [
    { to: "/",               label: n.home },
    { to: "/news",           label: n.news },
    { to: "/premium-member", label: n.premiumMember },
    { to: "/partnership",    label: n.partnership },
    { to: "/company",        label: n.company },
    { to: "/team",           label: n.team },
    { to: "/about",          label: n.about },
  ];

  const handleBell = () => {
    if (status === "granted") unsubscribe();
    else subscribe();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white dark:bg-[#1a1a1a] shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 h-14 sm:h-16">

          {/* Logo */}
          <Link className="flex items-center gap-2 shrink-0 min-w-0" to="/" onClick={closeMenu}>
            <img src="/logo.svg" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0" alt="logo" />
            <span className="flex flex-col min-w-0">
              <b className="block text-sm sm:text-base font-black uppercase tracking-widest truncate leading-tight">
                NOAKHALI VISION
              </b>
              <small className="text-[9px] font-bold uppercase tracking-widest text-muted hidden sm:block">
                {n.tagline}
              </small>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-4 2xl:gap-5">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} className={linkCls} to={to} end={to === "/"}>{label}</NavLink>
            ))}

            {/* Locations dropdown */}
            <div className="relative" ref={ref}>
              <button
                type="button"
                onClick={() => setLoc(v => !v)}
                className="flex items-center gap-1 text-sm font-black uppercase tracking-wide whitespace-nowrap hover:text-primary transition-colors"
              >
                {n.locations} <ChevronDown size={13} className={`transition-transform ${loc ? "rotate-180" : ""}`} />
              </button>
              {loc && (
                <div className="absolute left-0 top-9 z-50 w-48 border border-border bg-white dark:bg-[#1a1a1a] shadow-xl rounded-sm overflow-hidden max-h-72 overflow-y-auto">
                  {locations.map(x => (
                    <Link key={x.slug} to={`/location/${x.slug}`} onClick={() => setLoc(false)}
                      className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-bold hover:bg-gray-50 hover:text-primary transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {lang === "bn" ? x.bn : x.en}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

            {/* Language toggle */}
            <button onClick={toggle} aria-label="Toggle language"
              className="flex items-center gap-1 select-none focus:outline-none px-1 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {lang === "en" ? (
                <>
                  <svg viewBox="0 0 30 20" width="24" height="16" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shadow-sm shrink-0">
                    <rect width="30" height="20" fill="#B22234"/>
                    <rect y="1.54" width="30" height="1.54" fill="#fff"/><rect y="4.62" width="30" height="1.54" fill="#fff"/>
                    <rect y="7.69" width="30" height="1.54" fill="#fff"/><rect y="10.77" width="30" height="1.54" fill="#fff"/>
                    <rect y="13.85" width="30" height="1.54" fill="#fff"/><rect y="16.92" width="30" height="1.54" fill="#fff"/>
                    <rect width="12" height="10.77" fill="#3C3B6E"/>
                  </svg>
                  <span className="text-[10px] font-black uppercase text-primary hidden sm:block">EN</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 30 20" width="24" height="16" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shadow-sm shrink-0">
                    <rect width="30" height="20" fill="#006a4e"/>
                    <circle cx="14" cy="10" r="6" fill="#f42a41"/>
                  </svg>
                  <span className="text-[10px] font-black text-primary hidden sm:block">বাং</span>
                </>
              )}
            </button>

            {/* Dark mode */}
            <button onClick={toggleDark} aria-label="Toggle dark mode"
              className="grid h-8 w-8 place-items-center rounded border border-border hover:border-primary hover:text-primary transition-colors">
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Push notification bell */}
            {status !== "unsupported" && status !== "denied" && (
              <button onClick={handleBell} disabled={loading} aria-label="Push notifications"
                className={`grid h-8 w-8 place-items-center rounded border transition-colors ${
                  status === "granted"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-border hover:border-primary hover:text-primary"
                }`}>
                {status === "granted" ? <Bell size={14} /> : <BellOff size={14} />}
              </button>
            )}

            {/* Search */}
            <button
              className="grid h-8 w-8 place-items-center rounded border border-border hover:border-primary hover:text-primary transition-colors"
              onClick={() => setSo(v => !v)}>
              {so ? <X size={14} /> : <Search size={14} />}
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="xl:hidden grid h-8 w-8 place-items-center rounded border border-border hover:border-primary transition-colors"
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle menu">
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </nav>

        {/* Search bar */}
        {so && (
          <div className="border-t border-border bg-gray-50 dark:bg-[#111]">
            <form onSubmit={go} className="mx-auto flex max-w-7xl gap-2 px-3 sm:px-4 py-2.5">
              <input
                className="flex-1 min-w-0 border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white dark:bg-[#222] text-ink"
                value={q} onChange={e => setQ(e.target.value)}
                placeholder={n.searchPlaceholder} autoFocus
              />
              <button className="bg-primary px-4 sm:px-6 text-sm font-black uppercase text-white hover:bg-secondary transition-colors shrink-0">
                {n.search}
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu — outside header so it overlays content properly */}
      {open && (
        <div
          className="xl:hidden fixed inset-0 z-50 bg-black/40"
          onClick={closeMenu}
        >
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white dark:bg-[#1a1a1a] shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile menu header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <Link className="flex items-center gap-2" to="/" onClick={closeMenu}>
                <img src="/logo.svg" className="h-7 w-7" alt="logo" />
                <b className="text-sm font-black uppercase tracking-wider">NOAKHALI VISION</b>
              </Link>
              <button onClick={closeMenu} className="grid h-8 w-8 place-items-center rounded border border-border">
                <X size={16} />
              </button>
            </div>

            {/* Nav links */}
            <div className="py-2">
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === "/"} onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center px-5 py-3.5 text-sm font-black uppercase tracking-wide border-b border-border/40 transition-colors ${
                      isActive ? "text-primary bg-primary/5" : "text-ink hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Locations */}
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs font-black uppercase tracking-widest text-muted mb-2">{n.locations}</p>
              <div className="grid grid-cols-2 gap-1">
                {locations.map(x => (
                  <Link key={x.slug} to={`/location/${x.slug}`} onClick={closeMenu}
                    className="flex items-center gap-1.5 px-2 py-2 text-xs font-semibold rounded hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {lang === "bn" ? x.bn : x.en}
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom controls */}
            <div className="px-4 py-4 border-t border-border flex flex-col gap-3">
              <button onClick={toggleDark}
                className="flex items-center gap-2 text-sm font-bold text-ink hover:text-primary transition-colors">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
                {dark ? n.darkOff : n.darkOn}
              </button>
              {status !== "unsupported" && status !== "denied" && (
                <button onClick={handleBell} disabled={loading}
                  className="flex items-center gap-2 text-sm font-bold text-ink hover:text-primary transition-colors">
                  {status === "granted" ? <Bell size={16} className="text-primary" /> : <BellOff size={16} />}
                  {status === "granted" ? n.notifOn : n.notifOff}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
