'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface Project {
  id: string;
  title: string;
  abstract?: string;
  status: string;
  fundingAmount?: string;
  fundingSource?: string;
  startDate?: string;
}

const STATUS_LABEL: Record<string, string> = {
  PROPOSED: 'مُقترح',
  APPROVED: 'معتمد',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

export default function ResearchPage() {
  const { data = [], isLoading } = useQuery<Project[]>({
    queryKey: ['research'],
    queryFn: () => api.get('/research/projects').then(r => r.data),
  });

  const cols: Column<Project>[] = [
    { header: 'العنوان', render: (p) => <span className="font-medium">{p.title}</span> },
    { header: 'الحالة', render: (p) => <span className="badge bg-slate-100">{STATUS_LABEL[p.status] ?? p.status}</span> },
    { header: 'التمويل', render: (p) => p.fundingAmount ? `${Number(p.fundingAmount).toLocaleString('ar-SA')} ر.س` : '—' },
    { header: 'المصدر', render: (p) => p.fundingSource ?? '—' },
    { header: 'البداية', render: (p) => p.startDate ? new Date(p.startDate).toLocaleDateString('ar-SA') : '—' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">البحث والابتكار</h1>
        <p className="text-slate-500 mt-1">{data.length} مشروع</p>
      </header>
      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد مشاريع. قدّم بحثاً عبر POST /research/projects" />
      </div>
    </div>
  );
}
