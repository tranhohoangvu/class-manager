'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent text-accent-text hover:bg-accent-hover',
    'border border-transparent shadow-2xs',
    'font-medium active:scale-[0.98]',
  ].join(' '),
  secondary: [
    'bg-surface text-text-primary hover:bg-surface-muted',
    'border border-border hover:border-border-strong shadow-2xs',
    'font-medium active:scale-[0.98]',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-muted',
    'border border-transparent',
    'font-medium active:scale-[0.98]',
  ].join(' '),
  outline: [
    'bg-transparent text-accent hover:bg-accent-subtle',
    'border border-accent/40 hover:border-accent',
    'font-medium active:scale-[0.98]',
  ].join(' '),
  danger: [
    'bg-danger text-white hover:opacity-90',
    'border border-transparent shadow-2xs',
    'font-medium active:scale-[0.98]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-9 px-4 text-xs rounded-lg',
  lg: 'h-10 px-5 text-sm rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      isLoading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isSpinner = loading || isLoading;
    return (
      <button
        ref={ref}
        disabled={disabled || isSpinner}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap',
          'select-none cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isSpinner ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
