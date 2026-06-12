import { BadgeCheck, Download, ExternalLink, IdCard, ImagePlus, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api, { imageUrl, SITE_URL } from "../utils/api";
import { setSEO } from "../utils/seo";

const fmt = d => d ? new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : "-";

export default function MemberProfile() {
  const { memberId } = useParams();
  const [member, setMember]           = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [msg, setMsg]                 = useState("");
  const [loading, setLoading]         = useState(false);
  const [fetching, setFetching]       = useState(true);

  useEffect(() => {
    setSEO({ title: `${memberId} | Noakhali Vision` });
    setFetching(true);
    api.get(`/premium/members/${memberId}`)
      .then(r => { setMember(r.data.member); setSubmissions(r.data.submissions || []); })
      .catch(() => setMember(null))
      .finally(() => setFetching(false));
  }, [memberId]);

  const qr = useMemo(() =>
    `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${SITE_URL}/member/${memberId}`)}`,
    [memberId]
  );

  const downloadCard = () => {
    if (!member) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">
      <rect width="900" height="540" fill="#fff"/>
      <rect x="24" y="24" width="852" height="492" fill="#fff" stroke="#EF152B" stroke-width="8"/>
      <circle cx="125" cy="145" r="62" fill="#EF152B"/>
      <text x="125" y="156" text-anchor="middle" font-size="48" font-family="Arial" fill="#fff" font-weight="700">NV</text>
      <text x="220" y="110" font-size="32" font-family="Arial" font-weight="700" fill="#111">Noakhali Vision</text>
      <text x="220" y="150" font-size="22" font-family="Arial" fill="#A71926" font-weight="700">Premium Member Card</text>
      <text x="72" y="278" font-size="48" font-family="Arial" font-weight="700" fill="#111">${member.name}</text>
      <text x="72" y="330" font-size="28" font-family="Arial" fill="#EF152B" font-weight="700">${member.memberId}</text>
      <text x="72" y="378" font-size="24" font-family="Arial" fill="#111">Join Date: ${fmt(member.joinDate)}</text>
      <text x="72" y="430" font-size="24" font-family="Arial" fill="#EF152B" font-weight="700">Premium Badge</text>
      <image href="${qr}" x="680" y="275" width="150" height="150"/>
      <text x="755" y="455" text-anchor="middle" font-size="18" font-family="Arial" fill="#666">Scan Profile</text>
    </svg>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = `${member.memberId}-premium-card.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const submitNews = async e => {
    e.preventDefault(); setLoading(true); setMsg("");
    try {
      const data = new FormData(e.currentTarget);
      const r = await api.post(`/premium/members/${memberId}/news`, data, { headers: { "Content-Type": "multipart/form-data" } });
      setSubmissions([r.data.submission, ...submissions]);
      setMsg(`News submitted. Remaining submissions this year: ${r.data.remaining}`);
      e.currentTarget.reset();
    } catch (err) {
      setMsg(err.response?.data?.message || "Unable to submit news right now.");
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <section className="mx-auto max-w-4xl px-3 sm:px-4 py-20 text-center">
      <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin mx-auto" />
    </section>
  );

  if (!member) return (
    <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-black">Premium member not found</h1>
    </section>
  );

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-10">
      <div className="grid gap-5 sm:gap-7 lg:grid-cols-[.9fr_1.1fr]">

        {/* Sidebar */}
        <aside className="border border-border p-4 sm:p-5">
          <img className="aspect-square w-full object-cover max-h-72 sm:max-h-none" src={imageUrl(member.photo)} alt={member.name} />
          <div className="mt-4 sm:mt-5 flex items-center gap-2 text-primary">
            <BadgeCheck size={20} /><b>Premium Badge</b>
          </div>
          <h1 className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-black">{member.name}</h1>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-primary">{member.memberId}</p>
          <a className="mt-3 sm:mt-4 inline-flex items-center gap-2 font-bold text-secondary text-sm sm:text-base"
            href={member.facebookUrl} target="_blank" rel="noreferrer">
            Facebook Profile <ExternalLink size={14} />
          </a>
          <dl className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-1 gap-3 text-sm">
            {[
              ["Join Date", fmt(member.joinDate)],
              ["Expiry Date", fmt(member.expiryDate)],
              ["Status", member.membershipStatus],
              ["News Count", member.publishedNewsCount || 0],
            ].map(([dt, dd]) => (
              <div key={dt}>
                <dt className="font-black text-xs sm:text-sm">{dt}</dt>
                <dd className="text-muted">{dd}</dd>
              </div>
            ))}
          </dl>
        </aside>

        {/* Main content */}
        <div className="grid gap-5 sm:gap-7">

          {/* Member Card */}
          <div className="border border-border p-4 sm:p-5">
            <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <p className="inline-flex items-center gap-2 font-black uppercase text-primary text-sm">
                  <IdCard size={18} /> Digital Member Card
                </p>
                <h2 className="mt-1 sm:mt-2 text-xl sm:text-3xl font-black">Noakhali Vision Premium Card</h2>
              </div>
              <button onClick={downloadCard}
                className="inline-flex items-center gap-2 bg-primary px-4 sm:px-5 py-2.5 sm:py-3 font-black text-white text-sm">
                <Download size={16} />Download
              </button>
            </div>
            <div className="mt-4 sm:mt-5 border border-primary p-3 sm:p-5">
              <div className="flex items-center justify-between gap-3 sm:gap-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  <img src="/logo.svg" className="h-12 w-12 sm:h-16 sm:w-16" alt="logo" />
                  <div>
                    <b className="block text-base sm:text-xl">Noakhali Vision</b>
                    <span className="font-bold text-primary text-sm">Premium Member</span>
                  </div>
                </div>
                <img className="h-20 w-20 sm:h-28 sm:w-28 shrink-0" src={qr} alt="QR" />
              </div>
              <div className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4">
                <img className="h-16 w-16 sm:h-20 sm:w-20 object-cover shrink-0" src={imageUrl(member.photo)} alt={member.name} />
                <div>
                  <h3 className="text-lg sm:text-2xl font-black">{member.name}</h3>
                  <p className="font-black text-primary text-sm sm:text-base">{member.memberId}</p>
                  <p className="text-xs sm:text-sm text-muted">Join: {fmt(member.joinDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* News Submission */}
          <form onSubmit={submitNews} className="border border-border p-4 sm:p-5">
            <h2 className="text-xl sm:text-3xl font-black">Premium Member News Submission</h2>
            <p className="mt-1 sm:mt-2 text-muted text-sm">Limit: 12 News Per Year</p>
            <div className="mt-4 sm:mt-5 grid gap-3 sm:gap-4">
              <input required name="title" className="border border-border px-3 sm:px-4 py-3 text-sm w-full" placeholder="Title" />
              <label className="grid gap-2 border border-border px-3 sm:px-4 py-3 text-sm font-bold">
                <span className="flex items-center gap-2"><ImagePlus size={16} />Featured Image</span>
                <input required name="featuredImage" type="file" accept="image/*" />
              </label>
              <input required name="location" className="border border-border px-3 sm:px-4 py-3 text-sm w-full" placeholder="Location" />
              <textarea required name="shortNews" className="min-h-24 border border-border px-3 sm:px-4 py-3 text-sm w-full resize-none" placeholder="Short News" />
              <button disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 font-black text-white disabled:opacity-60 w-full sm:w-auto">
                <Send size={16} />{loading ? "Submitting..." : "Submit"}
              </button>
              {msg && <p className="border border-border p-3 font-bold text-secondary text-sm">{msg}</p>}
            </div>
          </form>

          {/* Submission Status */}
          <div className="border border-border p-4 sm:p-5">
            <h2 className="text-xl sm:text-2xl font-black">News Submission Status</h2>
            <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3">
              {submissions.length
                ? submissions.map(s => (
                    <div className="flex flex-wrap justify-between gap-2 sm:gap-3 border border-border p-3 sm:p-4" key={s._id}>
                      <b className="text-sm">{s.title}</b>
                      <span className="font-black text-primary text-sm">{s.status}</span>
                    </div>
                  ))
                : <p className="text-muted text-sm">No premium news submissions yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
