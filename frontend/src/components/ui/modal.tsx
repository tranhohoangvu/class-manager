'use client';

import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-4xl',
};

export function Modal({
  open,
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const isVisible = open ?? isOpen ?? false;
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isVisible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isVisible, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full bg-surface rounded-sm',
          'border border-border-strong shadow-[4px_4px_0px_0px_rgba(13,1,41,0.25)] max-h-[90dvh] flex flex-col',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4.5 border-b border-border-strong flex-shrink-0 bg-surface-muted/30">
          <div>
            <h2 id="modal-title" className="text-[15px] font-bold text-text-primary">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-muted border border-transparent hover:border-border transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4.5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4.5 py-3.5 border-t border-border-strong bg-surface-muted/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// Confirm Dialog
// =============================================
interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
  variant?: 'primary' | 'danger';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel,
  confirmText,
  confirmVariant,
  variant,
  loading = false,
}: ConfirmDialogProps) {
  const isVisible = open ?? isOpen ?? false;
  const dialogMessage = description ?? message ?? '';
  const finalConfirmLabel = confirmText ?? confirmLabel ?? 'Xác nhận';
  const finalVariant = (variant ?? confirmVariant ?? 'primary') as 'primary' | 'danger';

  return (
    <Modal
      open={isVisible}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant={finalVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {finalConfirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{dialogMessage}</p>
    </Modal>
  );
}
