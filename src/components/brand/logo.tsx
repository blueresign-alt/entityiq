import { cn } from "@/lib/utils";

export function Logo({ className, markClass }: { className?: string; markClass?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className={cn("size-7", markClass)} aria-hidden>
        <path
          d="M16 2.5 28.5 9.5v13L16 29.5 3.5 22.5v-13L16 2.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M11.2 20.2V11.8h3.4c2.2 0 3.5 1.1 3.5 2.8 0 1.2-.7 2.1-1.9 2.5l2.4 3.1h-2.3l-2.1-2.8h-1.3v2.8H11.2Zm2.7-4.5h.9c1 0 1.6-.5 1.6-1.2s-.6-1.2-1.6-1.2h-.9v2.4Z"
          fill="currentColor"
        />
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-[0.18em]">
        ENTITY<span className="text-primary">IQ</span>
      </span>
    </span>
  );
}
