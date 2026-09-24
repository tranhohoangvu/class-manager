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
    'border border-border-strong shadow-[1px_1px_3px_0px_#000000]',
    'font-bold tracking-wide active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer',
  ].join(' '),
  secondary: [
    'bg-surface text-text-primary hover:bg-surface-muted',
    'border border-border-strong shadow-[1px_1px_0px_0px_rgba(13,1,41,0.2)] hover:border-border-strong',
    'font-semibold active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-muted',
    'border border-transparent',
    'font-medium active:translate-y-[0.5px] cursor-pointer',
  ].join(' '),
  outline: [
    'bg-transparent text-text-primary hover:bg-accent-subtle',
    'border border-border-strong hover:bg-surface-muted',
    'font-semibold active:translate-y-[0.5px] cursor-pointer',
  ].join(' '),
  danger: [
    'bg-danger text-white hover:opacity-95',
    'border border-border-strong shadow-[1px_1px_2px_0px_#000000]',
    'font-semibold active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs font-semibold rounded-sm gap-1.5',
  md: 'h-9 px-3.5 text-xs md:text-sm font-semibold rounded-sm gap-2',
  lg: 'h-10.5 px-4.5 text-sm font-bold rounded-sm gap-2.5',
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
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-none disabled:shadow-none',
          'transition-all duration-100',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong',
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
