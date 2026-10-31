import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Facebook, Mail, ArrowLeft } from "lucide-react";
import { PageLoader } from "../components/Spinner.jsx";
import api, { imageUrl } from "../utils/api";
import { setSEO } from "../utils/seo";
import { useLang } from "../utils/LanguageContext";
export default function TeamProfile() {
  const { id } = useParams(); const { lang } = useLang(); const [person,setPerson] = useState(null); const [loading,setLoading] = useState(true);
  useEffect(()=>{ setLoading(true); api.get(`/team/${id}`).then(r=>setPerson(r.data.team || r.data.member || r.data.person || r.data.teamMember)).catch(()=>setPerson(null)).finally(()=>setLoading(false)); },[id]);
  useEffect(()=>{ if(person) setSEO({title:`${lang === "bn" ? person.nameBn || person.name : person.name} | Noakhali Vision`}); },[person,lang]);
  if(loading) return <PageLoader minHeight="60vh"/>;
  if(!person) return <section className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-2xl font-black">Profile not found</h1><Link to="/team" className="mt-5 inline-block text-primary underline">Back to Team</Link></section>;
  return <section className="mx-auto max-w-4xl px-4 py-10 sm:py-16"><Link to="/team" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-primary"><ArrowLeft size={16}/> {lang === "bn" ? "টিমে ফিরে যান" : "Back to Team"}</Link><div className="grid gap-7 border border-border bg-white p-5 sm:grid-cols-[240px_1fr] sm:p-8"><div><img src={imageUrl(person.photo || person.image)} alt={person.name} className="aspect-square w-full object-cover" onError={e=>{e.currentTarget.src="/logo.svg"}}/></div><div><p className="text-xs font-black uppercase tracking-widest text-primary">Noakhali Vision Team</p><h1 className="mt-2 text-3xl font-black">{lang === "bn" ? person.nameBn || person.name : person.name}</h1><p className="mt-2 font-bold text-primary">{lang === "bn" ? person.roleBn || person.role : person.role}</p><p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted">{person.bio || (lang === "bn" ? "এই সদস্যের বিস্তারিত পরিচিতি শিগগিরই যুক্ত করা হবে।" : "Biography coming soon.")}</p><div className="mt-6 flex flex-wrap gap-4">{person.email && <a href={`mailto:${person.email}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary"><Mail size={16}/> Email</a>}{(person.facebook || person.facebookUrl) && <a href={person.facebook || person.facebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary"><Facebook size={16}/> Facebook</a>}{person.website && <a href={person.website} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary">Website</a>}</div></div></div></section>;
}
