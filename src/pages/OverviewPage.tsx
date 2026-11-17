import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  GraduationCap,
  Info,
  Languages,
} from "lucide-react";
import { LabSchematicIllustration } from "../components/layout/LabSchematicIllustration";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { ErrorState, LoadingState } from "../components/ui/StateFeedback";
import { useRouter } from "../router/RouterContext";
import { fetchHealthStatus, type HealthStatusResponse } from "../services/api";
import type { AppRoutePath } from "../types/navigation";

interface WorkspacePillar {
  index: string;
  title: string;
  scope: string;
  description: string;
  path: AppRoutePath;
  actionLabel: string;
  icon: typeof FlaskConical;
}

const WORKSPACE_PILLARS: readonly WorkspacePillar[] = [
  {
    index: "01",
    title: "Virtual Laboratories",
    scope: "3D · Walk-In · WebXR AR/VR",
    description:
      "Walk inside the 3D laboratory, complete 4 gamified experiment quests, or project benches into AR tabletop and VR.",
    path: "/labs",
    actionLabel: "Enter AR/VR Lab",
    icon: FlaskConical,
  },
  {
    index: "02",
    title: "Physics 6–10 Curriculum",
    scope: "NCERT/CBSE & Karnataka Board",
    description:
      "Structured placeholder catalog organizing Classes 6–10 Physics experiment topic slots.",
    path: "/curriculum",
    actionLabel: "Browse Topic Slots",
    icon: BookOpen,
  },
  {
    index: "03",
    title: "Multilingual AI Tutor",
    scope: "Server-Side Gemini Endpoint",
    description:
      "Concept explanations in English, Kannada, and Hindi powered through the backend API.",
    path: "/tutor",
    actionLabel: "Open AI Tutor",
    icon: Languages,
  },
  {
    index: "04",
    title: "Teacher Workspace",
    scope: "Classroom Alignment",
    description:
      "Dedicated space reserved for guided classroom preparation and board-aligned lesson planning.",
    path: "/teacher",
    actionLabel: "View Teacher Space",
    icon: GraduationCap,
  },
];

export function OverviewPage() {
  const { navigate } = useRouter();
  const [health, setHealth] = useState<HealthStatusResponse | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const loadHealth = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await fetchHealthStatus(signal);
      setHealth(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setHealthError(
        err instanceof Error
          ? err.message
          : "Unable to verify backend readiness.",
      );
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadHealth(controller.signal);
    return () => controller.abort();
  }, [loadHealth]);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6 py-2">
          <div className="space-y-4">
            <p className="text-xs sm:text-sm font-medium text-[var(--accent-mocha)]">
              Classes 6–10 · NCERT/CBSE &amp; Karnataka State Board · STEM Laboratory
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight leading-[1.15] text-[var(--text-primary)] text-balance">
              A clear, modern laboratory foundation for school science and mathematics.
            </h1>
            <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-xl">
              PHYSIX AI brings together structured virtual experiment slots, curriculum-aligned concept workspaces, and a server-side multilingual AI tutor across Physics, Chemistry, Biology, and Mathematics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/labs")}
            >
              Enter AR/VR Lab
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/curriculum")}
            >
              Physics 6–10 Curriculum
            </Button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <LabSchematicIllustration />
        </div>
      </section>

      {/* Core Workspace Pillars */}
      <section className="space-y-6">
        <SectionHeader
          indexLabel="01"
          title="Platform Workspace Foundation"
          description="Navigate between the modular areas established in the Step 1 foundation."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WORKSPACE_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={pillar.path}
                tone="surface"
                padding="md"
                className="flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-[var(--accent-mocha)] tabular-nums">
                      {pillar.index}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3EFF9] text-[var(--accent-lavender-ink)]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-[var(--text-muted)]">
                      {pillar.scope}
                    </p>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {pillar.title}
                    </h3>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(pillar.path)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-mocha)] hover:text-[var(--accent-mocha-hover)] whitespace-nowrap cursor-pointer w-fit"
                >
                  <span>{pillar.actionLabel}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Live Backend & Server-Side Gemini Readiness */}
      <section className="space-y-6">
        <SectionHeader
          indexLabel="02"
          title="Environment Readiness"
          description="Live verification of the Express backend and server-side Gemini integration."
        />

        {isLoadingHealth ? (
          <LoadingState
            title="Checking server readiness"
            message="Verifying connection to the PHYSIX AI backend."
          />
        ) : healthError ? (
          <ErrorState
            title="Backend readiness check failed"
            message={healthError}
            onRetry={() => void loadHealth()}
          />
        ) : health ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card tone="surface" padding="md" className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--status-success-bg)] text-[var(--status-success)]">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--status-success)]">
                  Server Active
                </p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Express API Gateway Connected
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Routing, health probes, and AI requests are served through the backend without exposing client secrets.
                </p>
              </div>
            </Card>

            <Card tone="surface" padding="md" className="flex items-start gap-4">
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  health.geminiConfigured
                    ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                    : "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
                ].join(" ")}
              >
                {health.geminiConfigured ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Info className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div className="space-y-1">
                <p
                  className={[
                    "text-xs font-medium",
                    health.geminiConfigured
                      ? "text-[var(--status-success)]"
                      : "text-[var(--status-warning)]",
                  ].join(" ")}
                >
                  {health.geminiConfigured
                    ? "Configured Server-Side"
                    : "Awaiting Server Secret"}
                </p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Gemini Tutor Integration
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {health.geminiConfigured
                    ? "Server-side Gemini credentials are active and ready for AI Tutor explanations."
                    : "Configure GEMINI_API_KEY in Settings > Secrets to enable live server-side explanations."}
                </p>
              </div>
            </Card>
          </div>
        ) : null}
      </section>
    </div>
  );
}
