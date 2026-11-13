const setMeta = (attr, key, value) => {
  let m = document.querySelector(`meta[${attr}="${key}"]`);
  if (!m) { m = document.createElement("meta"); m.setAttribute(attr, key); document.head.appendChild(m); }
  m.setAttribute("content", value);
};

export function setSEO({ title = "Noakhali Vision", description = "Noakhali's First AI-Powered Digital News Platform" } = {}) {
  document.title = title;
  setMeta("name", "description", description);
}

/** Extra tags for a single news story: canonical, Open Graph and NewsArticle JSON-LD. Call the returned function to clean up. */
export function setArticleSEO({ url, title, description, image, published, modified, author, section }) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = url;
  setMeta("property", "og:type", "article");
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  if (image) setMeta("property", "og:image", image);
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.dataset.nvArticle = "1";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: url,
    headline: title,
    description,
    image: image ? [image] : undefined,
    datePublished: published,
    dateModified: modified || published,
    articleSection: section || undefined,
    author: { "@type": "Person", name: author || "Noakhali Vision Desk" },
    publisher: { "@type": "Organization", name: "Noakhali Vision" },
  }).replace(/</g, "\\u003c");
  document.head.appendChild(ld);
  return () => { ld.remove(); link.remove(); };
}
