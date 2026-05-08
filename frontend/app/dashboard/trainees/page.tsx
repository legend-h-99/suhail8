'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface Trainee {
  id: string;
  studentNumber: string;
  fullNameAr: string;
  status: string;
  enrollmentDate: string;
  gpa?: string;
  program?: { nameAr: string; code: string };
  warnings: any[];
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'منتظم',
  WITHDRAWN: 'منسحب',
  SUSPENDED: 'موقوف',
  WARNED: 'منذر',
  GRADUATED: 'متخرج',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  WARNED: 'bg-amber-50 text-amber-700',
  WITHDRAWN: 'bg-slate-100 text-slate-600',
  SUSPENDED: 'bg-red-50 text-red-700',
  GRADUATED: 'bg-blue-50 text-blue-700',
};

export default function TraineesPage() {
  const [search, setSearch] = useState('');

  const { data: trainees = [], isLoading } = useQuery<Trainee[]>({
    queryKey: ['trainees', search],
    queryFn: () => api.get(`/trainees${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
  });

  const cols: Column<Trainee>[] = [
    { header: 'الرقم', render: (t) => <span className="font-mono text-xs text-slate-500">{t.studentNumber}</span> },
    { header: 'الاسم', render: (t) => <span className="font-medium">{t.fullNameAr}</span> },
    { header: 'البرنامج', render: (t) => t.program?.nameAr ?? '—' },
    { header: 'الحالة', render: (t) => (
      <span className={`badge ${STATUS_BADGE[t.status] ?? 'bg-slate-100'}`}>{STATUS_LABEL[t.status] ?? t.status}</span>
    )},
    { header: 'المعدل', render: (t) => t.gpa ?? '—' },
    { header: 'الإنذارات', render: (t) => t.warnings.length > 0
      ? <span className="badge bg-amber-50 text-amber-700">{t.warnings.length}</span>
      : '—'
    },
    { header: 'التسجيل', render: (t) => new Date(t.enrollmentDate).toLocaleDateString('ar-SA') },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">شؤون المتدربين</h1>
        <p className="text-slate-500 mt-1">{trainees.length} متدرب</p>
      </header>

      <div className="card">
        <input
          className="input mb-4 max-w-sm"
          placeholder="بحث بالاسم أو الرقم الجامعي..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <DataTable data={trainees} columns={cols} loading={isLoading} />
      </div>
    </div>
  );
}
