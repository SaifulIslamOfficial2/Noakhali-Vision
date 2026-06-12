import { useState, useRef, useEffect } from "react";
import emailjs from "@emailjs/browser";
import AdCards from "../components/AdCards";
import { useLang } from "../utils/LanguageContext";
import { setSEO } from "../utils/seo";
import { CheckCircle, XCircle, Loader, Send, X } from "lucide-react";
import api, { imageUrl } from "../utils/api";

const EMAILJS_SERVICE_ID  = "service_ob8wmh3";
const EMAILJS_TEMPLATE_ID = "template_2939v4n";
const EMAILJS_PUBLIC_KEY  = "ASAezSfaSVjMd75v5";

/* ─── Toast ─────────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  const ok = toast.type === "success";
  return (
    <div className={`flex items-start gap-3 w-full max-w-xs sm:max-w-sm p-4 shadow-lg border-l-4 bg-white ${ok ? "border-green-500" : "border-red-500"}`}
      style={{ animation: "slideIn 0.3s ease-out forwards" }}>
      <span className="mt-0.5 shrink-0">
        {ok ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
      </span>
      <p className="text-sm font-semibold flex-1 text-gray-800">{toast.message}</p>
      <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-600"><X size={16} /></button>
    </div>
  );
}
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-2 left-2 sm:left-auto sm:right-5 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "success") => setToasts(p => [...p, { id: Date.now(), message, type }]);
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, addToast, removeToast };
}

/* ─── Data ───────────────────────────────────────────────────── */
const stats = [
  { num: "২.৫ লাখ+", numEn: "2.5L+",  label: "মাসিক পাঠক",      labelEn: "Monthly Readers" },
  { num: "৮৫%",       numEn: "85%",     label: "তরুণ দর্শক",      labelEn: "Youth Audience" },
  { num: "৯৮K+",      numEn: "98K+",    label: "সোশ্যাল ফলোয়ার", labelEn: "Social Followers" },
  { num: "১১+",       numEn: "11+",     label: "উপজেলা কভারেজ",  labelEn: "Upazila Coverage" },
];


const partnerTypes = [
  {
    icon: "📺",
    title: "মিডিয়া পার্টনারশিপ", titleEn: "Media Partnership",
    desc: "প্রেস কনফারেন্স, পণ্য লঞ্চ ও ইভেন্ট কভারেজ। আমরা আপনার ব্র্যান্ডকে লাখো পাঠকের কাছে পৌঁছে দিই।",
    descEn: "Press conferences, product launches and event coverage. We amplify your brand to hundreds of thousands of readers.",
    tags: ["Events", "Press Release", "Livestream"],
  },
  {
    icon: "🤝",
    title: "আউটরিচ পার্টনারশিপ", titleEn: "Outreach Partnership",
    desc: "স্থানীয় মানুষের সাথে সংযোগ, কমিউনিটি এনগেজমেন্ট এবং ক্রস-প্ল্যাটফর্ম বিতরণ।",
    descEn: "Connect with local communities, boost engagement and distribute across platforms.",
    tags: ["Community", "Audience Reach", "Distribution"],
  },
  {
    icon: "🌐",
    title: "স্ট্র্যাটেজিক পার্টনারশিপ", titleEn: "Strategic Partnership",
    desc: "দীর্ঘমেয়াদী কো-ব্র্যান্ডিং, শেয়ার্ড রিসোর্স এবং যৌথ উদ্যোগের সুযোগ।",
    descEn: "Long-term co-branding, shared resources and joint initiatives.",
    tags: ["Co-branding", "Joint Venture", "Shared Goals"],
  },
  {
    icon: "✍️",
    title: "কন্টেন্ট পার্টনারশিপ", titleEn: "Content Partnership",
    desc: "স্পনসরড আর্টিকেল, ব্র্যান্ডেড কন্টেন্ট ও SEO-অপ্টিমাইজড গল্পতৈরি।",
    descEn: "Sponsored articles, branded content and SEO-optimized storytelling around your brand.",
    tags: ["Articles", "Storytelling", "SEO"],
  },
];

