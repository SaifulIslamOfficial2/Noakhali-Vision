import { Bell, BellOff, ChevronDown, Menu, Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { locations } from "../utils/data";
import { useLang } from "../utils/LanguageContext";
import { usePushNotification } from "../utils/usePushNotification";
import SearchModal from "./SearchModal";
import api from "../utils/api";
import { categoryLabel } from "../utils/categories";

const itemHref = (it) => (it.type === "category" ? `/category/${encodeURIComponent(it.target)}` : it.target);
const itemFresh = (it) => !!it.badge && (!it.createdAt || Date.now() - new Date(it.createdAt).getTime() < (it.badgeDays || 14) * 86400000);

/* A menu item added by the admin: category page, site page or external link, with an optional small NEW tag on top. */
function CustomLink({ item, lang, className, onClick }) {
  // Category menu items: the English label falls back to the central category table when the admin did not type one.
  const isCat = item.type === "category";
  const label = (lang === "bn"
    ? item.labelBn || (isCat ? categoryLabel(item.target, "bn") : item.labelEn)
    : item.labelEn || (isCat ? categoryLabel(item.target, "en") : item.labelBn)) || "";
  const tag = itemFresh(item) ? <span className="nv-nav-new" aria-label="new">{lang === "bn" ? "নতুন" : "NEW"}</span> : null;
  const href = itemHref(item);
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={`relative inline-flex items-center ${typeof className === "function" ? className({ isActive: false }) : className}`}>{tag}{label}</a>;
  }
  return <NavLink to={href} onClick={onClick} className={(st) => `relative inline-flex items-center ${typeof className === "function" ? className(st) : className}`}>{tag}{label}</NavLink>;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loc,  setLoc]  = useState(false);
  const [more, setMore] = useState(false); // "More" dropdown for admin-added menu items
  const moreRef = useRef();
  const [so,   setSo]   = useState(false); // search overlay open
  const [custom, setCustom] = useState([]); // menu items added in Admin → Navbar Menu
  const nav = useNavigate();
  const { lang, setLanguage, tr } = useLang();
  const { status, loading, subscribe, unsubscribe } = usePushNotification();
  const n   = tr.nav;
  const ref = useRef();

  // Desktop location dropdown outside click
  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setLoc(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMore(false);
    };
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

  useEffect(() => {
    api.get("/nav-items").then(r => setCustom(r.data.navItems || [])).catch(() => setCustom([]));
  }, []);

  // "/" or Ctrl/Cmd+K opens search from anywhere on the public site
  useEffect(() => {
    const h = e => {
      const el = e.target;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSo(v => !v); }
      else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setSo(true); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const linkCls = ({ isActive }) =>
    `font-bold text-[13px] whitespace-nowrap transition-colors ${
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
    { to: "/careers",        label: n.careers },
  ];

  const handleBell = () => {
    if (status === "granted") unsubscribe();
    else subscribe();
  };

  return (
    <>
      <header className="navbar">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 ">

          {/* Logo */}
          <Link
            className="flex items-center shrink-0 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            to="/"
            onClick={closeMenu}
            aria-label="Noakhali Vision home"
          >
            <img
              src="/noakhali-vision-wordmark.png"
              className="h-auto w-[132px] sm:w-[172px] 2xl:w-[190px] max-w-[38vw] shrink-0 object-contain transition-opacity duration-200 hover:opacity-90"
              alt="Noakhali Vision"
              fetchPriority="high"
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-4 2xl:gap-5">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} className={linkCls} to={to} end={to === "/"}>{label}</NavLink>
            ))}
            {/* Admin-added menu items: first 3 inline on very wide screens, everything else in a "More" dropdown */}
            {custom.slice(0, 3).map(it => <span key={it._id} className="hidden 2xl:inline-flex"><CustomLink item={it} lang={lang} className={linkCls} /></span>)}
            {custom.length > 0 && (
              <div className={`relative ${custom.length > 3 ? "" : "2xl:hidden"}`} ref={moreRef}>
                <button type="button" onClick={() => setMore(v => !v)} aria-expanded={more}
                  className="flex items-center gap-1 text-[13px] font-bold whitespace-nowrap hover:text-primary transition-colors">
                  {lang === "bn" ? "আরও" : "More"} <ChevronDown size={13} className={`transition-transform ${more ? "rotate-180" : ""}`} />
                </button>
                {more && (
                  <div className="absolute left-0 top-9 z-50 w-56 border border-border bg-white shadow-xl rounded-sm overflow-hidden max-h-80 overflow-y-auto">
                    {custom.map((it, i) => (
                      <div key={it._id} className={`border-b border-border ${i < 3 ? "2xl:hidden" : ""}`}>
                        <CustomLink item={it} lang={lang} onClick={() => setMore(false)}
                          className={({ isActive }) => `flex w-full items-center px-4 py-2.5 text-sm font-bold transition-colors ${isActive ? "text-primary" : "hover:bg-gray-50 hover:text-primary"}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Locations dropdown */}
            <div className="relative" ref={ref}>
              <button
                type="button"
                onClick={() => setLoc(v => !v)}
                className="flex items-center gap-1 text-[13px] font-bold whitespace-nowrap hover:text-primary transition-colors"
              >
                {n.locations} <ChevronDown size={13} className={`transition-transform ${loc ? "rotate-180" : ""}`} />
              </button>
              {loc && (
                <div className="absolute left-0 top-9 z-50 w-48 border border-border bg-white shadow-xl rounded-sm overflow-hidden max-h-72 overflow-y-auto">
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

            {/* Language switcher: বাংলা | English */}
            <div role="group" aria-label={lang === "bn" ? "ভাষা নির্বাচন" : "Select language"}
              className="inline-flex h-8 select-none items-center overflow-hidden rounded-full border border-border bg-white text-[11px] font-black">
              {[["bn", "বাংলা", "বাং"], ["en", "English", "EN"]].map(([code, full, short]) => (
                <button key={code} type="button" onClick={() => setLanguage(code)} aria-pressed={lang === code} lang={code}
                  className={`h-full px-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3 ${lang === code ? "bg-[#0B4D35] text-white" : "text-ink hover:bg-gray-100"}`}>
                  <span className="2xl:hidden">{short}</span><span className="hidden 2xl:inline">{full}</span>
                </button>
              ))}
            </div>


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
              onClick={() => { closeMenu(); setSo(true); }}
              aria-label={n.search} title={`${n.search} ( / )`}>
              <Search size={14} />
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
      </header>

      <SearchModal open={so} onClose={() => setSo(false)} />

      {/* Mobile menu — outside header so it overlays content properly */}
      {open && (
        <div
          className="xl:hidden fixed inset-0 z-[1100] bg-black/40"
          onClick={closeMenu}
        >
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[85vw] nv-grain shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile menu header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <Link
                className="flex min-w-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                to="/"
                onClick={closeMenu}
                aria-label="Noakhali Vision home"
              >
                <img
                  src="/noakhali-vision-wordmark.png"
                  className="h-auto w-[126px] max-w-[58vw] object-contain"
                  alt="Noakhali Vision"
                />
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
                    `flex items-center px-5 py-3.5 text-sm font-bold border-b border-border/40 transition-colors ${
                      isActive ? "text-primary bg-primary/5" : "text-ink hover:text-primary hover:bg-gray-50"
                    }`
                  }>
                  {label}
                </NavLink>
              ))}
              {custom.map(it => (
                <CustomLink key={it._id} item={it} lang={lang} onClick={closeMenu}
                  className={({ isActive }) => `flex w-full items-center px-5 py-3.5 text-sm font-bold border-b border-border/40 transition-colors ${isActive ? "text-primary bg-primary/5" : "text-ink hover:text-primary hover:bg-gray-50"}`} />
              ))}
            </div>

            {/* Locations */}
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs font-black uppercase tracking-widest text-muted mb-2">{n.locations}</p>
              <div className="grid grid-cols-2 gap-1">
                {locations.map(x => (
                  <Link key={x.slug} to={`/location/${x.slug}`} onClick={closeMenu}
                    className="flex items-center gap-1.5 px-2 py-2 text-xs font-semibold rounded hover:text-primary hover:bg-gray-50 transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {lang === "bn" ? x.bn : x.en}
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom controls */}
            <div className="px-4 py-4 border-t border-border flex flex-col gap-3">
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
