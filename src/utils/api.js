// API client. Talks to the serverless API in /api (Vercel Functions + MongoDB Atlas).
// Keeps the small axios-like surface (api.get/post/put/patch/delete -> { data }) used across the app.

export const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";
export const API_URL = "/api";
const MAX_BODY = 4_000_000; // Vercel Functions reject request bodies above ~4.5 MB

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || typeof FileReader === "undefined") return resolve("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl.startsWith("data:image/") || typeof Image === "undefined") return resolve(dataUrl);
      const img = new Image();
      img.onload = () => {
        try {
          // Shrink photos before upload so they stay small in the database.
          const max = 1100;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.68));
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
      const saved = await fileToDataUrl(v);
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
  const init = { method, headers: {} };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && method !== "GET" && method !== "DELETE") {
    const json = JSON.stringify(await fromForm(body));
    if (json.length > MAX_BODY) return fail("ছবি/ফাইলের সাইজ অনেক বড়। ছোট ছবি ব্যবহার করুন বা সংখ্যা কমান।", 413);
    init.headers["Content-Type"] = "application/json";
    init.body = json;
  }

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
  // change-password issues a fresh token because the old one is invalidated.
  if (path === "/auth/change-password" && data.token) { try { localStorage.setItem("nv_token", data.token); } catch { /* ignore */ } }
  return { data };
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
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}
export default api;
