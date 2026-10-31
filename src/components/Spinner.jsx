/* Noakhali Vision loading spinner — the brand icon (logo.svg) inside a rotating green ring.
   <Spinner size={20} />   inline (buttons, small areas)
   <PageLoader />          centred block for pages / route loading
   <PageLoader fullscreen /> covers the viewport                         */
export function Spinner({ size = 48, light = false, className = "" }) {
  return (
    <span
      className={`nv-spinner ${light ? "nv-spinner--light" : ""} ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <span className="nv-spinner__ring" />
      <svg className="nv-spinner__icon" viewBox="0 0 512 512" aria-hidden="true">
        <rect width="512" height="512" rx="60" fill="#073B2A" />
        <path d="M0 0 512 512H0Z" fill="#55B52E" />
      </svg>
    </span>
  );
}

export function PageLoader({ size = 56, fullscreen = false, light = false, minHeight, label }) {
  return (
    <div
      className={`nv-pageloader ${fullscreen ? "nv-pageloader--full" : ""}`}
      style={minHeight ? { minHeight } : undefined}
    >
      <Spinner size={size} light={light} />
      {label && <p className="nv-pageloader__label">{label}</p>}
    </div>
  );
}

export default Spinner;
