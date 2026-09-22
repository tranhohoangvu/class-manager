'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ClassProvider, useCurrentClass } from '@/contexts/class-context';
import { Sidebar } from '@/components/shell/sidebar';
import { Chalkboard, SignOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { assignedClasses, isLoading } = useCurrentClass();
  const { user, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface-muted/20">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Đang tải dữ liệu lớp học...</p>
        </div>
      </div>
    );
  }

  // Edge case: Teacher without any assigned classes
  if (user?.role === 'TEACHER' && assignedClasses.length === 0) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="app-main flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center space-y-5 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Chalkboard size={32} weight="duotone" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-text-primary">
                Chưa được phân công lớp học
              </h2>
              <p className="text-xs text-text-muted leading-relaxed">
                Tài khoản của bạn ({user.email}) hiện tại chưa được Ban Giám hiệu phân công chủ nhiệm lớp nào.
              </p>
            </div>

            <div className="p-3 bg-surface-muted rounded-xl text-xs text-text-muted text-left">
              Vui lòng liên hệ Quản trị viên (Admin) để được gán lớp vào tài khoản. Sau khi được gán, các chức năng quản lý học sinh và sơ đồ lớp sẽ tự động xuất hiện.
            </div>

            <Button variant="secondary" onClick={logout} className="w-full justify-center">
              <SignOut size={16} />
              <span>Đăng xuất tài khoản</span>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface-muted/20">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Đang xác thực phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <ClassProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </ClassProvider>
  );
}
