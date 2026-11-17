import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useRouter } from "../router/RouterContext";

export function NotFoundPage({ path }: { path: string }) {
  const { navigate } = useRouter();

  return (
    <Card tone="surface" padding="lg" className="max-w-xl mx-auto text-center space-y-4">
      <p className="font-mono text-xs text-[var(--accent-mocha)]">404</p>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Page not found
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">
        No workspace is registered at <span className="font-mono">{path}</span>.
      </p>
      <div className="pt-2">
        <Button variant="primary" onClick={() => navigate("/")}>
          Return to Overview
        </Button>
      </div>
    </Card>
  );
}
