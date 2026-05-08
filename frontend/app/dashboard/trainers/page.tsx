'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface Trainer {
  id: string;
  trainerNumber: string;
  specialization: string;
  loadHours: number;
  status: string;
  employee?: { fullNameAr: string; employeeNumber: string };
  loads: { term: string; hours: number }[];
}

export default function TrainersPage() {
  const { data = [], isLoading } = useQuery<Trainer[]>({
    queryKey: ['trainers'],
    queryFn: () => api.get('/trainers').then(r => r.data),
  });

  const cols: Column<Trainer>[] = [
    { header: 'الرقم', render: (t) => <span className="font-mono text-xs">{t.trainerNumber}</span> },
    { header: 'الاسم', render: (t) => <span className="font-medium">{t.employee?.fullNameAr ?? '—'}</span> },
    { header: 'التخصص', render: (t) => t.specialization },
    { header: 'النصاب الحالي', render: (t) => `${t.loadHours} ساعة` },
    { header: 'آخر فصل', render: (t) => t.loads[0] ? `${t.loads[0].term}: ${t.loads[0].hours}س` : '—' },
    { header: 'الحالة', render: (t) => <span className="badge bg-slate-100">{t.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">شؤون المدربين</h1>
        <p className="text-slate-500 mt-1">{data.length} مدرب</p>
      </header>
      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} />
      </div>
    </div>
  );
}
