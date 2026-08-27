export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[10px] bg-panel-2 ${className}`} />;
}
