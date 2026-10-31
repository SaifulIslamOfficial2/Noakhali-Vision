import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Banknote, Briefcase, CheckCircle2, Clock, ExternalLink, Laptop, MapPin, Sparkles, Sprout, X } from "lucide-react";
import { PageLoader } from "../components/Spinner.jsx";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";
import api from "../utils/api";

const T = {
  bn: {
    heroLabel: "ক্যারিয়ার", openNow: "টি পদে নিয়োগ চলছে", soon: "টি শীঘ্রই আসছে", seeRoles: "খোলা পদ দেখুন",
    all: "সব", empty: "এই মুহূর্তে কোনো পদ খোলা নেই। নিচের ফর্ম বা ইমেইলে আপনার পরিচিতি পাঠিয়ে রাখুন।", noMatch: "এই ফিল্টারে কোনো পদ নেই।",
    status: { hiring: "নিয়োগ চলছে", "opening-soon": "শীঘ্রই আসছে", closed: "বন্ধ" },
    types: { "Full-time": "ফুল-টাইম", "Part-time": "পার্ট-টাইম", Contract: "চুক্তিভিত্তিক", Internship: "ইন্টার্নশিপ" },
    modes: { Office: "অফিস", Remote: "রিমোট", Hybrid: "হাইব্রিড" },
    details: "বিস্তারিত ও আবেদন", salary: "বেতন", deadline: "শেষ তারিখ", negotiable: "আলোচনাসাপেক্ষ",
    doing: "যা করবেন", looking: "যা খুঁজছি", close: "বন্ধ করুন",
    applyTitle: "আবেদন করুন", applyExternal: "আবেদনের লিংকে যান",
    notHiring: "এই পদে এখন আবেদন নেওয়া হচ্ছে না।", soonNote: "এই পদ শীঘ্রই খোলা হবে। এর মধ্যে নিচের “তালিকায় আপনার পদ নেই?” অংশ থেকে পরিচিতি পাঠাতে পারেন।",
    name: "পুরো নাম", email: "ইমেইল", phone: "ফোন / WhatsApp", resume: "রিজিউমের লিংক (Google Drive ইত্যাদি)", portfolio: "পোর্টফোলিও / LinkedIn (ঐচ্ছিক)",
    cover: "নিজের সম্পর্কে লিখুন", coverPh: "কেন এই পদ, আগের অভিজ্ঞতা…", send: "আবেদন পাঠান", sending: "পাঠানো হচ্ছে…",
    sentTitle: "আবেদন জমা হয়েছে", sentText: "আপনার রেফারেন্স নম্বর সংরক্ষণ করুন:", sentMore: "আমরা ইমেইল বা ফোনে যোগাযোগ করব।",
    errGeneric: "আবেদন পাঠানো যায়নি। আবার চেষ্টা করুন।", emailUs: "ইমেইল করুন", writeUs: "যোগাযোগ করুন", meet: "টিমের সঙ্গে পরিচিত হোন",
    seoTitle: "ক্যারিয়ার | নোয়াখালী ভিশন", seoDesc: "নোয়াখালী ভিশনে কাজের সুযোগ। খোলা পদ দেখুন ও অনলাইনে আবেদন করুন।",
  },
  en: {
    heroLabel: "CAREERS", openNow: "open now", soon: "opening soon", seeRoles: "See open roles",
    all: "All", empty: "No roles are open right now. Send us a short introduction using the section below.", noMatch: "No roles match this filter.",
    status: { hiring: "Hiring", "opening-soon": "Opening soon", closed: "Closed" },
    types: { "Full-time": "Full-time", "Part-time": "Part-time", Contract: "Contract", Internship: "Internship" },
    modes: { Office: "Office", Remote: "Remote", Hybrid: "Hybrid" },
    details: "Details & apply", salary: "Salary", deadline: "Deadline", negotiable: "Negotiable",
    doing: "What you'll do", looking: "What we're looking for", close: "Close",
    applyTitle: "Apply now", applyExternal: "Go to application link",
    notHiring: "This role is not accepting applications right now.", soonNote: "This role opens soon. Meanwhile, send us an introduction from the “Not on the list?” section below.",
    name: "Full name", email: "Email", phone: "Phone / WhatsApp", resume: "Resume link (Google Drive etc.)", portfolio: "Portfolio / LinkedIn (optional)",
    cover: "Tell us about yourself", coverPh: "Why this role, past experience…", send: "Submit application", sending: "Sending…",
    sentTitle: "Application received", sentText: "Keep your reference number:", sentMore: "We will contact you by email or phone.",
    errGeneric: "Could not send the application. Please try again.", emailUs: "Email us", writeUs: "Get in touch", meet: "Meet the team",
    seoTitle: "Careers | Noakhali Vision", seoDesc: "Work with Noakhali Vision. Browse open roles and apply online.",
  },
};

