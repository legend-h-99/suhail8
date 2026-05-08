'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  titleAr: string;
  bodyAr?: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  });

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.post('/notifications/mark-read', { ids: [id] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الإشعارات</h1>
          <p className="text-slate-500 mt-1">{data.length} إشعار • {unread} غير مقروء</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAll.mutate()} className="btn-secondary">
            تحديد الكل كمقروء
          </button>
        )}
      </header>

      <div className="card">
        {isLoading ? (
          <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
        ) : data.length === 0 ? (
          <div className="text-slate-500 text-center py-12">لا توجد إشعارات.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.map((n) => (
              <li key={n.id} className={`py-3 px-2 flex items-start gap-3 ${!n.readAt ? 'bg-primary-50/40' : ''}`}>
                <span className={`mt-1.5 h-2 w-2 rounded-full ${!n.readAt ? 'bg-primary' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{n.titleAr}</div>
                  {n.bodyAr && <div className="text-sm text-slate-600 mt-0.5">{n.bodyAr}</div>}
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('ar-SA')} · {n.type}
                  </div>
                </div>
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={() => !n.readAt && markOne.mutate(n.id)}
                    className="text-sm text-primary hover:underline whitespace-nowrap"
                  >
                    فتح
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
