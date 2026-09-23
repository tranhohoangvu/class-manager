'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AdminSidebar } from '@/components/shell/admin-sidebar';
import { MobileNav } from '@/components/shell/mobile-nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'ADMIN') {
        router.replace('/access-denied');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface-muted/20">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Đang xác thực quyền Quản trị...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <MobileNav
        isOpen={isMobileNavOpen}
        onToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isAdmin
      />
      <AdminSidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
