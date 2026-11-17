import { GraduationCap } from "lucide-react";
import { SectionHeader } from "../components/ui/SectionHeader";
import { EmptyState } from "../components/ui/StateFeedback";
import { useRouter } from "../router/RouterContext";

export function TeacherPage() {
  const { navigate } = useRouter();

  return (
    <div className="space-y-8">
      <SectionHeader
        indexLabel="Teacher"
        title="Teacher & Classroom Workspace"
        description="Dedicated space reserved for classroom demonstrations, board-aligned pacing, and guided laboratory review."
      />

      <EmptyState
        title="Teacher tools are not yet configured"
        message="This foundation preserves an isolated route for teacher workflows without introducing fabricated rosters, student scores, or placeholder analytics."
        actionLabel="Review Physics 6–10 Placeholders"
        onAction={() => navigate("/curriculum")}
        icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
      />
    </div>
  );
}
