import { cn } from "@/lib/utils";

/**
 * Skeleton component for loading states
 * Provides smooth loading animations for better UX
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

