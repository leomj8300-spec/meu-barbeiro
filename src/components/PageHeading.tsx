import type { ReactNode } from "react";

export function PageHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {icon && (
        <span className="panel w-11 h-11 flex items-center justify-center text-accent-label shrink-0">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h1 className="heading-display text-2xl text-text">{title}</h1>
        {subtitle && <p className="text-text-dim text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
