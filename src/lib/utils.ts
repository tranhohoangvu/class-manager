import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string or Date object to Vietnamese format.
 * e.g. "22/09/2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, 'dd/MM/yyyy');
}

/**
 * Format a date to Vietnamese long format.
 * e.g. "Thứ Ba, 22/09/2026"
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, "EEEE, dd/MM/yyyy", { locale: vi });
}

export const formatDateVietnamese = formatDateLong;

/**
 * Format date for attendance grid header.
 * e.g. "22/09"
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, 'dd/MM');
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 */
export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate initials from a full name (1-2 characters).
 * e.g. "Nguyễn Văn An" → "NA"
 */
export function getInitials(fullName: string): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Convert desk number to a display label.
 * e.g. 7 → "Bàn 07"
 */
export function formatDeskLabel(deskNumber: number): string {
  return `Bàn ${String(deskNumber).padStart(2, '0')}`;
}

/**
 * Shuffle an array in place using Fisher-Yates.
 * Used by the seating randomizer service.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calculate attendance rate as a percentage string.
 * e.g. (43, 50) → "86%"
 */
export function calcAttendanceRate(present: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((present / total) * 100)}%`;
}
