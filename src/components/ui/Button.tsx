import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-mocha)] text-white hover:bg-[var(--accent-mocha-hover)] border border-transparent",
  secondary:
    "bg-[var(--accent-lavender)] text-[var(--accent-lavender-ink)] hover:bg-[#DBD2EB] border border-[var(--border-hairline)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)] border border-[var(--border-hairline)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "min-h-[42px] px-4 py-2 text-sm",
  lg: "min-h-[46px] px-6 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap shrink-0",
        "transition-colors duration-150 ease-out cursor-pointer",
        "disabled:opacity-55 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
