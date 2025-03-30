import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  hover?: boolean;
  noBorder?: boolean;
}

export function GlassCard({ 
  children, 
  className,
  variant = 'secondary',
  hover = true,
  noBorder = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glassmorphism p-6 rounded-2xl transition-all duration-300 overflow-hidden',
        !noBorder && 'glassmorphism-border',
        variant === 'primary' && 'glassmorphism-primary',
        variant === 'secondary' && 'glassmorphism-secondary',
        variant === 'tertiary' && 'glassmorphism-tertiary',
        variant === 'accent' && 'glassmorphism-accent',
        hover && 'hover:translate-y-[-5px] hover:shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassPanel({ 
  children, 
  className,
  variant = 'default',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'sunken';
}) {
  return (
    <div
      className={cn(
        'glass-panel p-4 rounded-xl',
        'glass-panel-border',
        variant === 'elevated' && 'glass-panel-elevated',
        variant === 'sunken' && 'glass-panel-sunken',
        className
      )}
    >
      {children}
    </div>
  );
}

export function FloatingElement({
  children,
  className,
  elevation = 'medium',
}: {
  children: ReactNode;
  className?: string;
  elevation?: 'low' | 'medium' | 'high' | 'ultra';
}) {
  return (
    <div
      className={cn(
        'floating-element p-4 rounded-xl',
        elevation === 'low' && 'floating-element-low',
        elevation === 'medium' && 'floating-element-medium',
        elevation === 'high' && 'floating-element-high',
        elevation === 'ultra' && 'floating-element-ultra',
        className
      )}
    >
      {children}
    </div>
  );
}