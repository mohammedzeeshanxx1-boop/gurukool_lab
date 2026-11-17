import { ChevronRight, Layers } from "lucide-react";
import type { PhysicsExperimentTopic } from "../../data/physicsCurriculumPlaceholder";
import { EmptyState, ErrorState, LoadingState } from "../ui/StateFeedback";

export interface ExperimentTopicListProps {
  topics: readonly PhysicsExperimentTopic[];
  selectedTopicId: string | null;
  onSelectTopic: (topic: PhysicsExperimentTopic) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onResetFilters?: () => void;
}

export function ExperimentTopicList({
  topics,
  selectedTopicId,
  onSelectTopic,
  isLoading = false,
  error = null,
  onRetry,
  onResetFilters,
}: ExperimentTopicListProps) {
  if (isLoading) {
    return (
      <LoadingState
        title="Loading experiment topic slots"
        message="Preparing the Physics curriculum structure."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load Physics experiment slots"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (topics.length === 0) {
    return (
      <EmptyState
        title="No matching experiment slots"
        message="No Physics placeholder topics match the active class or board filter."
        actionLabel={onResetFilters ? "Show all classes" : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div
      className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] divide-y divide-[var(--border-hairline)] overflow-hidden"
      role="list"
      aria-label="Physics experiment topic placeholders"
    >
      {topics.map((topic, index) => {
        const isSelected = topic.id === selectedTopicId;
        const rowNumber = String(index + 1).padStart(2, "0");

        return (
          <div key={topic.id} role="listitem">
            <button
              type="button"
              onClick={() => onSelectTopic(topic)}
              aria-pressed={isSelected}
              className={[
                "w-full text-left px-5 py-4 sm:px-6 sm:py-5 transition-colors duration-150 cursor-pointer",
                "flex items-start justify-between gap-4",
                isSelected
                  ? "bg-[#F3EFF9]"
                  : "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)]",
              ].join(" ")}
            >
              <div className="flex items-start gap-4 min-w-0">
                <span
                  className={[
                    "font-mono text-xs font-medium tabular-nums pt-1 shrink-0",
                    isSelected
                      ? "text-[var(--accent-lavender-ink)]"
                      : "text-[var(--accent-mocha)]",
                  ].join(" ")}
                >
                  {rowNumber}
                </span>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)]">
                    <span className="font-mono tabular-nums text-[var(--accent-mocha)]">
                      {topic.slotCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{topic.classLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{topic.domainLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{topic.boardCoverage.join(" & ")}</span>
                  </div>

                  <p className="text-base font-semibold text-[var(--text-primary)] leading-snug">
                    {topic.topicTitle}
                  </p>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {topic.placeholderSummary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 pt-1">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-lavender-ink)] whitespace-nowrap">
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Placeholder</span>
                </span>
                <ChevronRight
                  className={[
                    "h-4 w-4 transition-transform duration-150",
                    isSelected
                      ? "text-[var(--accent-lavender-ink)] translate-x-0.5"
                      : "text-[var(--text-muted)]",
                  ].join(" ")}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
