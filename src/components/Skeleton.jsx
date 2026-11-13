// Reusable skeleton components for loading states
export function SkeletonBox({ className = "", style = {} }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${className}`}
      style={style}
    />
  );
}

export function NewsCardSkeleton({ featured = false }) {
  return (
    <article className="border border-border bg-white">
      <SkeletonBox style={{ height: featured ? "clamp(200px,40vw,430px)" : "clamp(160px,28vw,220px)" }} />
      <div className="p-3 sm:p-4">
        <SkeletonBox className="h-3 w-24 mb-2" />
        <SkeletonBox className="h-5 w-full mb-1" />
        <SkeletonBox className="h-5 w-3/4" />
      </div>
    </article>
  );
}

export function DetailsSkeleton() {
  return (
    <article className="mx-auto max-w-5xl px-3 sm:px-4 py-5 sm:py-8">
      <SkeletonBox style={{ height: "clamp(200px, 40vw, 520px)", width: "100%" }} />
      <div className="mx-auto mt-5 sm:mt-8 max-w-3xl">
        <SkeletonBox className="h-5 w-20 mb-3" />
        <SkeletonBox className="h-4 w-40 mb-3" />
        <SkeletonBox className="h-10 w-full mb-2" />
        <SkeletonBox className="h-10 w-5/6 mb-2" />
        <SkeletonBox className="h-4 w-32 mb-8 mt-3" />
        {[...Array(6)].map((_, i) => (
          <SkeletonBox key={i} className="h-4 w-full mb-3" style={{ width: i % 3 === 2 ? "80%" : "100%" }} />
        ))}
      </div>
    </article>
  );
}

export function HeroSkeleton() {
  return (
    <SkeletonBox
      className="mb-6 sm:mb-8 w-full rounded-sm"
      style={{ height: "clamp(200px, 45vw, 420px)" }}
    />
  );
}