const packages = [
  {
    icon: "🖼️", name: "স্ট্যাটিক", nameEn: "Static",
    sub: "ব্র্যান্ড ইন্টিগ্রেশনসহ ইমেজ পোস্ট", subEn: "Single image post with brand integration",
    features: ["ফিচার্ড প্লেসমেন্ট", "সোশ্যাল শেয়ার", "পারফরম্যান্স রিপোর্ট"],
    featuresEn: ["Featured placement", "Social amplification", "Performance analytics"],
  },
  {
    icon: "🎠", name: "ক্যারোসেল", nameEn: "Carousel",
    sub: "মাল্টি-ইমেজ স্টোরিটেলিং ফরম্যাট", subEn: "Multi-image storytelling format",
    features: ["১০টি পর্যন্ত ছবি", "ইন্টারেক্টিভ এনগেজমেন্ট", "বিস্তারিত ইনসাইট"],
    featuresEn: ["Up to 10 images", "Increased engagement", "Detailed insights"],
  },
  {
    icon: "🎬", name: "ডায়নামিক (ভিডিও)", nameEn: "Dynamic (Video)",
    sub: "ভিডিও কন্টেন্ট সহ ইমপ্যাক্ট স্টোরি", subEn: "Engaging video with impact story",
    features: ["প্রোডাকশন সাপোর্ট", "মাল্টি-প্ল্যাটফর্ম", "এনহ্যান্সড রিচ"],
    featuresEn: ["Video production support", "Multi-platform distribution", "Enhanced reach"],
  },
  {
    icon: "📌", name: "GPI ব্যানার", nameEn: "GPI Banner",
    sub: "নিউজপোস্টে প্রিমিয়াম ব্যানার প্লেসমেন্ট", subEn: "Premium banner placement across platform",
    features: ["টার্গেটেড পজিশনিং", "ম্যাক্সিমাম এক্সপোজার", "লোকেশন টার্গেটিং"],
    featuresEn: ["Targeted positioning", "Maximum exposure", "Location targeting"],
  },
];

const partnersWith = [
  { icon: "🏛️", label: "সংগঠনসমূহ",           labelEn: "Organizations",    sub: "NGO, NPO & Govt Bodies" },
  { icon: "👥", label: "কমিউনিটি",             labelEn: "Communities",      sub: "Local Groups & Forums" },
  { icon: "🎓", label: "বিশ্ববিদ্যালয় ক্লাব",  labelEn: "University Clubs", sub: "Student Bodies" },
  { icon: "📅", label: "ইভেন্ট ও সামিট",       labelEn: "Events & Summits", sub: "Conferences & Expos" },
];

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

