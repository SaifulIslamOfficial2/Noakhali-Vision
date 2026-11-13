// Cloudinary image hosting (no extra npm package: plain signed REST upload).
//
// Set these three env variables (Vercel -> Settings -> Environment Variables) to turn it on:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// Without them everything keeps working the old way (images stay in MongoDB as base64).
import { createHash } from "node:crypto";

const cfg = () => ({
  cloud: process.env.CLOUDINARY_CLOUD_NAME || "",
  key: process.env.CLOUDINARY_API_KEY || "",
  secret: process.env.CLOUDINARY_API_SECRET || "",
  base: (process.env.CLOUDINARY_API_BASE || "https://api.cloudinary.com").replace(/\/+$/, ""), // tests point this at a local mock
});

export const cloudinaryOn = () => { const c = cfg(); return !!(c.cloud && c.key && c.secret); };

// Only real raster formats. SVG is refused on purpose (it can carry scripts).
const DATA_IMG = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
export const isBigDataImage = (v) => typeof v === "string" && v.length > 4000 && DATA_IMG.test(v);
export const isCloudinaryUrl = (v) => typeof v === "string" && /^https:\/\/res\.cloudinary\.com\//i.test(v);

/** Uploads one data-URL image and returns its https URL. Throws on failure. */
export async function uploadImage(dataUrl, folder = "noakhali-vision") {
  const c = cfg();
  if (!cloudinaryOn()) throw new Error("Cloudinary is not configured");
  if (!DATA_IMG.test(dataUrl)) throw new Error("Not a supported image");
  const timestamp = Math.floor(Date.now() / 1000);
  // Signature = sha1 of the sorted "key=value" pairs (without file / api_key) + API secret.
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${c.secret}`).digest("hex");
  const form = new FormData();
  form.append("file", dataUrl);
  form.append("api_key", c.key);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);
  const res = await fetch(`${c.base}/v1_1/${encodeURIComponent(c.cloud)}/image/upload`, { method: "POST", body: form, signal: AbortSignal.timeout(12_000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.secure_url) throw new Error(`Cloudinary upload failed (${res.status}) ${json?.error?.message || ""}`.trim());
  return json.secure_url;
}

/**
 * Returns a copy of `doc` where every big data-URL image (top-level field or array of them) is replaced by a
 * Cloudinary URL. Fail-soft: if one upload fails the original base64 is kept, so an editor never loses work.
 */
export async function offloadImages(doc, folder) {
  if (!cloudinaryOn() || !doc || typeof doc !== "object") return doc;
  const out = { ...doc };
  const jobs = [];
  const swap = async (v) => {
    if (!isBigDataImage(v)) return v;
    try { return await uploadImage(v, folder); }
    catch (e) { console.error("cloudinary: upload failed, keeping base64:", e?.message || e); return v; }
  };
  for (const [k, v] of Object.entries(doc)) {
    if (isBigDataImage(v)) jobs.push(swap(v).then((u) => { out[k] = u; }));
    else if (Array.isArray(v) && v.some(isBigDataImage)) jobs.push(Promise.all(v.map(swap)).then((arr) => { out[k] = arr; }));
  }
  await Promise.all(jobs);
  return out;
}

/** Facebook/WhatsApp preview: a 1200x630 crop-free version (picture centred on a blurred copy of itself). */
export function ogImageUrl(url) {
  if (!isCloudinaryUrl(url) || !url.includes("/image/upload/")) return null;
  return url.replace("/image/upload/", "/image/upload/c_pad,b_blurred:400:15,w_1200,h_630,f_jpg,q_auto/");
}
