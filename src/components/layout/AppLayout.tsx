import type { ReactNode } from "react";
import { useRouter } from "../../router/RouterContext";
import { PRIMARY_NAV_ITEMS } from "../../types/navigation";
import { TopNav } from "./TopNav";

export function AppLayout({ children }: { children: ReactNode }) {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[var(--accent-mocha)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      <TopNav />

      <main
        id="main-content"
        className="flex-1 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
      >
        {children}
      </main>

      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 sm:px-6 lg:px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="font-display text-sm font-semibold text-[var(--accent-mocha)]">
              PHYSIX AI
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Classes 6–10 · NCERT/CBSE &amp; Karnataka State Board · Physics, Chemistry, Biology &amp; Mathematics
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)]"
          >
            {PRIMARY_NAV_ITEMS.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className="hover:text-[var(--text-primary)] whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
