import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-navy-900/5 text-navy-900",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        danger: "bg-danger-bg text-danger",
        info: "bg-info-bg text-info",
        gold: "bg-gold-500/15 text-navy-900",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & { dotClassName?: string };

// A status dot alongside the label so status is never conveyed by colour
// alone (WCAG 2.2 AA — see /docs/qa-plan.md).
export function Badge({ className, tone, dotClassName, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full bg-current opacity-70", dotClassName)}
      />
      {children}
    </span>
  );
}
