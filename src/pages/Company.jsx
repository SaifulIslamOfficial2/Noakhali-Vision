import { Building2, ExternalLink, Mail, MapPin, Phone, ShieldCheck, Target, Eye, BookOpen, Info } from "lucide-react";
import { useEffect, useState } from "react";
import AdCards from "../components/AdCards";
import api, { imageUrl } from "../utils/api";
import { useLang } from "../utils/LanguageContext";
import { setSEO } from "../utils/seo";

const content = {
  bn: {
    seoTitle: "কোম্পানি | নোয়াখালী ভিশন",
    badge: "আমাদের সম্পর্কে",
    heading: "নোয়াখালী ভিশন",
    sub: "নোয়াখালীর সবচেয়ে বিশ্বস্ত ও পেশাদার অনলাইন সংবাদ মাধ্যম",
    sections: [
      {
        icon: Info,
        title: "নোয়াখালী ভিশন সম্পর্কে",
        body: "নোয়াখালী ভিশন হলো নোয়াখালী অঞ্চলের একটি পেশাদার ডিজিটাল সংবাদ প্ল্যাটফর্ম। আমরা স্থানীয় জনগণের কাছে নির্ভরযোগ্য, নিরপেক্ষ এবং সময়মতো সংবাদ পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ। আমাদের দক্ষ সাংবাদিক দল সর্বদা সত্য সংবাদ পরিবেশনে নিবেদিত।",
      },
      {
        icon: Target,
        title: "আমাদের লক্ষ্য",
        body: "আমাদের লক্ষ্য হলো নোয়াখালীর প্রতিটি মানুষের কাছে সঠিক ও নিরপেক্ষ সংবাদ পৌঁছে দেওয়া। আমরা বিশ্বাস করি যে একটি তথ্যসমৃদ্ধ সমাজ একটি উন্নত সমাজ গড়তে সাহায্য করে। স্থানীয় রাজনীতি, অর্থনীতি, সংস্কৃতি ও সমাজের সব দিক আমাদের কভারেজে থাকে।",
      },
      {
        icon: Eye,
        title: "আমাদের দৃষ্টিভঙ্গি",
        body: "নোয়াখালী ভিশন স্বপ্ন দেখে এমন একটি নোয়াখালীর, যেখানে প্রতিটি নাগরিক সঠিক তথ্য পেয়ে সুচিন্তিত সিদ্ধান্ত নিতে পারবেন। আমরা ডিজিটাল মিডিয়ার মাধ্যমে নোয়াখালীর সব মানুষকে একই তথ্য-সুবিধার আওতায় আনতে চাই।",
      },
      {
        icon: ShieldCheck,
        title: "সম্পাদকীয় নীতি",
        body: "আমরা সাংবাদিকতার সর্বোচ্চ নৈতিক মান বজায় রাখি। প্রতিটি সংবাদ প্রকাশের আগে তথ্য যাচাই করা হয়। আমরা কোনো রাজনৈতিক দল বা গোষ্ঠীর পক্ষে পক্ষপাতমূলক সংবাদ প্রকাশ করি না। মিথ্যা তথ্য প্রতিরোধে আমরা দৃঢ়ভাবে প্রতিশ্রুতিবদ্ধ।",
      },
      {
        icon: Phone,
        title: "যোগাযোগ",
        body: "আমাদের সাথে যোগাযোগ করতে পারেন যেকোনো সময়। সংবাদ পাঠান, বিজ্ঞাপন দিন বা যেকোনো অভিযোগ জানান। আমরা সবসময় আপনার কথা শুনতে প্রস্তুত।",
        extra: [
          { icon: MapPin, text: "নোয়াখালী, চট্টগ্রাম বিভাগ, বাংলাদেশ" },
          { icon: Mail, text: "info@noakhalivision.com" },
          { icon: Phone, text: "+880 1700-000000" },
        ],
      },
    ],
    listed: "তালিকাভুক্ত কোম্পানি",
    listedSub: "নোয়াখালী ভিশনের সাথে যুক্ত প্রতিষ্ঠানসমূহ",
    visitSite: "ওয়েবসাইট দেখুন",
    contactLabel: "যোগাযোগ",
    noCompany: "কোনো কোম্পানি তালিকাভুক্ত নেই।",
  },
  en: {
    seoTitle: "Company | Noakhali Vision",
    badge: "About Us",
    heading: "Noakhali Vision",
    sub: "The most trusted and professional online news platform of Noakhali",
    sections: [
      {
        icon: Info,
        title: "About Noakhali Vision",
        body: "Noakhali Vision is a professional digital news platform for the Noakhali region. We are committed to delivering reliable, unbiased and timely news to the local community. Our experienced journalism team is dedicated to reporting the truth.",
      },
      {
        icon: Target,
        title: "Our Mission",
        body: "Our mission is to deliver accurate and impartial news to every person in Noakhali. We believe that an informed society helps build a better community. Our coverage includes local politics, economy, culture and all aspects of society.",
      },
      {
        icon: Eye,
        title: "Our Vision",
        body: "Noakhali Vision envisions a Noakhali where every citizen can make well-informed decisions. We aim to bring all people of Noakhali under the same information umbrella through digital media.",
      },
      {
        icon: ShieldCheck,
        title: "Editorial Policy",
        body: "We maintain the highest ethical standards of journalism. Every piece of news is verified before publication. We do not publish biased news in favour of any political party or group. We are firmly committed to preventing misinformation.",
      },
      {
        icon: Phone,
        title: "Contact Information",
        body: "You can reach us at any time. Send news tips, place advertisements or submit complaints. We are always ready to hear from you.",
        extra: [
          { icon: MapPin, text: "Noakhali, Chattogram Division, Bangladesh" },
          { icon: Mail, text: "info@noakhalivision.com" },
          { icon: Phone, text: "+880 1700-000000" },
        ],
      },
    ],
    listed: "Listed Companies",
    listedSub: "Organizations associated with Noakhali Vision",
    visitSite: "Visit Website",
    contactLabel: "Contact",
    noCompany: "No companies listed yet.",
  },
};

