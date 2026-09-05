import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Building2, Hammer, Users } from "lucide-react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/entityiq/store";

export const Route = createFileRoute("/next")({ component: Next });

const PATHS = [
  {
    to: "/diy" as const,
    icon: Hammer,
    title: "Do it yourself",
    lede: "You have internal capacity and want to learn.",
    points: ["Step-by-step action plan", "Recommended tools", "Templates & resources"],
    cta: "Show me how",
  },
  {
    to: "/help" as const,
    icon: Users,
    title: "Get help (other providers)",
    lede: "You need expert help — but not from us.",
    points: ["Vetted specialists", "Compare options", "Get quotes"],
    cta: "See recommended partners",
  },
  {
    to: "/joprotho" as const,
    icon: Building2,
    title: "Let Joprotho help",
    lede: "We can implement this for you, end to end.",
    points: ["Strategy", "Implementation", "Ongoing optimisation"],
    cta: "View solutions & pricing",
  },
  {
    to: "/learn" as const,
    icon: BookOpen,
    title: "Learn first",
    lede: "Build your skills before you execute.",
    points: ["Courses & bootcamps", "Certifications", "Recommended learning path"],
    cta: "Explore learning resources",
  },
];

function Next() {
  const { report } = useApp();
  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Your options</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">What should you do next?</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          We recommend the best path for {report?.entity.name ?? "your"} situation — not just what we sell.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PATHS.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="group rounded-xl bg-card p-5 elev transition-transform duration-150 ease-out hover:-translate-y-0.5"
            >
              <p.icon className="size-5 text-primary" />
              <h2 className="mt-3 font-display text-xl font-semibold">{p.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.lede}</p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {p.points.map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
              <span className="mt-5 inline-flex text-sm font-medium text-primary">{p.cta}</span>
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/unlock">Unlock the complete report</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/tracking">Continuous tracking</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
