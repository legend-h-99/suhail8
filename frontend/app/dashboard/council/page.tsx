'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface Council {
  id: string;
  nameAr: string;
  type: string;
  termFrom: string;
  termUntil?: string;
  members: any[];
  _count: { meetings: number };
}

interface Meeting {
  id: string;
  titleAr: string;
  scheduledAt: string;
  status: string;
  attendees: any[];
  _count: { decisions: number };
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'مجدول',
  IN_PROGRESS: 'قيد الانعقاد',
  COMPLETED: 'منتهٍ',
  CANCELLED: 'ملغى',
};

export default function CouncilPage() {
  const { data: councils = [] } = useQuery<Council[]>({
    queryKey: ['councils'],
    queryFn: () => api.get('/councils').then(r => r.data),
  });

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.get('/meetings').then(r => r.data),
  });

  const cols: Column<Meeting>[] = [
    { header: 'العنوان', render: (m) => <span className="font-medium">{m.titleAr}</span> },
    { header: 'الموعد', render: (m) => new Date(m.scheduledAt).toLocaleString('ar-SA') },
    { header: 'الحالة', render: (m) => <span className="badge bg-slate-100 text-slate-700">{STATUS_LABEL[m.status] ?? m.status}</span> },
    { header: 'المدعوون', render: (m) => m.attendees?.length ?? 0 },
    { header: 'القرارات', render: (m) => m._count?.decisions ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">المجلس والاجتماعات</h1>
        <p className="text-slate-500 mt-1">{councils.length} مجلس • {meetings.length} اجتماع</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {councils.length === 0 ? (
          <div className="card col-span-full text-center text-slate-500">
            لا توجد مجالس مُنشأة. أنشئ المجلس عبر API: <code className="text-xs bg-slate-100 px-1 rounded">POST /councils</code>
          </div>
        ) : councils.map((c) => (
          <div key={c.id} className="card">
            <div className="font-semibold">{c.nameAr}</div>
            <div className="text-sm text-slate-500 mt-1">{c.type}</div>
            <div className="mt-3 text-xs text-slate-600">
              {c.members.length} عضو • {c._count.meetings} اجتماع
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">الاجتماعات</h2>
        <DataTable data={meetings} columns={cols} loading={isLoading} empty="لا توجد اجتماعات. أنشئ اجتماعاً عبر API: POST /meetings" />
      </div>
    </div>
  );
}