const STATUS_STYLE = {
  hiring: "bg-primary/10 text-primary",
  "opening-soon": "bg-amber-100 text-amber-800",
  closed: "bg-gray-100 text-gray-500",
};
const WHY_ICONS = [MapPin, Sparkles, Laptop, Sprout];

const pick = (isBn, en, bn) => (isBn && bn ? bn : en || bn || "");

function Chip({ children }) {
  return <span className="inline-flex items-center gap-1 border border-border bg-white px-2.5 py-1 text-xs font-bold text-ink">{children}</span>;
}

function ApplyForm({ job, tx, onDone }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", resumeUrl: "", portfolio: "", coverLetter: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ref, setRef] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await api.post(`/careers/${encodeURIComponent(job._id)}/apply`, f);
      setRef(r.data.ref || "");
      onDone?.();
    } catch (er) {
      setErr(er.response?.data?.message || tx.errGeneric);
    } finally { setBusy(false); }
  };

  if (ref) {
    return (
      <div className="border border-primary/30 bg-primary/5 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 text-primary" size={34} />
        <h4 className="text-lg font-black">{tx.sentTitle}</h4>
        <p className="mt-1 text-sm text-muted">{tx.sentText}</p>
        <p className="my-2 text-xl font-black tracking-wider text-primary">{ref}</p>
        <p className="text-sm text-muted">{tx.sentMore}</p>
      </div>
    );
  }

  const input = "w-full border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none";
  const label = "mb-1 block text-xs font-black uppercase tracking-wider";
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label}>{tx.name} *</label><input className={input} value={f.name} onChange={set("name")} required maxLength={120} autoComplete="name" /></div>
        <div><label className={label}>{tx.email} *</label><input className={input} type="email" value={f.email} onChange={set("email")} required maxLength={160} autoComplete="email" /></div>
        <div><label className={label}>{tx.phone} *</label><input className={input} type="tel" value={f.phone} onChange={set("phone")} required maxLength={30} autoComplete="tel" /></div>
        <div><label className={label}>{tx.portfolio}</label><input className={input} type="url" value={f.portfolio} onChange={set("portfolio")} maxLength={500} placeholder="https://" /></div>
      </div>
      <div><label className={label}>{tx.resume}</label><input className={input} type="url" value={f.resumeUrl} onChange={set("resumeUrl")} maxLength={500} placeholder="https://drive.google.com/…" /></div>
      <div><label className={label}>{tx.cover}</label><textarea className={`${input} resize-none`} rows={4} value={f.coverLetter} onChange={set("coverLetter")} maxLength={3000} placeholder={tx.coverPh} /></div>
      {/* honeypot: hidden from people, bots tend to fill it */}
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" value={f.website} onChange={set("website")} />
      {err && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{err}</p>}
      <button disabled={busy} className="w-full bg-primary py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
        {busy ? tx.sending : tx.send}
      </button>
    </form>
  );
}

