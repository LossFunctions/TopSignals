// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-10 w-full rounded-lg bg-white/10 animate-pulse", className)}
      {...props}
    />
  )
}

export { Skeleton }