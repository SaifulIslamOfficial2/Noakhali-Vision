import { useEffect, useState } from "react";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";
import api from "../utils/api";
import { Target, Eye, ShieldCheck, Mail, MapPin, Phone, Compass, Newspaper, HeartHandshake, Users, Globe, BadgeCheck } from "lucide-react";

const upazilas = [
  { name: "Noakhali Sadar", nameBn: "নোয়াখালী সদর", points: "520,170 640,150 680,210 660,280 580,300 510,260", cx: 590, cy: 230, pop: "~4.5L", news: 38, readers: "62K" },
  { name: "Begumganj",      nameBn: "বেগমগঞ্জ",      points: "380,140 490,120 520,170 510,260 440,280 370,230", cx: 450, cy: 200, pop: "~6.2L", news: 51, readers: "78K" },
  { name: "Chatkhil",       nameBn: "চাটখিল",         points: "280,100 390,80 430,130 380,140 370,230 290,200", cx: 360, cy: 155, pop: "~2.8L", news: 29, readers: "41K" },
  { name: "Senbagh",        nameBn: "সেনবাগ",          points: "200,200 290,200 370,230 340,310 260,320 190,270", cx: 280, cy: 260, pop: "~2.5L", news: 24, readers: "35K" },
  { name: "Companyganj",    nameBn: "কোম্পানীগঞ্জ",   points: "620,130 720,110 760,170 740,240 680,210 640,150", cx: 690, cy: 175, pop: "~3.1L", news: 33, readers: "48K" },
  { name: "Subarnachar",    nameBn: "সুবর্ণচর",        points: "580,300 660,280 740,240 760,310 720,380 620,370", cx: 670, cy: 325, pop: "~3.3L", news: 27, readers: "44K" },
  { name: "Kabirhat",       nameBn: "কবিরহাট",         points: "440,280 510,260 580,300 560,380 480,400 420,350", cx: 500, cy: 340, pop: "~2.2L", news: 19, readers: "28K" },
  { name: "Hatiya",         nameBn: "হাতিয়া",          points: "620,480 720,460 760,520 740,590 660,610 600,560", cx: 680, cy: 535, pop: "~3.9L", news: 42, readers: "71K" },
];

