import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface RouterContextValue {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function normalizePath(rawPath: string): string {
  if (!rawPath || rawPath === "/") {
    return "/";
  }
  const trimmed = rawPath.replace(/\/+$/, "");
  return trimmed || "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    normalizePath(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((targetPath: string) => {
    const normalized = normalizePath(targetPath);
    if (normalized === normalizePath(window.location.pathname)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.history.pushState({}, "", normalized);
    setCurrentPath(normalized);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}
