import { useNavigate } from "react-router-dom";
import { imageUrl } from "../utils/api";

/* Simple card — used in Details related section etc.
   Image ratio 16:9 (1280×720), title/text নেই */
export default function NewsCard({ news, featured = false }) {
  const navigate = useNavigate();
  return (
    <article
      className="group cursor-pointer overflow-hidden"
      onClick={() => news.slug && navigate(`/news/${news.slug}`)}
      title={news.title}
    >
      <div className="relative overflow-hidden w-full" style={{ aspectRatio: "16/9" }}>
        <img
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          src={imageUrl(news.image)}
          alt={news.title}
          loading={featured ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
    </article>
  );
}
