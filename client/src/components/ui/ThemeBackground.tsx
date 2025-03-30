import React from 'react';
import { cn } from '@/lib/utils';

interface ThemeBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'gradient' | 'subtle' | 'dots' | 'none';
  animate?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export function ThemeBackground({
  className,
  children,
  variant = 'subtle',
  animate = true,
  intensity = 'medium',
}: ThemeBackgroundProps) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background effects container */}
      <div 
        className={cn(
          "absolute inset-0 w-full h-full transition-opacity duration-1000",
          variant === 'none' && 'hidden',
          className
        )}
      >
        {/* Gradient Background */}
        {variant === 'gradient' && (
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-transparent",
              "via-primary-color/5 to-primary-color/10",
              animate && "animate-gradient-slow",
              intensity === 'low' && 'opacity-20',
              intensity === 'medium' && 'opacity-30',
              intensity === 'high' && 'opacity-50'
            )}
          />
        )}
        
        {/* Subtle fog effect */}
        {variant === 'subtle' && (
          <div className="absolute inset-0">
            <div 
              className={cn(
                "absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--primary-color)_0%,_transparent_50%)]",
                intensity === 'low' && 'opacity-[0.03]',
                intensity === 'medium' && 'opacity-[0.05]',
                intensity === 'high' && 'opacity-[0.08]',
                animate && "animate-pulse-slow"
              )} 
            />
            <div 
              className={cn(
                "absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--primary-color)_0%,_transparent_50%)]",
                intensity === 'low' && 'opacity-[0.02]',
                intensity === 'medium' && 'opacity-[0.04]',
                intensity === 'high' && 'opacity-[0.07]',
                animate && "animate-pulse-slower"
              )} 
            />
          </div>
        )}
        
        {/* Dot pattern */}
        {variant === 'dots' && (
          <div 
            className={cn(
              "absolute inset-0",
              intensity === 'low' && 'opacity-[0.03]',
              intensity === 'medium' && 'opacity-[0.05]',
              intensity === 'high' && 'opacity-[0.08]',
            )} 
            style={{
              backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />
        )}
      </div>
      
      {/* Foreground content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export function AnimatedGradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r from-primary-color via-blue-500 to-primary-color",
        "animate-gradient-x bg-[length:200%_auto]",
        className
      )}
    >
      {children}
    </span>
  );
}

export function BackgroundGlow({
  x = "50%",
  y = "50%",
  size = 200,
  color = "var(--primary-color)",
  opacity = 0.15,
  blur = 100,
}) {
  return (
    <div
      className="absolute -z-10"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: "50%",
        opacity: opacity,
        filter: `blur(${blur}px)`,
      }}
    />
  );
}