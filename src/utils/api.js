// API client. Talks to the serverless API in /api (Vercel Functions + MongoDB Atlas).
// Keeps the small axios-like surface (api.get/post/put/patch/delete -> { data }) used across the app.

export const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";
export const API_URL = "/api";
const MAX_BODY = 4_000_000; // Vercel Functions reject request bodies above ~4.5 MB
const GET_CACHE_TTL = 60_000;
const getCache = new Map();
const inFlightGets = new Map();
const cacheableGet = (path) => path.startsWith("/news/slug/") || path.startsWith("/news?") || path === "/categories";

function fileToDataUrl(file, options = {}) {
  return new Promise((resolve) => {
    if (!file || typeof FileReader === "undefined") return resolve("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl.startsWith("data:image/") || typeof Image === "undefined") return resolve(dataUrl);
      const img = new Image();
      img.onload = () => {
        try {
          // Main image -> 1200x633 (about 1.9:1). It is scaled to cover that canvas and centre-cropped, never stretched (like object-fit: cover).
          // Gallery images -> 1280x720 (16:9), fitted whole with a blurred backdrop.
          const targetWidth = Number(options.width) || 0;
          const targetHeight = Number(options.height) || 0;
          const canvas = document.createElement("canvas");
          if (targetWidth > 0 && targetHeight > 0) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const cropToCover = options.mode === "cover";
            const scale = cropToCover ? Math.max(targetWidth / img.width, targetHeight / img.height) : Math.min(targetWidth / img.width, targetHeight / img.height);
            const drawWidth = Math.max(1, Math.round(img.width * scale));
            const drawHeight = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#f1f2ef";
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            if (!cropToCover && (drawWidth < targetWidth || drawHeight < targetHeight)) {
              // other shape: fill the leftover space with a blurred copy of the picture itself (no flat bars)
              try {
                const cover = Math.max(targetWidth / img.width, targetHeight / img.height) * 1.12;
                const cw = img.width * cover, ch = img.height * cover;
                ctx.filter = "blur(28px)";
                ctx.drawImage(img, (targetWidth - cw) / 2, (targetHeight - ch) / 2, cw, ch);
                ctx.filter = "none";
              } catch { /* browsers without ctx.filter keep the flat fill */ }
            }
            ctx.drawImage(img, Math.round((targetWidth - drawWidth) / 2), Math.round((targetHeight - drawHeight) / 2), drawWidth, drawHeight);
          } else {
            const max = 1100;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          resolve(canvas.toDataURL("image/jpeg", targetWidth ? 0.78 : 0.68));
        } catch { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function fromForm(input) {
  if (!(typeof FormData !== "undefined" && input instanceof FormData)) return { ...(input || {}) };
  const out = {};
  for (const [k, v] of input.entries()) {
    if (typeof File !== "undefined" && v instanceof File) {
      if (!v.name) continue;
      const saved = await fileToDataUrl(v, k === "gallery" ? { width: 1280, height: 720 } : k === "image" ? { width: 1200, height: 633, mode: "cover" } : {});
      if (k === "gallery") out.gallery = [...(out.gallery || []), saved];
      else out[k] = saved || v.name;
    } else if (k === "gallery") {
      out.gallery = [...(out.gallery || []), v];
    } else out[k] = v;
  }
  return out;
}

const fail = (message, status = 400) => Promise.reject({ response: { data: { message }, status } });

async function request(method, path, body) {
  let token = "";
  try { token = localStorage.getItem("nv_token") || ""; } catch { /* storage blocked */ }
  const cacheKey = `${method}:${path}`;
  const canCache = method === "GET" && !token && cacheableGet(path);
  if (canCache) {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return { data: cached.data };
    const pending = inFlightGets.get(cacheKey);
    if (pending) return pending;
  }
  const init = { method, headers: {} };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && method !== "GET" && method !== "DELETE") {
    const json = JSON.stringify(await fromForm(body));
    if (json.length > MAX_BODY) return fail("ছবি/ফাইলের সাইজ অনেক বড়। ছোট ছবি ব্যবহার করুন বা সংখ্যা কমান।", 413);
    init.headers["Content-Type"] = "application/json";
    init.body = json;
  }

  const networkTask = (async () => {
  let res;
  try { res = await fetch(`${API_URL}${path}`, init); }
  catch { return fail("সার্ভারের সাথে যোগাযোগ করা যায়নি। ইন্টারনেট সংযোগ দেখুন।", 0); }

  let data = {};
  try { data = await res.json(); } catch { /* empty / non-JSON body */ }

  if (!res.ok) {
    // Expired or invalid admin session: send the admin back to the login page.
    if (res.status === 401 && token && !path.startsWith("/auth/login") && typeof window !== "undefined") {
      try { localStorage.removeItem("nv_token"); localStorage.removeItem("nv_user"); } catch { /* ignore */ }
      if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin") window.location.assign("/admin");
    }
    return Promise.reject({ response: { data: { message: data.message || "অনুরোধটি সম্পন্ন করা যায়নি।" }, status: res.status } });
  }
  if (canCache) getCache.set(cacheKey, { data, expiresAt: Date.now() + GET_CACHE_TTL });
  if (method !== "GET") {
    for (const key of getCache.keys()) if (key.includes("/news") || key.includes("/categories")) getCache.delete(key);
  }
  // change-password issues a fresh token because the old one is invalidated.
  if (path === "/auth/change-password" && data.token) { try { localStorage.setItem("nv_token", data.token); } catch { /* ignore */ } }
  return { data };
  })();
  if (canCache) {
    inFlightGets.set(cacheKey, networkTask);
    try { return await networkTask; }
    finally { if (inFlightGets.get(cacheKey) === networkTask) inFlightGets.delete(cacheKey); }
  }
  return networkTask;
}

export function prefetchNews(slug) {
  if (!slug || typeof window === "undefined") return;
  const path = `/news/slug/${encodeURIComponent(slug)}?prefetch=1`; // prefetch never counts as a view
  request("GET", path).catch(() => {});
}

const api = {
  get: (url) => request("GET", url),
  post: (url, data) => request("POST", url, data),
  put: (url, data) => request("PUT", url, data),
  patch: (url, data) => request("PATCH", url, data ?? {}),
  delete: (url) => request("DELETE", url),
};

export function imageUrl(path) {
  if (!path) return "/noakhali-banner.png";
  // Cloudinary: ask for the smallest modern format (WebP/AVIF) at sensible quality; saves bandwidth credits.
  if (/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\/v\d+\//i.test(path)) return path.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}
export default api;