export default function Company() {
  const [companies, setCompanies] = useState([]);
  const { lang } = useLang();
  const c = content[lang];

  useEffect(() => {
    setSEO({ title: c.seoTitle });
    api.get("/companies")
      .then(r => setCompanies(r.data.companies || []))
      .catch(() => setCompanies([]));
  }, [lang]);

  return (
    <section className="bg-white">

      {/* Hero */}
      <div className="bg-[#EF152B] py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-3 sm:px-4">
          <p className="inline-flex items-center gap-2 text-white/70 text-sm font-bold uppercase tracking-widest">
            <Building2 size={16} /> {c.badge}
          </p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black text-white">{c.heading}</h1>
          <p className="mt-2 text-white/70 text-sm sm:text-base font-medium max-w-xl">{c.sub}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-8 sm:py-12">

        {/* Info Sections */}
        <div className="grid gap-5 sm:gap-6">
          {c.sections.map((sec, i) => {
            const Icon = sec.icon;
            return (
              <article key={i} className="border border-border p-5 sm:p-7">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-10 h-10 bg-[#EF152B]/10 text-[#EF152B] shrink-0">
                    <Icon size={20} />
                  </span>
                  <h2 className="text-lg sm:text-xl font-black">{sec.title}</h2>
                </div>
                <p className="text-muted text-sm sm:text-base leading-relaxed">{sec.body}</p>
                {sec.extra && (
                  <div className="mt-4 grid gap-2">
                    {sec.extra.map((ex, j) => {
                      const EIcon = ex.icon;
                      return (
                        <div key={j} className="flex items-center gap-2 text-sm font-bold">
                          <EIcon size={15} className="text-[#EF152B] shrink-0" />
                          <span>{ex.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Listed Companies */}
        <div className="mt-10 sm:mt-14">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-black">{c.listed}</h2>
            <p className="mt-1 text-sm text-muted font-medium">{c.listedSub}</p>
          </div>

          {companies.length === 0 ? (
            <p className="py-10 text-center text-muted font-bold border border-border">{c.noCompany}</p>
          ) : (
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
              {companies.map(co => (
                <article key={co._id} className="border border-border p-4 sm:p-5 hover:border-[#EF152B] transition-colors group">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3">
                    <img
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain shrink-0 border border-border p-1"
                      src={imageUrl(co.logo || "/logo.svg")}
                      alt={co.name}
                      onError={e => { e.target.src = "/logo.svg"; }}
                    />
                    <div>
                      <h3 className="font-black text-sm sm:text-base group-hover:text-[#EF152B] transition-colors">{co.name}</h3>
                      {co.contactEmail && (
                        <p className="text-xs text-muted font-medium mt-0.5 flex items-center gap-1">
                          <Mail size={11} /> {co.contactEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{co.description}</p>
                  {co.website && (
                    <a
                      href={co.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[#EF152B] hover:underline">
                      <ExternalLink size={13} /> {c.visitSite}
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <AdCards placement="company" />
      </div>
    </section>
  );
}
