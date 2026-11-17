import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "surface" | "muted" | "lavender";
  padding?: "sm" | "md" | "lg";
  children: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<CardProps["tone"]>, string> = {
  surface: "bg-[var(--bg-surface)] border-[var(--border-hairline)]",
  muted: "bg-[var(--bg-surface-muted)] border-[var(--border-hairline)]",
  lavender: "bg-[#F3EFF9] border-[#DCD3EB]",
};

const PADDING_CLASSES: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  tone = "surface",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border",
        TONE_CLASSES[tone],
        PADDING_CLASSES[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
