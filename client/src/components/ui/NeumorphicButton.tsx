import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NeumorphicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
  isOutlined?: boolean;
  isGlowing?: boolean;
  isFloating?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function NeumorphicButton({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  isActive = false,
  isOutlined = false,
  isGlowing = false,
  isFloating = false,
  icon,
  iconPosition = 'left',
  ...props
}: NeumorphicButtonProps) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed',
        
        // Size variants
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        
        // Active/Inactive state
        isActive 
          ? 'shadow-neu-pressed transform translate-y-0.5' 
          : 'shadow-neu-raised hover:translate-y-[-1px]',
        
        // Effects
        isGlowing && 'animate-glow',
        isFloating && 'animate-float',
        
        // Color variants
        variant === 'primary' && !isOutlined && 'bg-primary-color text-white hover:bg-primary-light',
        variant === 'accent' && !isOutlined && 'bg-purple-600 text-white hover:bg-purple-500',
        variant === 'success' && !isOutlined && 'bg-green-600 text-white hover:bg-green-500',
        variant === 'danger' && !isOutlined && 'bg-red-600 text-white hover:bg-red-500',
        variant === 'neutral' && !isOutlined && 'bg-neutral-800 text-white hover:bg-neutral-700',
        
        // Outlined variants
        isOutlined && 'bg-transparent border-2',
        isOutlined && variant === 'primary' && 'border-primary-color text-primary-color hover:bg-primary-color hover:bg-opacity-10',
        isOutlined && variant === 'accent' && 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:bg-opacity-10',
        isOutlined && variant === 'success' && 'border-green-600 text-green-600 hover:bg-green-600 hover:bg-opacity-10',
        isOutlined && variant === 'danger' && 'border-red-600 text-red-600 hover:bg-red-600 hover:bg-opacity-10',
        isOutlined && variant === 'neutral' && 'border-neutral-400 text-neutral-400 hover:bg-neutral-400 hover:bg-opacity-10',
        
        className
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
}

export function PillButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: Omit<NeumorphicButtonProps, 'isActive' | 'isOutlined' | 'isGlowing' | 'isFloating'>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200',
        'hover:shadow-md focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed',
        
        // Size variants
        size === 'sm' && 'px-3 py-1 text-xs',
        size === 'md' && 'px-4 py-1.5 text-sm',
        size === 'lg' && 'px-5 py-2 text-base',
        
        // Color variants
        variant === 'primary' && 'bg-primary-color text-white hover:bg-primary-light',
        variant === 'accent' && 'bg-purple-600 text-white hover:bg-purple-500',
        variant === 'success' && 'bg-green-600 text-white hover:bg-green-500',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-500',
        variant === 'neutral' && 'bg-neutral-800 text-white hover:bg-neutral-700',
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}