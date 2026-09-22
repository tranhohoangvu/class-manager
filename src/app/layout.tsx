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
    default: 'Class Manager',
    template: '%s — Class Manager',
  },
  description: 'Ứng dụng quản lý lớp học cho giáo viên. Quản lý học sinh, chỗ ngồi, điểm danh và thông báo.',
  keywords: ['quản lý lớp học', 'điểm danh', 'học sinh', 'giáo viên'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
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