export default function About() {
  const { lang, tr } = useLang();
  const a = tr.about;
  const [siteSettings, setSiteSettings] = useState(null);
  useEffect(() => { api.get("/settings").then(r => setSiteSettings(r.data.settings || null)).catch(() => {}); }, []);
  const contact = siteSettings?.contact || { address: "নোয়াখালী, চট্টগ্রাম বিভাগ, বাংলাদেশ", email: "info@noakhalivision.com", phone: "+880 1700-000000" };
  const aboutContent = siteSettings?.about || {};
  const [active, setActive] = useState(null);
  const [touched, setTouched] = useState(null); // mobile tap support
  const hovered = active ? upazilas.find(u => u.name === active) : null;

  useEffect(() => {
    setSEO({ title: lang === "bn" ? "আমাদের সম্পর্কে | নোয়াখালী ভিশন" : "About | Noakhali Vision" });
  }, [lang]);

  const handleTap = (name) => {
    setTouched(v => v === name ? null : name);
    setActive(v => v === name ? null : name);
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="relative flex items-center justify-center"
        style={{ backgroundImage: "url(/hero-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center", height: "clamp(200px, 35vw, 320px)" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(11,77,53,0.82) 0%,rgba(0,0,0,0.65) 100%)" }} />
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">{a.heroLabel}</p>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-widest drop-shadow-lg">NOAKHALI VISION</h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base font-semibold opacity-90">{a.heroSubtitle}</p>
        </div>
      </section>

      {/* Mission, vision and editorial standards are editable from Admin → Website Settings. */}
      <section className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "আমাদের লক্ষ্য", text: aboutContent.mission || "আমাদের লক্ষ্য হলো নোয়াখালীর প্রতিটি মানুষের কাছে সঠিক ও নিরপেক্ষ সংবাদ পৌঁছে দেওয়া। আমরা স্থানীয় রাজনীতি, অর্থনীতি, সংস্কৃতি ও সমাজের নানা দিক তুলে ধরি।", Icon: Target },
            { title: "আমাদের দৃষ্টিভঙ্গি", text: aboutContent.vision || "আমরা এমন একটি নোয়াখালী গড়ার স্বপ্ন দেখি, যেখানে প্রতিটি নাগরিক সঠিক তথ্য পেয়ে সুচিন্তিত সিদ্ধান্ত নিতে পারবেন।", Icon: Eye },
            { title: "সম্পাদকীয় নীতি", text: aboutContent.editorial || "সংবাদ প্রকাশের আগে তথ্য যাচাই, নিরপেক্ষতা ও সাংবাদিকতার নৈতিক মান বজায় রাখতে আমরা প্রতিশ্রুতিবদ্ধ।", Icon: ShieldCheck },
          ].map(({ title, text, Icon }) => <article key={title} className="border border-border bg-white p-5 sm:p-6"><Icon size={26} className="mb-4 text-primary" aria-hidden="true"/><h2 className="text-lg font-black">{title}</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">{text}</p></article>)}
        </div>
        <article className="mt-4 border border-border bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><Mail size={23} className="text-primary"/><h2 className="text-lg font-black">যোগাযোগ</h2></div><p className="mt-3 text-sm leading-7 text-gray-600">সংবাদ পাঠাতে, বিজ্ঞাপন দিতে বা অভিযোগ জানাতে আমাদের সঙ্গে যোগাযোগ করুন।</p><div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-6"><span className="inline-flex items-center gap-2"><MapPin size={16} className="text-primary"/>{contact.address}</span><a className="inline-flex items-center gap-2 text-primary hover:underline" href={`mailto:${contact.email}`}><Mail size={16}/>{contact.email}</a><a className="inline-flex items-center gap-2 text-primary hover:underline" href={`tel:${String(contact.phone || "").replace(/[^+0-9]/g, "")}`}><Phone size={16}/>{contact.phone}</a></div></article>
      </section>

      {/* Purpose, coverage, identity and values — copy is managed in Admin → Website Settings. */}
      <section className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-12">
        <div className="mb-7 max-w-3xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[.2em] text-primary">NOAKHALI VISION</p>
          <h2 className="text-2xl font-black sm:text-3xl">{lang === "bn" ? "কেন নোয়াখালী ভিশন?" : "Why Noakhali Vision?"}</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">{aboutContent.why || "‘নোয়াখালী ভিশন’ নামটি আমাদের পরিচয় ও অঙ্গীকারের প্রতিফলন। নোয়াখালীর মানুষের কণ্ঠস্বর, যাচাই করা তথ্য, আঞ্চলিক ঐতিহ্য, জনসমস্যা ও উন্নয়নের খবর তুলে ধরে বৃহত্তর নোয়াখালীকে নির্ভরযোগ্য ডিজিটাল সংবাদমাধ্যমের আওতায় আনাই আমাদের লক্ষ্য।"}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: lang === "bn" ? "আমাদের উদ্দেশ্য" : "Our Purpose", text: aboutContent.purpose || aboutContent.mission || "স্থানীয় মানুষের কাছে দ্রুত, নির্ভুল ও প্রাসঙ্গিক সংবাদ পৌঁছে দেওয়া।", Icon: Compass },
            { title: lang === "bn" ? "আমরা কী কভার করি" : "What We Cover", text: aboutContent.coverage || "স্থানীয় রাজনীতি, অর্থনীতি, শিক্ষা, সংস্কৃতি, খেলাধুলা, জনদুর্ভোগ ও উন্নয়ন।", Icon: Newspaper },
            { title: lang === "bn" ? "আমাদের মূল্যবোধ" : "Our Values", text: aboutContent.values || "সততা, নিরপেক্ষতা, মানবিকতা, জবাবদিহি ও তথ্য যাচাই আমাদের কাজের ভিত্তি।", Icon: HeartHandshake },
            { title: lang === "bn" ? "আমাদের টিম" : "Our Team", text: lang === "bn" ? "স্থানীয় সংবাদ ও মানুষের গল্প তুলে ধরতে আমাদের টিম কাজ করে।" : "Our team works to tell local stories and amplify community voices.", Icon: Users },
            { title: lang === "bn" ? "ডিজিটাল কমিউনিটি" : "Digital Community", text: aboutContent.social || (lang === "bn" ? "আমাদের সামাজিক যোগাযোগমাধ্যমে যুক্ত থাকুন এবং গুরুত্বপূর্ণ খবর শেয়ার করুন।" : "Follow our social channels and share the stories that matter."), Icon: Globe },
            { title: lang === "bn" ? "বিশ্বাসযোগ্য সংবাদ" : "Verified Reporting", text: lang === "bn" ? "তথ্য যাচাই ও সম্পাদকীয় দায়িত্বকে আমরা অগ্রাধিকার দিই।" : "We prioritize verification and editorial responsibility.", Icon: BadgeCheck },
          ].map(({ title, text, Icon }) => <article key={title} className="group border border-border bg-white p-5 transition-shadow hover:shadow-md sm:p-6"><Icon size={25} className="mb-4 text-primary" aria-hidden="true"/><h3 className="text-lg font-black">{title}</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">{text}</p></article>)}
        </div>
        {aboutContent.faq && <article className="mt-5 border border-border bg-white p-5"><h3 className="font-black">{lang === "bn" ? "প্রায়শই জিজ্ঞাসিত প্রশ্ন" : "Frequently Asked Questions"}</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">{aboutContent.faq}</p></article>}
      </section>

      {/* About Content */}
      <section className="mx-auto max-w-4xl px-3 sm:px-4 py-8 sm:py-14">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary mb-3">{a.label}</p>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-4 sm:mb-5">
              {a.heading.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
            </h2>
            <p className="text-sm leading-7 text-gray-600"><strong>Noakhali Vision</strong> — {a.p1}</p>
            <p className="mt-4 text-sm leading-7 text-gray-600">{a.p2}</p>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {a.cards.map(([title, text]) => (
              <div key={title} className="border border-border p-4 sm:p-5">
                <b className="text-sm font-black">{title}</b>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
            <div className="border border-border p-4 sm:p-5">
              <b className="text-sm font-black">{a.contactLabel}</b>
              <p className="mt-2 text-sm text-gray-600">
                Email:{" "}
                <a href={`mailto:${contact.email}`} className="text-primary font-bold hover:underline break-all">
                  {contact.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map */}
      <section style={{ background: "var(--bg2)" }} className="px-3 sm:px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-widest text-center mb-2" style={{ color: "#0B4D35" }}>
            {a.mapLabel}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-6 sm:mb-10 text-ink">{a.mapHeading}</h2>

          {/* Mobile: list first, map below */}
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 items-start">

            {/* Info Panel — top on mobile */}
            <div className="w-full lg:w-72 lg:order-2">
              {hovered ? (
                <div className="rounded-xl p-4 sm:p-6" style={{ background: "#ffffff", border: "1px solid #0B4D35" }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#0B4D35" }}>
                    {lang === "bn" ? "উপজেলা তথ্য" : "Upazila Info"}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-ink mb-1">{lang === "bn" ? hovered.nameBn : hovered.name}</h3>
                  <p className="text-sm mb-4" style={{ color: "#555555" }}>{lang === "bn" ? hovered.name : hovered.nameBn}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
                    {[
                      [lang === "bn" ? "মোট খবর" : "Total News", hovered.news],
                      [lang === "bn" ? "পাঠক" : "Readers", hovered.readers],
                      [lang === "bn" ? "প্রিমিয়াম" : "Premium", "৩"],
                      [lang === "bn" ? "ভিডিও" : "Videos", "১৫"],
                    ].map(([label, val]) => (
                      <div key={label} className="rounded-lg p-3 text-center" style={{ background: "#f8f8f8", border: "1px solid #EAEAEA" }}>
                        <p className="text-xl font-black" style={{ color: "#0B4D35" }}>{val}</p>
                        <p className="text-xs mt-1" style={{ color: "#555555" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg p-3" style={{ background: "#f8f8f8", border: "1px solid #EAEAEA" }}>
                    <p className="text-xs" style={{ color: "#555555" }}>{lang === "bn" ? "জনসংখ্যা" : "Population"}</p>
                    <p className="text-lg font-black text-ink">{hovered.pop}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-4 sm:p-6" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
                  <p className="font-black text-ink mb-2 text-center lg:text-left">
                    {lang === "bn" ? "উপজেলা বেছে নিন" : "Select an Upazila"}
                  </p>
                  <p className="text-sm text-center lg:text-left mb-4" style={{ color: "#555555" }}>
                    {lang === "bn" ? "নিচের তালিকা বা মানচিত্র থেকে বেছে নিন" : "Tap from list or map below"}
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {upazilas.map(u => (
                      <button
                        key={u.name}
                        className="flex items-center gap-2 px-3 py-2 rounded text-left w-full"
                        style={{ background: active === u.name ? "#EAF6E4" : "#fafafa", border: `1px solid ${active === u.name ? "#0B4D35" : "#EAEAEA"}` }}
                        onMouseEnter={() => setActive(u.name)}
                        onMouseLeave={() => setActive(null)}
                        onClick={() => handleTap(u.name)}
                      >
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: "#0B4D35" }} />
                        <span className="text-sm font-bold truncate" style={{ color: "#555555" }}>
                          {lang === "bn" ? u.nameBn : u.name}
                        </span>
                        <span className="ml-auto text-xs flex-shrink-0" style={{ color: "#ffffff" }}>{u.pop}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SVG Map */}
            <div className="flex-1 lg:order-1 rounded-xl overflow-hidden w-full" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
              <svg
                viewBox="150 60 660 590"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full"
                style={{ display: "block", touchAction: "manipulation" }}
              >
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <text x="250" y="580" textAnchor="middle" fontSize="13" fill="#CCCCCC" fontWeight="bold" letterSpacing="6">
                  ~ বঙ্গোপসাগর ~
                </text>
                {upazilas.map((u) => {
                  const isActive = active === u.name;
                  return (
                    <g key={u.name}
                      onMouseEnter={() => setActive(u.name)}
                      onMouseLeave={() => setActive(null)}
                      onClick={() => handleTap(u.name)}
                      style={{ cursor: "pointer" }}
                    >
                      <polygon
                        points={u.points}
                        fill={isActive ? "#0B4D35" : "#d4f0e4"}
                        stroke={isActive ? "#0B4D35" : "#5bc898"}
                        strokeWidth={isActive ? "2.5" : "1.5"}
                        style={{ transition: "fill 0.2s, stroke 0.2s", filter: isActive ? "url(#glow)" : "none", fillOpacity: isActive ? 0.85 : 1 }}
                      />
                      <circle cx={u.cx} cy={u.cy} r={isActive ? 6 : 4}
                        fill={isActive ? "#0B4D35" : "#22a86a"}
                        style={{ transition: "all 0.2s" }}
                        filter={isActive ? "url(#glow)" : "none"}
                      />
                      <text x={u.cx} y={u.cy + 18} textAnchor="middle"
                        fontSize={isActive ? "13" : "11"} fontWeight="bold"
                        fill={isActive ? "#fff" : "#1a5c3a"}
                        style={{ fontFamily: "'Hind Siliguri', sans-serif", transition: "all 0.2s", pointerEvents: "none" }}
                      >
                        {lang === "bn" ? u.nameBn : u.name}
                      </text>
                    </g>
                  );
                })}
                <text x="680" y="455" textAnchor="middle" fontSize="10" fill="#CCCCCC" fontStyle="italic">
                  {lang === "bn" ? "~ মেঘনা মোহনা ~" : "~ Meghna Estuary ~"}
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