function JobDrawer({ job, tx, isBn, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const title = pick(isBn, job.title, job.titleBn);
  const summary = pick(isBn, job.summary, job.summaryBn);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white px-5 py-4">
          <div className="min-w-0">
            <span className={`inline-block px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${STATUS_STYLE[job.status]}`}>{tx.status[job.status]}</span>
            <h2 className="mt-2 text-xl font-black leading-tight sm:text-2xl">{title}</h2>
          </div>
          <button onClick={onClose} aria-label={tx.close} className="shrink-0 border border-border p-2 hover:bg-gray-50"><X size={18} /></button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <div className="flex flex-wrap gap-2">
            <Chip><Briefcase size={13} />{tx.types[job.type] || job.type}</Chip>
            <Chip><Laptop size={13} />{tx.modes[job.mode] || job.mode}</Chip>
            {job.location && <Chip><MapPin size={13} />{job.location}</Chip>}
            <Chip><Banknote size={13} />{job.salary || tx.negotiable}</Chip>
            {job.deadline && <Chip><Clock size={13} />{tx.deadline}: {job.deadline}</Chip>}
          </div>

          {summary && <p className="whitespace-pre-line leading-relaxed text-ink">{summary}</p>}

          {job.doing?.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-primary">{tx.doing}</h3>
              <ul className="space-y-2">{job.doing.map((x, i) => <li key={i} className="flex gap-2 text-sm"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" /><span>{x}</span></li>)}</ul>
            </section>
          )}
          {job.looking?.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-primary">{tx.looking}</h3>
              <ul className="space-y-2">{job.looking.map((x, i) => <li key={i} className="flex gap-2 text-sm"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" /><span>{x}</span></li>)}</ul>
            </section>
          )}

          <section className="border-t border-border pt-5">
            <h3 className="mb-3 text-lg font-black">{tx.applyTitle}</h3>
            {job.status === "hiring" ? (
              job.applyUrl
                ? <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-black uppercase text-white hover:bg-primary/90">{tx.applyExternal} <ExternalLink size={15} /></a>
                : <ApplyForm job={job} tx={tx} />
            ) : (
              <p className="border border-border bg-gray-50 px-4 py-3 text-sm text-muted">{job.status === "opening-soon" ? tx.soonNote : tx.notHiring}</p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

export default function Careers() {
  const { lang } = useLang();
  const isBn = lang === "bn";
  const tx = T[isBn ? "bn" : "en"];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState("");

  useEffect(() => {
    setSEO({ title: tx.seoTitle, description: tx.seoDesc });
  }, [lang]);

  useEffect(() => {
    api.get("/careers")
      .then((r) => setData(r.data))
      .catch(() => setData({ jobs: [], page: null }))
      .finally(() => setLoading(false));
  }, []);

  // /careers#job-xxxx opens that role directly (shareable link)
  useEffect(() => {
    const fromHash = () => setOpenId(window.location.hash.startsWith("#job-") ? decodeURIComponent(window.location.hash.slice(5)) : "");
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  const open = (id) => { setOpenId(id); try { window.history.replaceState(null, "", `#job-${encodeURIComponent(id)}`); } catch { /* ignore */ } };
  const close = () => { setOpenId(""); try { window.history.replaceState(null, "", window.location.pathname); } catch { /* ignore */ } };

  const jobs = data?.jobs || [];
  const page = data?.page || {};
  const hiring = jobs.filter((j) => j.status === "hiring").length;
  const soon = jobs.filter((j) => j.status === "opening-soon").length;

  const filters = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => { if (j.type) set.add(`type:${j.type}`); if (j.mode) set.add(`mode:${j.mode}`); });
    return [...set];
  }, [jobs]);
  const shown = jobs.filter((j) => filter === "all" || filter === `type:${j.type}` || filter === `mode:${j.mode}`);
  const current = jobs.find((j) => j._id === openId);

  const filterLabel = (f) => { const [k, v] = f.split(":"); return k === "type" ? tx.types[v] || v : tx.modes[v] || v; };

  return (
    <div>
      {/* Hero */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ backgroundImage: "url(/hero-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center", minHeight: "320px" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(11,77,53,0.88) 0%,rgba(0,0,0,0.62) 100%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-14 text-center text-white">
          <p className="mb-2 text-xs font-black uppercase tracking-widest opacity-75">{tx.heroLabel} · NOAKHALI VISION</p>
          <h1 className="text-3xl font-black drop-shadow-lg sm:text-5xl">{pick(isBn, page.heroTitle, page.heroTitleBn)}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed opacity-90 sm:text-base">{pick(isBn, page.heroText, page.heroTextBn)}</p>
          {!loading && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-black">
              <span className="bg-white/15 px-3 py-1.5 backdrop-blur">{hiring} {tx.openNow}</span>
              {soon > 0 && <span className="bg-white/15 px-3 py-1.5 backdrop-blur">{soon} {tx.soon}</span>}
            </div>
          )}
          <a href="#roles" className="mt-6 inline-flex items-center gap-2 bg-white px-5 py-2.5 text-sm font-black uppercase tracking-wide text-primary transition-colors hover:bg-gray-100">
            {tx.seeRoles} <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {loading ? <PageLoader minHeight="40vh" /> : (
        <>
          {/* Life at NV */}
          {page.whyCards?.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
              <h2 className="mb-6 text-2xl font-black sm:text-3xl">{pick(isBn, page.whyTitle, page.whyTitleBn)}</h2>
              <div className="grid gap-5 md:grid-cols-3">
                {page.whyCards.map((c, i) => {
                  const Icon = WHY_ICONS[i % WHY_ICONS.length];
                  return (
                    <div key={i} className="border-l-4 border-primary bg-white p-5 shadow-sm">
                      <Icon size={22} className="mb-3 text-primary" />
                      <h3 className="mb-1.5 text-lg font-black">{pick(isBn, c.title, c.titleBn)}</h3>
                      <p className="text-sm leading-relaxed text-muted">{pick(isBn, c.text, c.textBn)}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Roles */}
          <section id="roles" className="border-y border-border bg-white/60">
            <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:py-14">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-2xl font-black sm:text-3xl">{pick(isBn, page.listTitle, page.listTitleBn)} <span className="text-muted">{jobs.length}</span></h2>
                {filters.length > 1 && (
                  <div className="flex flex-wrap gap-2" role="group">
                    {["all", ...filters].map((f) => (
                      <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                        className={`border px-3.5 py-1.5 text-xs font-black transition-colors ${filter === f ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary"}`}>
                        {f === "all" ? tx.all : filterLabel(f)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {jobs.length === 0 ? (
                <p className="border border-dashed border-border bg-white py-16 text-center font-semibold text-muted">{tx.empty}</p>
              ) : shown.length === 0 ? (
                <p className="py-10 text-center text-muted">{tx.noMatch}</p>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {shown.map((j) => (
                    <button key={j._id} onClick={() => open(j._id)} className={`group flex flex-col border border-border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md ${j.status === "closed" ? "opacity-70" : ""}`}>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="text-lg font-black leading-snug">{pick(isBn, j.title, j.titleBn)}</h3>
                        <span className={`shrink-0 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${STATUS_STYLE[j.status]}`}>{tx.status[j.status]}</span>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Chip>{tx.types[j.type] || j.type}</Chip>
                        <Chip>{tx.modes[j.mode] || j.mode}</Chip>
                        {j.location && <Chip><MapPin size={12} />{j.location}</Chip>}
                      </div>
                      {pick(isBn, j.summary, j.summaryBn) && <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted">{pick(isBn, j.summary, j.summaryBn)}</p>}
                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
                        <span className="font-bold text-ink">{j.salary || tx.negotiable}</span>
                        <span className="inline-flex items-center gap-1 font-black text-primary">{tx.details} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* CTA */}
          <section className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <div className="bg-primary px-6 py-10 text-center text-white sm:px-10">
              <h2 className="text-2xl font-black sm:text-3xl">{pick(isBn, page.ctaTitle, page.ctaTitleBn)}</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm opacity-90 sm:text-base">{pick(isBn, page.ctaText, page.ctaTextBn)}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {page.contactEmail
                  ? <a href={`mailto:${page.contactEmail}`} className="bg-white px-5 py-2.5 text-sm font-black uppercase tracking-wide text-primary hover:bg-gray-100">{tx.emailUs}</a>
                  : <Link to="/partnership" className="bg-white px-5 py-2.5 text-sm font-black uppercase tracking-wide text-primary hover:bg-gray-100">{tx.writeUs}</Link>}
                <Link to="/team" className="border border-white px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-white/10">{tx.meet}</Link>
              </div>
            </div>
          </section>
        </>
      )}

      {current && <JobDrawer job={current} tx={tx} isBn={isBn} onClose={close} />}
    </div>
  );
}
