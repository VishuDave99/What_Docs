import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function FadeIn({ 
  children, 
  className,
  duration = 0.5,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({ 
  children, 
  className,
  direction = 'up',
  duration = 0.5,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
}) {
  const directionMap = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ 
  children, 
  className,
  duration = 0.5,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredChildren({ 
  children, 
  className,
  staggerDelay = 0.1,
  childClassName,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  childClassName?: string;
}) {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * staggerDelay }}
          className={childClassName}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

export function Typewriter({ 
  text, 
  className,
  speed = 50,
  delay = 0,
}: {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout when component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    
    // Initial delay
    const timer = setTimeout(() => {
      if (text.length > 0) {
        setDisplayedText(text.charAt(0));
        setCurrentIndex(1);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [text, delay]);

  useEffect(() => {
    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText(prevText => prevText + text.charAt(currentIndex));
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, speed);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, text, speed]);

  return <span className={className}>{displayedText}</span>;
}

export function GlowEffect({
  children,
  className,
  glowColor = 'rgba(99, 102, 241, 0.4)',
  glowSize = '20px',
  glowOpacity = 0.8,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowSize?: string;
  glowOpacity?: number;
}) {
  return (
    <div 
      className={cn('relative inline-block', className)}
      style={{
        filter: `drop-shadow(0 0 ${glowSize} ${glowColor})`,
        opacity: glowOpacity,
      }}
    >
      {children}
    </div>
  );
}

export function AnimatedBackground({
  className,
  children,
  variant = 'gradient',
}: {
  className?: string;
  children?: React.ReactNode;
  variant?: 'gradient' | 'particles' | 'waves';
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {variant === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 via-bg-primary to-primary-dark/5 animate-gradient-slow" />
      )}
      
      {variant === 'particles' && (
        <div className="absolute inset-0 bg-particles-pattern opacity-10" />
      )}
      
      {variant === 'waves' && (
        <div className="absolute inset-0 bg-waves-pattern animate-wave opacity-5" />
      )}
      
      <div className="relative z-10">{children}</div>
    </div>
  );
}