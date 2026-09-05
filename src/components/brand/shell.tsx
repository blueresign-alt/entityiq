import { Link } from "@tanstack/react-router";
import { Moon, Sun, SlidersHorizontal, Lock } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/entityiq/store";

export function Shell({ children }: { children: ReactNode }) {
  const { theme, setTheme, hydrate, report } = useApp();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-foreground">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1">
            {report && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/report">Snapshot</Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="icon" aria-label="Integrations">
              <Link to="/settings">
                <SlidersHorizontal />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
            <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
              <Link to="/analyze">Run audit</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5" />
            Your data is used to run this audit. It is not sold.
          </p>
          <p>EntityIQ · Instant value. Real intelligence. Actionable advice.</p>
        </div>
      </footer>
    </div>
  );
}
