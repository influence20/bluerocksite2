import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default',
    padding = 'md',
    hover = false,
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'bg-white rounded-xl transition-all duration-300';
    
    const variants = {
      default: 'shadow-soft border border-secondary-100',
      elevated: 'shadow-medium',
      outlined: 'border-2 border-secondary-200',
      glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-soft',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverClasses = hover ? 'hover:shadow-large hover:-translate-y-1 cursor-pointer' : '';

    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          hoverClasses,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        className={cn('flex items-center justify-between mb-6', className)}
        ref={ref}
        {...props}
      >
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-secondary-500 mt-1">{subtitle}</p>
          )}
          {children}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('', className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer Component
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, align = 'left', ...props }, ref) => {
    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        className={cn(
          'flex items-center mt-6 pt-6 border-t border-secondary-100',
          alignClasses[align],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
export default Card;