import { useState, type FormEvent } from "react";
import { Languages, Send } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StateFeedback";
import { requestTutorExplanation } from "../services/api";
import type {
  ClassLevel,
  CurriculumBoard,
  SubjectArea,
  TutorLanguage,
} from "../types/navigation";

const SUBJECT_OPTIONS: readonly SubjectArea[] = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
];

const CLASS_OPTIONS: readonly ClassLevel[] = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const BOARD_OPTIONS: readonly CurriculumBoard[] = [
  "NCERT / CBSE",
  "Karnataka State Board",
];

const LANGUAGE_OPTIONS: readonly TutorLanguage[] = [
  "English",
  "Kannada",
  "Hindi",
];

export function TutorPage() {
  const [subject, setSubject] = useState<SubjectArea>("Physics");
  const [classLevel, setClassLevel] = useState<ClassLevel>("Class 8");
  const [board, setBoard] = useState<CurriculumBoard>("NCERT / CBSE");
  const [language, setLanguage] = useState<TutorLanguage>("English");
  const [question, setQuestion] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    explanation: string;
    model: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      setError("Please enter a STEM question or concept to explore.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await requestTutorExplanation({
        question: trimmed,
        subject,
        classLevel,
        board,
        language,
      });
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate an explanation right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        indexLabel="AI Tutor"
        title="Multilingual STEM Concept Tutor"
        description="Ask a science or mathematics question aligned to Classes 6–10. All Gemini API requests are processed strictly through the backend server."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Request Form */}
        <Card tone="surface" padding="md" className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1.5 text-sm">
                <span className="block text-xs font-medium text-[var(--text-secondary)]">
                  Subject
                </span>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectArea)}
                  className="w-full min-h-[42px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {SUBJECT_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="block text-xs font-medium text-[var(--text-secondary)]">
                  Class Level
                </span>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                  className="w-full min-h-[42px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {CLASS_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="block text-xs font-medium text-[var(--text-secondary)]">
                  Board
                </span>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value as CurriculumBoard)}
                  className="w-full min-h-[42px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {BOARD_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="block text-xs font-medium text-[var(--text-secondary)]">
                  Language
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as TutorLanguage)}
                  className="w-full min-h-[42px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {LANGUAGE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="block text-xs font-medium text-[var(--text-secondary)]">
                Concept or Question
              </span>
              <textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: Why does a spoon appear bent when placed in a glass of water?"
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-y"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" variant="primary" isLoading={isLoading}>
                <Send className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                Explain Concept
              </Button>
              {result || error || question ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setQuestion("");
                    setResult(null);
                    setError(null);
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        {/* Response Output */}
        <div className="lg:col-span-7 space-y-4">
          {isLoading ? (
            <LoadingState
              title="Preparing explanation"
              message={`Generating a ${language} explanation aligned to ${classLevel} ${subject}.`}
            />
          ) : error ? (
            <ErrorState
              title="Tutor response unavailable"
              message={error}
            />
          ) : result ? (
            <Card tone="surface" padding="md" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)] text-xs text-[var(--text-muted)]">
                <span>
                  {board} · {classLevel} · {subject} · {language}
                </span>
                <span className="font-mono">{result.model}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm sm:text-base text-[var(--text-primary)] leading-relaxed">
                {result.explanation}
              </div>
            </Card>
          ) : (
            <EmptyState
              title="Ready for a concept question"
              message="Select your subject, class level, board, and preferred language, then submit a question to test the server-side Gemini integration."
              icon={<Languages className="h-5 w-5" aria-hidden="true" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
