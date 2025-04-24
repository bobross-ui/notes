import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({ 
  className, 
  size = 'medium' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4',
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-solid border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingState({ 
  text = 'Loading...', 
  className 
}: { 
  text?: string; 
  className?: string 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <LoadingSpinner />
      <p className="mt-4 text-sm text-muted-foreground">{text}</p>
    </div>
  );
} 