/* ─── Main ───────────────────────────────────────────────────── */
export default function Partnership() {
  const { lang } = useLang();
  const formRef = useRef();
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState(EMPTY);
  const { toasts, addToast, removeToast } = useToast();
  const lb = lang === "bn";
  const [companies, setCompanies] = useState([]);

  // ✅ Fix 1: setSEO for page title
  useEffect(() => {
    setSEO({ title: lb ? "পার্টনারশিপ | নোয়াখালী ভিশন" : "Partnership | Noakhali Vision" });
  }, [lang]);

  useEffect(() => {
    api.get("/companies")
      .then(r => setCompanies((r.data.companies || []).filter(c => c.status === "active")))
      .catch(() => {});
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("sending");
    try {
      await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formRef.current, EMAILJS_PUBLIC_KEY);
      setStatus("sent");
      setForm(EMPTY);
      addToast(lb ? "আপনার পার্টনারশিপ অনুরোধ সফলভাবে পাঠানো হয়েছে।" : "Your partnership request has been sent successfully.", "success");
    } catch {
      setStatus("error");
      addToast(lb ? "❌ মেসেজ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "❌ Failed to send. Please try again.", "error");
    }
  };

  const inputCls = "w-full border border-border bg-transparent px-4 py-3 text-sm focus:border-primary focus:outline-none";
  const labelCls = "mb-1 block text-xs font-black uppercase tracking-widest text-muted";

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(100%) } to { opacity:1; transform:translateX(0) } }
        /* ✅ Fix 2: anchor scroll offset for sticky navbar (h-14 = 56px, h-16 = 64px) */
        #packages, #contact { scroll-margin-top: 72px; }
      `}</style>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* ── Hero ── */}
      <section
        className="relative flex items-center justify-center"
        style={{ backgroundImage: "url(/hero-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center", height: "clamp(220px,38vw,360px)" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(239,21,43,0.85) 0%,rgba(0,0,0,0.7) 100%)" }} />
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">
            {lb ? "পার্টনারশিপ সুযোগ" : "Partnership Opportunities"}
          </p>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-widest drop-shadow-lg">
            {lb ? "পার্টনার হোন" : "Partner With Us"}
          </h1>
          <p className="mt-3 text-sm sm:text-base font-semibold opacity-90 max-w-lg mx-auto">
            {lb
              ? "নোয়াখালীর সবচেয়ে প্রভাবশালী ডিজিটাল প্ল্যাটফর্মে আপনার ব্র্যান্ডকে উপস্থাপন করুন"
              : "Reach thousands of engaged readers through authentic storytelling and innovative content partnerships"}
          </p>
          <div className="mt-5 flex gap-3 justify-center flex-wrap">
            <a href="#contact" className="bg-white text-primary font-black text-xs uppercase tracking-widest px-6 py-3 hover:bg-gray-100 transition-colors">
              {lb ? "শুরু করুন" : "Get Started"}
            </a>
            <a href="#packages" className="border border-white text-white font-black text-xs uppercase tracking-widest px-6 py-3 hover:bg-white hover:text-primary transition-colors">
              {lb ? "প্যাকেজ দেখুন" : "View Packages"}
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.labelEn}>
              <p className="text-2xl sm:text-3xl font-black text-primary">{lb ? s.num : s.numEn}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted">{lb ? s.label : s.labelEn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Brand Partners ── */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p className="text-xs font-black uppercase tracking-widest text-primary text-center mb-2">
          {lb ? "ব্র্যান্ড পার্টনারস" : "Brand Partners"}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-center text-ink mb-2">
          {lb ? "আমাদের ব্র্যান্ড পার্টনারসমূহ" : "Our Brand Partners"}
        </h2>
        <p className="text-sm text-center text-muted mb-8 max-w-md mx-auto">
          {lb ? "বিভিন্ন শিল্পের শীর্ষস্থানীয় ব্র্যান্ডের সাথে কাজ করে ফলাফল পৌঁছে দিচ্ছি" : "Delivering results for leading brands across industries"}
        </p>
        {companies.length === 0 ? (
          <p className="text-center text-sm text-muted py-6">
            {lb ? "এখনো কোনো পার্টনার যোগ করা হয়নি।" : "No partners added yet."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {companies.map((c) => (
                <div key={c._id}
                  className="border border-border flex flex-col items-center justify-center p-3 gap-1 hover:border-primary transition-colors cursor-default"
                  style={{ aspectRatio: "1", minHeight: "80px" }}
                  title={c.name}>
                  {c.logo ? (
                    <img
                      src={imageUrl(c.logo)}
                      alt={c.name}
                      className="h-10 w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold text-center text-ink leading-tight">{c.name}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center mt-5 text-xs font-black text-primary">
              {companies.length}+ {lb ? "ব্র্যান্ড" : "Brands"}
            </p>
          </>
        )}
      </section>

      {/* ── Partnership Types ── */}
      <section style={{ background: "var(--bg2)" }} className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-black uppercase tracking-widest text-primary text-center mb-2">
            {lb ? "সহযোগিতার ধরন" : "Beyond Brand Collaborations"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-center text-ink mb-2">
            {lb ? "প্রতিটি উপায়ে আমরা পার্টনার" : "We Partner in Every Way"}
          </h2>
          <p className="text-sm text-center text-muted mb-8 max-w-md mx-auto">
            {lb
              ? "মিডিয়া কভারেজ থেকে কৌশলগত জোট — সংগঠন, কমিউনিটি ও বিশ্ববিদ্যালয় ক্লাবসহ সহযোগিতা"
              : "From media coverage to strategic alliances — with organizations, communities and university clubs"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {partnerTypes.map((pt) => (
              <div key={pt.titleEn} className="border border-border bg-white p-5 hover:border-primary transition-colors group">
                <div className="text-3xl mb-3">{pt.icon}</div>
                <h3 className="font-black text-sm text-ink mb-2 group-hover:text-primary transition-colors">
                  {lb ? pt.title : pt.titleEn}
                </h3>
                <p className="text-xs leading-6 text-muted mb-3">{lb ? pt.desc : pt.descEn}</p>
                <div className="flex flex-wrap gap-1">
                  {pt.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 border border-border font-bold text-muted uppercase tracking-wide">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* We partner with */}
          <div className="mt-8 border-t border-border pt-8">
            <p className="text-xs font-black uppercase tracking-widest text-muted text-center mb-5">
              {lb ? "যাদের সাথে পার্টনারশিপ করি" : "We partner with"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {partnersWith.map((pw) => (
                <div key={pw.labelEn} className="text-center border border-border bg-white p-4 hover:border-primary transition-colors">
                  <div className="text-2xl mb-2">{pw.icon}</div>
                  <p className="font-black text-xs text-ink">{lb ? pw.label : pw.labelEn}</p>
                  <p className="text-[10px] text-muted mt-1">{pw.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Packages ── */}
      <section id="packages" className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p className="text-xs font-black uppercase tracking-widest text-primary text-center mb-2">
          {lb ? "প্যাকেজ সমূহ" : "Product Bundles"}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-center text-ink mb-2">
          {lb ? "পার্টনারশিপ প্যাকেজ" : "Partnership Packages"}
        </h2>
        <p className="text-sm text-center text-muted mb-8 max-w-md mx-auto">
          {lb
            ? "আপনার ব্র্যান্ডের বার্তা পৌঁছে দিতে নমনীয় সহযোগিতার বিকল্পসমূহ"
            : "Flexible collaboration options designed to amplify your brand's message"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => (
            <div key={pkg.nameEn} className="border border-border p-5 flex flex-col hover:border-primary transition-colors group">
              <div className="text-3xl mb-3">{pkg.icon}</div>
              <h3 className="font-black text-sm text-ink group-hover:text-primary transition-colors mb-1">
                {lb ? pkg.name : pkg.nameEn}
              </h3>
              <p className="text-xs text-muted mb-4 leading-5">{lb ? pkg.sub : pkg.subEn}</p>
              <ul className="space-y-2 flex-1 mb-5">
                {(lb ? pkg.features : pkg.featuresEn).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted">
                    <span className="text-primary mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="#contact"
                className="block text-center border border-primary text-primary text-xs font-black uppercase tracking-widest py-2.5 hover:bg-primary hover:text-white transition-colors">
                {lb ? "মূল্য জানুন" : "Ask for Pricing"}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center mt-6 text-xs text-muted">
          {lb
            ? "দীর্ঘমেয়াদী সহযোগিতার জন্য কাস্টম প্যাকেজও পাওয়া যায়।"
            : "Custom packages available for long-term partnerships and multi-campaign solutions."}
        </p>
      </section>

      {/* ── Contact Form ── */}
      <section id="contact" style={{ background: "var(--bg2)" }} className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-widest text-primary text-center mb-2">
            {lb ? "যোগাযোগ" : "Get In Touch"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-center text-ink mb-2">
            {lb ? "একসাথে কাজ করি" : "Let's Collaborate"}
          </h2>
          <p className="text-sm text-center text-muted mb-8">
            {lb
              ? "নিচের ফর্মটি পূরণ করুন — আমাদের টিম ২৪ ঘণ্টার মধ্যে সাড়া দেবে।"
              : "Fill out the form below and our partnership team will get back to you within 24 hours."}
          </p>

          <div className="grid gap-8 sm:gap-10 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              {status === "sent" ? (
                <div className="flex flex-col items-center justify-center gap-4 border border-border bg-white p-8 sm:p-12 text-center">
                  <CheckCircle size={48} className="text-green-500" />
                  <h3 className="text-xl font-black text-ink">{lb ? "মেসেজ পাঠানো হয়েছে!" : "Message Sent!"}</h3>
                  <p className="text-sm text-muted">
                    {lb ? "আপনার পার্টনারশিপ অনুরোধ সফলভাবে পাঠানো হয়েছে।" : "Your partnership request has been sent successfully."}
                  </p>
                  <button onClick={() => setStatus("idle")} className="mt-2 border border-border px-6 py-2 text-sm font-bold hover:border-primary hover:text-primary transition-colors">
                    {lb ? "আবার পাঠান" : "Send Another"}
                  </button>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>{lb ? "নাম *" : "Name *"}</label>
                      <input name="name" value={form.name} onChange={handleChange} required
                        placeholder={lb ? "আপনার নাম" : "Your name"} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{lb ? "ইমেইল *" : "Email *"}</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} required
                        placeholder="you@example.com" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>{lb ? "ফোন" : "Phone"}</label>
                      <input name="phone" value={form.phone} onChange={handleChange}
                        placeholder={lb ? "ফোন নম্বর" : "Phone number"} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{lb ? "বিষয়" : "Subject"}</label>
                      <input name="subject" value={form.subject} onChange={handleChange}
                        placeholder={lb ? "মেসেজের বিষয়" : "Message subject"} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{lb ? "বার্তা *" : "Message *"}</label>
                    <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                      placeholder={lb ? "আপনার বার্তা লিখুন..." : "Write your message..."}
                      className={`${inputCls} resize-none`} />
                  </div>
                  {status === "error" && (
                    <p className="text-sm text-red-500 font-bold">
                      {lb ? "❌ মেসেজ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "❌ Something went wrong. Please try again."}
                    </p>
                  )}
                  <button type="submit" disabled={status === "sending"}
                    className="flex items-center justify-center gap-2 bg-primary px-8 py-3.5 font-black uppercase tracking-widest text-white hover:bg-secondary transition-colors disabled:opacity-60 w-full sm:w-auto">
                    {status === "sending"
                      ? <><Loader size={16} className="animate-spin" /> {lb ? "পাঠানো হচ্ছে..." : "Sending..."}</>
                      : <><Send size={16} /> {lb ? "মেসেজ পাঠান" : "Send Message"}</>}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="text-xl sm:text-2xl font-black mb-5 sm:mb-6 text-ink">
                {lb ? "📍 যোগাযোগের তথ্য" : "📍 Contact Info"}
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { icon: "✉️", label: lb ? "ইমেইল" : "Email", value: "noakhalivision1@gmail.com", href: "mailto:noakhalivision1@gmail.com" },
                  { icon: "📍", label: lb ? "ঠিকানা" : "Address", value: "Maijdee Court, Noakhali, Bangladesh" },
                  { icon: "🕐", label: lb ? "অফিস সময়" : "Office Hours", value: lb ? "শনি–বৃহস্পতি, সকাল ৯টা – রাত ৯টা" : "Sat–Thu, 9AM – 9PM" },
                ].map(item => (
                  <div key={item.label} className="flex gap-3 sm:gap-4 border border-border bg-white p-3 sm:p-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-muted">{item.label}</p>
                      {item.href
                        ? <a href={item.href} className="text-sm font-bold text-primary hover:underline break-all">{item.value}</a>
                        : <p className="text-sm font-semibold text-ink">{item.value}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 sm:mt-6 border border-border bg-white p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">
                  {lb ? "সোশ্যাল মিডিয়া" : "Social Media"}
                </p>
                <div className="flex gap-2 sm:gap-3">
                  {[
                    { label: "Facebook", href: "https://facebook.com", color: "#1877F2" },
                    { label: "YouTube",  href: "https://youtube.com",  color: "#FF0000" },
                    { label: "X",        href: "https://x.com",        color: "#111111" },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                      className="flex-1 py-2 text-center text-xs font-black text-white hover:opacity-80 transition-opacity"
                      style={{ background: s.color }}>
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <AdCards placement="partnership" />
      </div>
    </>
  );
}
