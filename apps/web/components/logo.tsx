import { cn } from "../lib/utils";

type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

export function CapgentLogo({ className, markOnly }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        className="h-8 w-8 md:h-9 md:w-9"
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="capgent-orbit" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="40%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <radialGradient id="capgent-core" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="1" />
            <stop offset="45%" stopColor="#a5b4fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="18"
          fill="url(#capgent-core)"
          className="opacity-80"
        />
        <circle
          cx="32"
          cy="32"
          r="13"
          fill="none"
          stroke="url(#capgent-orbit)"
          strokeWidth="2.4"
        />
        <path
          d="M15 28c4.6-6.8 9.8-10.2 17-10.2 7.2 0 14 3.6 17 10.2"
          fill="none"
          stroke="url(#capgent-orbit)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 38c3.2 5 8.3 8 14 8 5.7 0 11.1-3.1 14-8"
          fill="none"
          stroke="url(#capgent-orbit)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="26" cy="26" r="2.1" fill="#0f172a" />
        <circle cx="38" cy="30" r="2.1" fill="#0f172a" />
        <circle cx="32" cy="36" r="1.8" fill="#0f172a" />
      </svg>
      {!markOnly && (
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight text-zinc-50 md:text-lg">
            Capgent
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-400">
            Agent Verification
          </span>
        </div>
      )}
    </div>
  );
}

