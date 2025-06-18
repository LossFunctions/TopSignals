// src/components/ui/neon-glass-card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const NeonGlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative rounded-2xl glass-wrapper transition-transform duration-200 group',
      className
    )}
    {...props}
  >
    <div className="glass-surface card-padding">
      {children}
    </div>
  </div>
));
NeonGlassCard.displayName = 'NeonGlassCard';

const NeonGlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-6', className)}
    {...props}
  />
));
NeonGlassCardHeader.displayName = 'NeonGlassCardHeader';

const NeonGlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight text-[#F5F5F7]', className)}
    {...props}
  />
));
NeonGlassCardTitle.displayName = 'NeonGlassCardTitle';

const NeonGlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[#A1A1AA]', className)}
    {...props}
  />
));
NeonGlassCardDescription.displayName = 'NeonGlassCardDescription';

const NeonGlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));
NeonGlassCardContent.displayName = 'NeonGlassCardContent';

const NeonGlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-6', className)}
    {...props}
  />
));
NeonGlassCardFooter.displayName = 'NeonGlassCardFooter';

export {
  NeonGlassCard,
  NeonGlassCardHeader,
  NeonGlassCardFooter,
  NeonGlassCardTitle,
  NeonGlassCardDescription,
  NeonGlassCardContent,
};

// Also export with same names as regular Card for easy drop-in replacement
export {
  NeonGlassCard as Card,
  NeonGlassCardHeader as CardHeader,
  NeonGlassCardFooter as CardFooter,
  NeonGlassCardTitle as CardTitle,
  NeonGlassCardDescription as CardDescription,
  NeonGlassCardContent as CardContent,
};