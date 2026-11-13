/* Smooth scroll-reveal (opacity + small translate only → GPU-cheap).
   Elements already on screen are never hidden (no flash / no LCP delay);
   only things below the fold fade up once when they scroll into view. */
const SELECTOR = [
  "main section", "main article", ".ui-card", ".news-editorial-card",
  ".nv-editorial-card", ".nvn-card", "footer .grid > *",
].join(",");
const SKIP = ".nv-home-carousel, .nv-home-carousel *, header, nav, [data-no-reveal], [data-no-reveal] *";

export function initReveal() {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  if (location.pathname.startsWith("/admin")) return;

  const seen = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("nv-in");
      io.unobserve(e.target);
      setTimeout(() => e.target.classList.remove("nv-reveal", "nv-in"), 800);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

  const scan = (root = document) => {
    if (location.pathname.startsWith("/admin")) return;
    const list = root.querySelectorAll ? [...root.querySelectorAll(SELECTOR)] : [];
    if (root.matches?.(SELECTOR)) list.unshift(root);
    const vh = window.innerHeight;
    list.forEach((el, i) => {
      if (seen.has(el) || el.closest(SKIP) || el.matches(SKIP)) return;
      seen.add(el);
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.98) return;          // already visible → leave untouched
      el.classList.add("nv-reveal");
      el.style.setProperty("--nv-d", `${(i % 4) * 70}ms`);
      io.observe(el);
    });
  };

  let t;
  const mo = new MutationObserver((muts) => {
    clearTimeout(t);
    t = setTimeout(() => { for (const m of muts) m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n)); }, 60);
  });
  scan();
  mo.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
}
