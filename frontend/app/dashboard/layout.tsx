'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    if (!user) refreshUser().catch(() => router.push('/login'));
  }, [user, router, refreshUser]);

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-500">
        جارٍ التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-8 max-w-[1600px]">{children}</main>
    </div>
  );
}
