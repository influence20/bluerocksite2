import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    isLoading,
    disabled,
    ...props 
  }, ref) => {
    const inputClasses = cn(
      'block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200',
      error 
        ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
        : 'border-secondary-300',
      leftIcon && 'pl-12',
      rightIcon && 'pr-12',
      disabled && 'bg-secondary-50 cursor-not-allowed',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-secondary-400">{leftIcon}</span>
            </div>
          )}
          <input
            type={type}
            className={inputClasses}
            disabled={disabled || isLoading}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-secondary-400">{rightIcon}</span>
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg
                className="animate-spin h-5 w-5 text-secondary-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-error-600 mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-secondary-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;