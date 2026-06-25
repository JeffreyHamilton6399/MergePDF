import { cn } from "@/lib/utils";

/**
 * MergePDF logo — a flat emerald rounded square with two overlapping page
 * marks representing the "merge" action. No gradients, no glow.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-6", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path
        d="M12.5 7.5h6.2L22 10.8v7.7a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1Z"
        className="fill-white/95"
      />
      <path
        d="M18.7 7.6v2.7a.6.6 0 0 0 .6.6H22"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M13.5 13.5h6M13.5 15.5h6M13.5 17.5h4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M16 20.5v3.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6.2L20.8 13.5H18.6"
        className="stroke-white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M20.8 13.5v2.2a.6.6 0 0 0 .6.6h2.6"
        className="stroke-white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
