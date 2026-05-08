'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface CCourse {
  id: string;
  code: string;
  title: string;
  fee: string;
  capacity: number;
  startDate: string;
  endDate: string;
  hours: number;
  status: string;
  _count: { registrations: number };
}

export default function CommunityPage() {
  const { data = [], isLoading } = useQuery<CCourse[]>({
    queryKey: ['cc-courses'],
    queryFn: () => api.get('/community/courses').then(r => r.data),
  });

  const cols: Column<CCourse>[] = [
    { header: 'الرمز', render: (c) => <span className="font-mono text-xs">{c.code}</span> },
    { header: 'العنوان', render: (c) => <span className="font-medium">{c.title}</span> },
    { header: 'الرسوم', render: (c) => `${Number(c.fee).toLocaleString('ar-SA')} ر.س` },
    { header: 'السعة', render: (c) => `${c._count.registrations} / ${c.capacity}` },
    { header: 'الفترة', render: (c) => `${new Date(c.startDate).toLocaleDateString('ar-SA')} ← ${new Date(c.endDate).toLocaleDateString('ar-SA')}` },
    { header: 'الساعات', render: (c) => c.hours },
    { header: 'الحالة', render: (c) => <span className="badge bg-slate-100">{c.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">مركز خدمة المجتمع</h1>
        <p className="text-slate-500 mt-1">{data.length} دورة</p>
      </header>
      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد دورات. أضف عبر POST /community/courses" />
      </div>
    </div>
  );
}
