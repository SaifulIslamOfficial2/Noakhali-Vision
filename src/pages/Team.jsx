import { useEffect, useState } from "react";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";
import api, { imageUrl } from "../utils/api";

function MemberCard({ m, isBn }) {
  return (
    <div className="group border border-border bg-white p-5 sm:p-6 text-center hover:border-primary transition-colors flex flex-col items-center">
      <div className="mx-auto mb-4 h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-2 border-border group-hover:border-primary transition-colors">
        {m.photo
          ? <img src={imageUrl(m.photo)} alt={m.name} className="h-full w-full object-cover" onError={e => { e.target.src = "/logo.svg"; }} />
          : <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 text-3xl font-black">
              {m.name.charAt(0)}
            </div>
        }
      </div>
      <h3 className="font-black text-base sm:text-lg leading-tight">
        {isBn && m.nameBn ? m.nameBn : m.name}
      </h3>
      {!isBn && m.nameBn && <p className="text-sm text-muted font-semibold">{m.nameBn}</p>}
      <p className="mt-1 text-xs font-black uppercase tracking-widest text-primary">
        {isBn && m.roleBn ? m.roleBn : m.role}
      </p>
      {m.bio && <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-3">{m.bio}</p>}
      <div className="mt-4 flex justify-center gap-3 flex-wrap">
        {m.email && (
          <a href={`mailto:${m.email}`} className="text-xs font-bold text-primary hover:underline">
            ✉ Email
          </a>
        )}
        {m.facebook && (
          <a href={m.facebook} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">
            f Facebook
          </a>
        )}
      </div>
    </div>
  );
}

export default function Team() {
  const { lang } = useLang();
  const isBn = lang === "bn";
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSEO({ title: isBn ? "আমাদের টিম | নোয়াখালী ভিশন" : "Our Team | Noakhali Vision" });
    api.get("/team")
      .then(r => setMembers(r.data.team))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [lang]);

  return (
    <div>
      {/* Hero */}
      <section
        className="relative flex items-center justify-center"
        style={{ backgroundImage: "url(/hero-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center", height: "260px" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(239,21,43,0.80) 0%,rgba(0,0,0,0.60) 100%)" }} />
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-xs font-black uppercase tracking-widest opacity-75 mb-2">NOAKHALI VISION</p>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-widest drop-shadow-lg">
            {isBn ? "আমাদের টিম" : "Our Team"}
          </h1>
          <p className="mt-2 text-sm sm:text-base font-semibold opacity-85">
            {isBn ? "যারা নোয়াখালী ভিশন পরিচালনা করেন" : "The people behind Noakhali Vision"}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        {loading ? (
          <div className="py-24 text-center text-muted font-semibold">Loading...</div>
        ) : members.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted font-semibold text-lg">
              {isBn ? "টিম সদস্যরা শীঘ্রই যোগ দেবেন।" : "Team members coming soon."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Meet The Team</p>
              <h2 className="text-2xl sm:text-3xl font-black">
                {isBn ? "যারা Noakhali Vision পরিচালনা করেন" : "The people who run Noakhali Vision"}
              </h2>
            </div>
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {members.map(m => <MemberCard key={m._id} m={m} isBn={isBn} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
