import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant = 'secondary',
    size = 'md',
    dot = false,
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full';
    
    const variants = {
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      error: 'bg-error-100 text-error-800',
      info: 'bg-primary-100 text-primary-800',
      secondary: 'bg-secondary-100 text-secondary-800',
    };

    const sizes = {
      sm: dot ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
      md: dot ? 'px-2.5 py-1 text-sm' : 'px-3 py-1 text-sm',
      lg: dot ? 'px-3 py-1.5 text-base' : 'px-4 py-1.5 text-base',
    };

    const dotColors = {
      success: 'bg-success-400',
      warning: 'bg-warning-400',
      error: 'bg-error-400',
      info: 'bg-primary-400',
      secondary: 'bg-secondary-400',
    };

    return (
      <span
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {dot && (
          <span 
            className={cn(
              'w-2 h-2 rounded-full mr-2',
              dotColors[variant]
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;