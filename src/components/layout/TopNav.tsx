import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "../../router/RouterContext";
import { PRIMARY_NAV_ITEMS } from "../../types/navigation";
import { Button } from "../ui/Button";

export function TopNav() {
  const { currentPath, navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick("/");
          }}
          className="font-display text-xl font-semibold tracking-tight text-[var(--accent-mocha)] whitespace-nowrap shrink-0"
        >
          PHYSIX AI
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 lg:gap-8"
        >
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.path);
                }}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150",
                  isActive
                    ? "text-[var(--text-primary)] border-[var(--accent-mocha)]"
                    : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-hairline)]",
                ].join(" ")}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + responsive mobile drawer trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleNavClick("/labs")}
            className="hidden sm:inline-flex"
          >
            Enter Lab
          </Button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center h-11 w-11 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)] cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive mobile drawer */}
      {mobileMenuOpen ? (
        <div className="md:hidden border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-4">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.path);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "min-h-[44px] flex items-center px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-[#F3EFF9] text-[var(--accent-lavender-ink)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-3 mt-2 border-t border-[var(--border-hairline)] sm:hidden">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleNavClick("/labs")}
                className="w-full"
              >
                Enter Lab
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
