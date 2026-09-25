import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: {
    default: 'SchoolOps',
    template: '%s — SchoolOps',
  },
  description: 'School Operations Management System — Nền tảng điều hành và quản lý trường học toàn diện.',
  keywords: ['quản lý trường học', 'school operations', 'điểm danh', 'thời khóa biểu', 'học sinh', 'giáo viên'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-geist-sans)',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
            },
          }}
        />
      </body>
    </html>
  );
}
