import { useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { useLang } from "../utils/LanguageContext";
import { Send, CheckCircle, Loader, XCircle, Youtube, Linkedin, Facebook } from "lucide-react";

const EMAILJS_SERVICE_ID  = "service_ob8wmh3";
const EMAILJS_TEMPLATE_ID = "template_9e4nrsz";
const EMAILJS_PUBLIC_KEY  = "ASAezSfaSVjMd75v5";

export default function Footer() {
  const { tr } = useLang();
  const f = tr.footer;
  const nl = f.newsletter;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const quickLinks = [
    [f.links.home,          "/"],
    [f.links.news,          "/news"],
    [f.links.premiumMember, "/premium-member"],
    [f.links.partnership,   "/partnership"],
    [f.links.company,       "/company"],
    [f.links.about,         "/about"],
  ];

  const handleSubscribe = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setStatus("invalid"); return; }
    setStatus("sending");
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { subscriber_email: trimmed }, EMAILJS_PUBLIC_KEY);
      setStatus("success"); setEmail("");
    } catch { setStatus("error"); }
  };

  return (
    <footer className="border-t border-border bg-white dark:bg-[#1a1a1a]">

      {/* Newsletter */}
      <div className="bg-primary px-3 sm:px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          <div className="text-white text-center md:text-left">
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Newsletter</p>
            <h3 className="text-xl sm:text-2xl font-black">{nl.heading}</h3>
            <p className="mt-1 text-sm opacity-80">{nl.sub}</p>
          </div>
          <div className="w-full md:w-auto flex flex-col gap-2">
            {status === "success" ? (
              <div className="flex items-center gap-2 bg-white/20 text-white px-5 py-3 font-bold text-sm">
                <CheckCircle size={18} />{nl.success}
              </div>
            ) : (
              <div className="flex w-full">
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setStatus("idle"); }}
                  onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                  placeholder={nl.placeholder}
                  className="flex-1 min-w-0 bg-white border-0 px-4 py-3 text-sm text-ink focus:outline-none placeholder:text-muted"
                />
                <button onClick={handleSubscribe} disabled={status === "sending"}
                  className="flex items-center gap-2 bg-ink px-4 sm:px-5 py-3 text-sm font-black uppercase text-white hover:bg-secondary transition-colors disabled:opacity-60 whitespace-nowrap shrink-0">
                  {status === "sending"
                    ? <><Loader size={14} className="animate-spin" /><span className="hidden sm:inline"> {nl.sending}</span></>
                    : <><Send size={14} /><span className="hidden sm:inline"> {nl.button}</span></>}
                </button>
              </div>
            )}
            {status === "invalid" && <p className="flex items-center gap-1 text-xs text-white/90 font-bold"><XCircle size={13} /> {nl.invalid}</p>}
            {status === "error"   && <p className="flex items-center gap-1 text-xs text-white/90 font-bold"><XCircle size={13} /> {nl.error}</p>}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 px-3 sm:px-4 py-8 sm:py-10 grid-cols-2 md:grid-cols-4">

        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" className="h-9 w-9 sm:h-10 sm:w-10" alt="logo" />
            <b className="text-lg sm:text-xl font-black uppercase tracking-widest leading-none">
              NOAKHALI<br />VISION
            </b>
          </Link>
          <p className="mt-3 text-sm text-muted leading-relaxed">{f.tagline}</p>
        </div>

        {/* Quick Links */}
        <div>
          <b className="text-xs font-black uppercase tracking-widest">{f.quickLinks}</b>
          <ul className="mt-3 space-y-2">
            {quickLinks.map(([label, href]) => (
              <li key={href}>
                <Link to={href} className="text-sm text-muted hover:text-primary font-semibold">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social */}
        <div>
          <b className="text-xs font-black uppercase tracking-widest">{f.social}</b>
          <ul className="mt-3 space-y-2">
            <li>
              <a href="https://www.facebook.com/noakhalivision.bd" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-muted hover:text-primary font-semibold">
                <Facebook size={16} /> Facebook
              </a>
            </li>
            <li>
              <a href="https://youtube.com/@noakhalivisionbd2" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-muted hover:text-primary font-semibold">
                <Youtube size={16} /> YouTube
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/company/noakhali-vision/" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-muted hover:text-primary font-semibold">
                <Linkedin size={16} /> LinkedIn
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <b className="text-xs font-black uppercase tracking-widest">{f.contact}</b>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <a href="mailto:noakhalivision1@gmail.com" className="hover:text-primary font-semibold break-all">
                noakhalivision1@gmail.com
              </a>
            </li>
            <li className="font-semibold">Maijdee Court, Noakhali</li>
            <li className="font-semibold">Bangladesh</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-3 sm:px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} <span className="font-black uppercase tracking-widest">NOAKHALI VISION</span>. {f.rights}.
      </div>
    </footer>
  );
}
