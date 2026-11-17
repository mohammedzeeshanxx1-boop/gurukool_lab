import { useMemo, useState } from "react";
import { BookOpen, Layers, Search } from "lucide-react";
import { ExperimentTopicList } from "../components/curriculum/ExperimentTopicList";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { EmptyState } from "../components/ui/StateFeedback";
import {
  PHYSICS_CURRICULUM_PLACEHOLDERS,
  PHYSICS_EXPERIMENT_TOPICS,
  type PhysicsExperimentTopic,
} from "../data/physicsCurriculumPlaceholder";
import { useRouter } from "../router/RouterContext";
import type {
  ClassLevel,
  CurriculumBoard,
  SubjectArea,
} from "../types/navigation";

const SUBJECT_TABS: readonly SubjectArea[] = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
];

const CLASS_FILTERS: readonly ("All Classes" | ClassLevel)[] = [
  "All Classes",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const BOARD_FILTERS: readonly ("All Boards" | CurriculumBoard)[] = [
  "All Boards",
  "NCERT / CBSE",
  "Karnataka State Board",
];

export function CurriculumPage() {
  const { navigate } = useRouter();
  const [activeSubject, setActiveSubject] = useState<SubjectArea>("Physics");
  const [selectedClass, setSelectedClass] = useState<"All Classes" | ClassLevel>(
    "All Classes",
  );
  const [selectedBoard, setSelectedBoard] = useState<
    "All Boards" | CurriculumBoard
  >("All Boards");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    PHYSICS_EXPERIMENT_TOPICS[0]?.id ?? null,
  );

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return PHYSICS_EXPERIMENT_TOPICS.filter((topic) => {
      if (selectedClass !== "All Classes" && topic.classLevel !== selectedClass) {
        return false;
      }
      if (
        selectedBoard !== "All Boards" &&
        !topic.boardCoverage.includes(selectedBoard)
      ) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        topic.topicTitle.toLowerCase().includes(query) ||
        topic.domainLabel.toLowerCase().includes(query) ||
        topic.slotCode.toLowerCase().includes(query) ||
        topic.placeholderSummary.toLowerCase().includes(query)
      );
    });
  }, [selectedClass, selectedBoard, searchQuery]);

  const activeTopic: PhysicsExperimentTopic | null = useMemo(() => {
    if (filteredTopics.length === 0) {
      return null;
    }
    return (
      filteredTopics.find((item) => item.id === selectedTopicId) ??
      filteredTopics[0]
    );
  }, [filteredTopics, selectedTopicId]);

  const activeClassUnit = useMemo(() => {
    if (selectedClass === "All Classes") {
      return null;
    }
    return (
      PHYSICS_CURRICULUM_PLACEHOLDERS.find(
        (unit) => unit.classLevel === selectedClass,
      ) ?? null
    );
  }, [selectedClass]);

  const resetFilters = () => {
    setSelectedClass("All Classes");
    setSelectedBoard("All Boards");
    setSearchQuery("");
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        indexLabel="Curriculum"
        title="Curriculum & Experiment Topic Placeholders"
        description="Structured placeholder slots for Classes 6–10 across NCERT/CBSE and Karnataka State Board. Verified textbook chapters and apparatus parameters will be integrated in subsequent steps."
      />

      {/* Subject Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Subject areas"
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-muted)] p-1"
        >
          {SUBJECT_TABS.map((subject) => {
            const isActive = subject === activeSubject;
            return (
              <button
                key={subject}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSubject(subject)}
                className={[
                  "min-h-[38px] px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer",
                  isActive
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent",
                ].join(" ")}
              >
                {subject}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Physics 6–10 placeholder structure active · Additional subjects scheduled
        </p>
      </div>

      {activeSubject !== "Physics" ? (
        <EmptyState
          title={`${activeSubject} curriculum placeholders not yet populated`}
          message={`In this foundation step, the Classes 6–10 placeholder structure is established for Physics first. ${activeSubject} experiment slots will follow the same modular list and inspector pattern.`}
          actionLabel="Return to Physics 6–10"
          onAction={() => setActiveSubject("Physics")}
          icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
        />
      ) : (
        <div className="space-y-6">
          {/* Class Level & Board Filter Toolbar */}
          <Card tone="surface" padding="sm" className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Class 6-10 Filter Tabs */}
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Filter by class level"
              >
                {CLASS_FILTERS.map((cls) => {
                  const active = cls === selectedClass;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={[
                        "min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer border",
                        active
                          ? "bg-[var(--accent-mocha)] text-white border-[var(--accent-mocha)]"
                          : "bg-[var(--bg-canvas)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)]",
                      ].join(" ")}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>

              {/* Search & Board Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter topic slots or domains..."
                    aria-label="Filter Physics placeholder topics"
                    className="w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>

                <select
                  aria-label="Filter by curriculum board"
                  value={selectedBoard}
                  onChange={(e) =>
                    setSelectedBoard(
                      e.target.value as "All Boards" | CurriculumBoard,
                    )
                  }
                  className="min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {BOARD_FILTERS.map((board) => (
                    <option key={board} value={board}>
                      {board}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeClassUnit ? (
              <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {activeClassUnit.sectionHeading}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {activeClassUnit.scopeDescription}
                </p>
              </div>
            ) : null}
          </Card>

          {/* List View + Slot Inspector Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
                <span className="tabular-nums">
                  Showing {filteredTopics.length} of{" "}
                  {PHYSICS_EXPERIMENT_TOPICS.length} placeholder slots
                </span>
                <span>Physics · Classes 6–10</span>
              </div>

              <ExperimentTopicList
                topics={filteredTopics}
                selectedTopicId={activeTopic?.id ?? null}
                onSelectTopic={(topic) => setSelectedTopicId(topic.id)}
                onResetFilters={resetFilters}
              />
            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-24">
              {activeTopic ? (
                <Card tone="lavender" padding="md" className="space-y-5">
                  <div className="space-y-2 pb-4 border-b border-[#DCD3EB]">
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--accent-lavender-ink)]">
                      <span className="font-mono tabular-nums font-medium">
                        {activeTopic.slotCode}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Placeholder Slot</span>
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] leading-snug">
                      {activeTopic.topicTitle}
                    </h3>
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-muted)]">Class Level</dt>
                      <dd className="font-medium text-[var(--text-primary)] text-right">
                        {activeTopic.classLevel}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-muted)]">Physics Domain</dt>
                      <dd className="font-medium text-[var(--text-primary)] text-right">
                        {activeTopic.domainLabel}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-muted)]">Board Scope</dt>
                      <dd className="font-medium text-[var(--text-primary)] text-right">
                        {activeTopic.boardCoverage.join(" · ")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-muted)]">Planned Format</dt>
                      <dd className="font-medium text-[var(--text-primary)] text-right">
                        {activeTopic.interactionFormat}
                      </dd>
                    </div>
                  </dl>

                  <div className="pt-4 border-t border-[#DCD3EB] space-y-4">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {activeTopic.placeholderSummary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate("/tutor")}
                      >
                        Ask AI Tutor About {activeTopic.domainLabel}
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => navigate("/labs")}
                      >
                        Lab Workspace
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <EmptyState
                  title="No slot selected"
                  message="Select a Physics placeholder topic from the list to inspect its structure."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
