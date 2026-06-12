import { useEffect, useState } from "react";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";

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
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(239,21,43,0.82) 0%,rgba(0,0,0,0.65) 100%)" }} />
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">{a.heroLabel}</p>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-widest drop-shadow-lg">NOAKHALI VISION</h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base font-semibold opacity-90">{a.heroSubtitle}</p>
        </div>
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
                <a href="mailto:noakhalivision1@gmail.com" className="text-primary font-bold hover:underline break-all">
                  noakhalivision1@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map */}
      <section style={{ background: "#f8f8f8" }} className="px-3 sm:px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-widest text-center mb-2" style={{ color: "#EF152B" }}>
            {a.mapLabel}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-6 sm:mb-10 text-ink">{a.mapHeading}</h2>

          {/* Mobile: list first, map below */}
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 items-start">

            {/* Info Panel — top on mobile */}
            <div className="w-full lg:w-72 lg:order-2">
              {hovered ? (
                <div className="rounded-xl p-4 sm:p-6" style={{ background: "#ffffff", border: "1px solid #EF152B" }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#EF152B" }}>
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
                        <p className="text-xl font-black" style={{ color: "#EF152B" }}>{val}</p>
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
                        style={{ background: active === u.name ? "#fff0f0" : "#fafafa", border: `1px solid ${active === u.name ? "#EF152B" : "#EAEAEA"}` }}
                        onMouseEnter={() => setActive(u.name)}
                        onMouseLeave={() => setActive(null)}
                        onClick={() => handleTap(u.name)}
                      >
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: "#EF152B" }} />
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
                        fill={isActive ? "#EF152B" : "#d4f0e4"}
                        stroke={isActive ? "#EF152B" : "#5bc898"}
                        strokeWidth={isActive ? "2.5" : "1.5"}
                        style={{ transition: "fill 0.2s, stroke 0.2s", filter: isActive ? "url(#glow)" : "none", fillOpacity: isActive ? 0.85 : 1 }}
                      />
                      <circle cx={u.cx} cy={u.cy} r={isActive ? 6 : 4}
                        fill={isActive ? "#EF152B" : "#22a86a"}
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
