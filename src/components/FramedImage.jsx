import { useState } from "react";

/* Shows a picture whole (never cropped) inside its parent frame. If the picture's shape differs from the frame
   (old landscape photos in a 4:5 frame, for example) the leftover space is filled with a blurred copy of the same
   picture instead of an empty grey/beige band. Exact-shape pictures skip the blurred copy. */
export default function FramedImage({ src, alt = "", ratio = 0.8, fit = "contain", eager = false, onError, className = "", imgClassName = "" }) {
  const [bg, setBg] = useState(fit !== "cover"); // cover fills the frame, so no blurred backdrop is needed
  return (
    <span className={`absolute inset-0 block overflow-hidden ${className}`}>
      {bg && (
        <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(18px) saturate(1.1)", transform: "scale(1.15)", opacity: 0.85 }} />
      )}
      <img
        src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={onError}
        onLoad={(e) => { const { naturalWidth: w, naturalHeight: h } = e.currentTarget; if (w && h && Math.abs(w / h - ratio) < 0.02) setBg(false); }}
        className={imgClassName}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: "center" }}
      />
    </span>
  );
}
