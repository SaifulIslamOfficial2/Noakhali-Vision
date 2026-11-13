import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../utils/api";

/* Reporter chip: avatar (or Noakhali Vision logo for the desk) + name.
   Click -> that author's profile (/author/<id>); desk -> /author/desk (all Noakhali Vision Desk news).
   Cards are already wrapped in <Link>, so this uses a button + navigate() rather than a nested <a>. */
export function authorOf(news) {
  return news?.authorName || (typeof news?.author === "string" ? news.author : news?.author?.name) || "Noakhali Vision Desk";
}

export default function AuthorChip({ news, color, size = 20, className = "" }) {
  const navigate = useNavigate();
  const [broken, setBroken] = useState(false);
  const id = news?.authorId || "desk";
  const name = authorOf(news);
  const src = news?.authorAvatar && !broken ? imageUrl(news.authorAvatar) : id === "desk" ? "/logo.svg" : "";
  const go = (e) => { e.preventDefault(); e.stopPropagation(); navigate(`/author/${encodeURIComponent(id)}`); };
  const box = { width: size, height: size };
  return (
    <button type="button" onClick={go} title={name} className={`inline-flex items-center gap-1.5 text-left hover:underline ${className}`}>
      {src
        ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} style={box} className="shrink-0 rounded-full border border-black/10 bg-white object-cover" />
        : <span style={{ ...box, fontSize: size * 0.5 }} className="grid shrink-0 place-items-center rounded-full bg-[#0B4D35] font-black text-white">{String(name).slice(0, 1)}</span>}
      <span className="font-extrabold" style={color ? { color } : undefined}>{name}</span>
    </button>
  );
}
