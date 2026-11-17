import type { ReactNode } from "react";
import { AlertCircle, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "./Button";

export function LoadingState({
  title = "Loading workspace",
  message = "Fetching the latest state from the server.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center text-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-12"
    >
      <Loader2
        className="h-6 w-6 animate-spin text-[var(--accent-mocha)] mb-3"
        aria-hidden="true"
      />
      <p className="text-base font-semibold text-[var(--text-primary)]">
        {title}
      </p>
      <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-md">
        {message}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-12">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#F3EFF9] text-[var(--accent-lavender-ink)]">
        {icon ?? <FolderOpen className="h-5 w-5" aria-hidden="true" />}
      </div>
      <p className="text-base font-semibold text-[var(--text-primary)]">
        {title}
      </p>
      <p className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-lg leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Unable to complete request",
  message,
  retryLabel = "Try again",
  onRetry,
}: {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl border border-[#E5C4C4] bg-[var(--status-error-bg)] px-5 py-4 text-[var(--status-error)]"
    >
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-relaxed opacity-90">{message}</p>
      </div>
      {onRetry ? (
        <div className="shrink-0">
          <Button variant="ghost" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
