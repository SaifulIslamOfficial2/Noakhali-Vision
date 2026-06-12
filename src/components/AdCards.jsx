import { useEffect, useState } from "react";
import api, { imageUrl } from "../utils/api";

export default function AdCards({ placement = "homepage", limit = 2 }) {
  const [ads, setAds] = useState([]);
  useEffect(() => {
    api.get(`/ads?placement=${placement}`)
      .then(r => setAds(r.data.ads.slice(0, limit)))
      .catch(() => setAds([]));
  }, [placement, limit]);

  if (!ads.length) return null;

  return (
    <section className="my-4 sm:my-6">
      <div className="mb-1 text-xs font-black uppercase text-muted tracking-widest">Advertisement</div>
      <div className="flex flex-col gap-3">
        {ads.map(a => {
          const isBanner = (a.adType || "banner") === "banner";

          const card = isBanner ? (
            /* ── Banner: full width, original ratio ── */
            <article className="w-full overflow-hidden border border-border hover:opacity-90 transition-opacity">
              <img
                className="w-full h-auto block"
                src={imageUrl(a.image)}
                alt={a.title}
                loading="lazy"
              />
            </article>
          ) : (
            /* ── Square: portrait box, max 300px wide ── */
            <article className="overflow-hidden border border-border hover:opacity-90 transition-opacity mx-auto w-full" style={{ maxWidth: "300px" }}>
              <img
                className="w-full object-cover"
                style={{ aspectRatio: "1/1", objectPosition: "center" }}
                src={imageUrl(a.image)}
                alt={a.title}
                loading="lazy"
              />
            </article>
          );

          return a.link
            ? <a key={a._id} href={a.link} target="_blank" rel="noreferrer" className="block w-full">{card}</a>
            : <div key={a._id} className="w-full">{card}</div>;
        })}
      </div>
    </section>
  );
}
