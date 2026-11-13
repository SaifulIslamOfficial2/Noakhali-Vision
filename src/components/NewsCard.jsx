import { useNavigate } from "react-router-dom";
import { imageUrl, prefetchNews } from "../utils/api";
import FramedImage from "./FramedImage";

const preloadDetailsPage = () => import("../pages/Details.jsx").catch(() => {});

/* Simple card — used in Details related section etc.
   Main image ratio 1200×633, title/text নেই */
export default function NewsCard({ news, featured = false }) {
  const navigate = useNavigate();
  return (
    <article
      className="group cursor-pointer overflow-hidden"
      onClick={() => news.slug && navigate(`/news/${news.slug}`, { state: { news } })}
      onMouseEnter={() => { prefetchNews(news.slug); preloadDetailsPage(); }}
      onTouchStart={() => { prefetchNews(news.slug); preloadDetailsPage(); }}
      title={news.title}
    >
      <div className="relative overflow-hidden w-full" style={{ aspectRatio: "1200/633" }}>
        <FramedImage src={imageUrl(news.image)} alt={news.title} eager={featured} ratio={1200 / 633} fit="cover" />
      </div>
    </article>
  );
}
