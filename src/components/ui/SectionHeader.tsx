import type { ReactNode } from "react";

export interface SectionHeaderProps {
  indexLabel?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({
  indexLabel,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-5 border-b border-[var(--border-hairline)]">
      <div className="space-y-1.5 max-w-2xl">
        {indexLabel ? (
          <p className="font-mono text-xs font-medium text-[var(--accent-mocha)] tabular-nums">
            {indexLabel}
          </p>
        ) : null}
        <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-[var(--text-primary)] text-balance">
          {title}
        </h2>
        {description ? (
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
