'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface MaintRequest {
  id: string;
  number: string;
  category: string;
  location: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function ServicesPage() {
  const { data: maint = [], isLoading } = useQuery<MaintRequest[]>({
    queryKey: ['maint'],
    queryFn: () => api.get('/services/maintenance').then(r => r.data),
  });

  const cols: Column<MaintRequest>[] = [
    { header: 'الرقم', render: (m) => <span className="font-mono text-xs">{m.number}</span> },
    { header: 'الفئة', render: (m) => m.category },
    { header: 'الموقع', render: (m) => m.location },
    { header: 'الوصف', render: (m) => m.description },
    { header: 'الأولوية', render: (m) => m.priority },
    { header: 'الحالة', render: (m) => <span className="badge bg-slate-100">{m.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">الخدمات العامة</h1>
        <p className="text-slate-500 mt-1">الصيانة، الأمن، العيادة</p>
      </header>

      <div className="card">
        <h2 className="font-semibold mb-3">طلبات الصيانة</h2>
        <DataTable data={maint} columns={cols} loading={isLoading} empty="لا توجد طلبات. أنشئ عبر POST /services/maintenance" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="card">
          <h2 className="font-semibold mb-2">حوادث الأمن</h2>
          <p className="text-sm text-slate-500">سجل عبر POST /services/security</p>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">العيادة الطبية</h2>
          <p className="text-sm text-slate-500">سجل عبر POST /services/medical</p>
        </div>
      </div>
    </div>
  );
}
