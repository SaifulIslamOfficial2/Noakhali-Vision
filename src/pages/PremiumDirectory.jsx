import { BadgeCheck, Eye, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { imageUrl } from "../utils/api";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";

const t = {
  bn: {
    seoTitle: "প্রিমিয়াম সদস্য | নোয়াখালী ভিশন",
    label: "প্রিমিয়াম ডিরেক্টরি",
    heading: "প্রিমিয়াম সদস্যবৃন্দ",
    sub: "নোয়াখালী ভিশনের সকল সম্মানিত প্রিমিয়াম সদস্যদের তালিকা",
    join: "সদস্য হোন",
    view: "প্রোফাইল দেখুন",
    search: "নাম বা আইডি দিয়ে খুঁজুন...",
    empty: "কোনো সদস্য পাওয়া যায়নি।",
    loading: "লোড হচ্ছে...",
    memberId: "মেম্বার আইডি",
  },
  en: {
    seoTitle: "Premium Members | Noakhali Vision",
    label: "Premium Directory",
    heading: "Premium Members",
    sub: "All honoured premium members of Noakhali Vision",
    join: "Become a Member",
    view: "View Profile",
    search: "Search by name or ID...",
    empty: "No members found.",
    loading: "Loading...",
    memberId: "Member ID",
  },
};

export default function PremiumDirectory() {
  const { lang } = useLang();
  const tx = t[lang];
  const [members, setMembers] = useState([]);
  const [query, setQuery]     = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    setSEO({ title: tx.seoTitle });
    setFetching(true);
    api.get("/premium/members")
      .then(r => setMembers(r.data.members || []))
      .catch(() => setMembers([]))
      .finally(() => setFetching(false));
  }, [lang]);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.memberId.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-[#EF152B] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <p className="inline-flex items-center gap-2 text-white/70 text-sm font-bold uppercase tracking-widest">
            <Users size={16} /> {tx.label}
          </p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black text-white">{tx.heading}</h1>
          <p className="mt-2 text-white/70 text-sm sm:text-base font-medium">{tx.sub}</p>

          {/* Search */}
          <div className="mt-6 flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-3 max-w-md">
            <Search size={18} className="text-white/60 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tx.search}
              className="bg-transparent text-white placeholder-white/50 text-sm font-medium w-full outline-none"
            />
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-bold text-muted">{filtered.length} জন সদস্য</p>
          <Link className="bg-primary px-4 py-2.5 font-black text-white text-sm" to="/premium-member">
            {tx.join}
          </Link>
        </div>

        {fetching ? (
          <div className="py-20 text-center text-muted font-bold">{tx.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted font-bold">{tx.empty}</div>
        ) : (
          <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(m => (
              <article key={m.memberId} className="border border-border bg-white hover:border-primary transition-colors group">
                {/* Photo */}
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={imageUrl(m.photo)}
                    alt={m.name}
                    loading="lazy"
                    onError={e => { e.target.src = "/logo.svg"; }}
                  />
                </div>

                <div className="p-3 sm:p-4">
                  {/* Badge */}
                  <span className="inline-flex items-center gap-1 text-primary text-xs font-black">
                    <BadgeCheck size={12} /> Premium
                  </span>

                  {/* Name */}
                  <h2 className="mt-1 text-sm sm:text-base font-black line-clamp-1">{m.name}</h2>

                  {/* ID */}
                  <p className="mt-0.5 text-xs font-bold text-muted">{m.memberId}</p>

                  {/* View Button */}
                  <Link
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-primary px-3 py-2 font-black text-primary text-xs sm:text-sm hover:bg-primary hover:text-white transition-colors"
                    to={`/member/${m.memberId}`}>
                    <Eye size={14} /> {tx.view}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
