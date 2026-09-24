'use client';

import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

// =============================================
// Input
// =============================================
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[14px] font-semibold text-text-primary tracking-tight"
          >
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-base',
            error && 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/25',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[12px] font-semibold text-danger">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[12px] text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// =============================================
// Select
// =============================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[13px] font-bold text-text-primary tracking-tight"
          >
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'input-base appearance-none cursor-pointer pr-10',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2714%27 height=%2714%27 viewBox=%270 0 14 14%27%3E%3Cpath fill=%27%230d0129%27 d=%27M7 9.5L2 4.5h10z%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_14px_center]',
            error && 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/25',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[13px] font-medium text-danger">{error}</p>}
        {hint && !error && <p className="text-[13px] text-text-muted">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// =============================================
// Textarea
// =============================================
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[14px] font-semibold text-text-primary tracking-tight"
          >
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'input-base resize-y min-h-[96px] py-3',
            error && 'border-danger',
            className
          )}
          {...props}
        />
        {error && <p className="text-[13px] font-medium text-danger">{error}</p>}
        {hint && !error && <p className="text-[13px] text-text-muted">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
