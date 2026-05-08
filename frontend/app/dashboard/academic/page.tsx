'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface Program { id: string; code: string; nameAr: string; level: string; durationTerms: number; totalCredits: number; }
interface Course { id: string; code: string; nameAr: string; credits: number; hours: number; program?: { nameAr: string } }

export default function AcademicPage() {
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: () => api.get('/academic/programs').then(r => r.data),
  });
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.get('/academic/courses').then(r => r.data),
  });

  const cols: Column<Course>[] = [
    { header: 'الرمز', render: (c) => <span className="font-mono text-xs">{c.code}</span> },
    { header: 'المقرر', render: (c) => <span className="font-medium">{c.nameAr}</span> },
    { header: 'البرنامج', render: (c) => c.program?.nameAr ?? '—' },
    { header: 'الساعات المعتمدة', render: (c) => c.credits },
    { header: 'الساعات الفعلية', render: (c) => c.hours },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">البرامج والمقررات</h1>
        <p className="text-slate-500 mt-1">{programs.length} برنامج • {courses.length} مقرر</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {programs.map((p) => (
          <div key={p.id} className="card">
            <div className="text-xs font-mono text-slate-400">{p.code}</div>
            <div className="font-semibold mt-1">{p.nameAr}</div>
            <div className="mt-2 text-xs text-slate-500">
              {p.level} • {p.durationTerms} فصول • {p.totalCredits} ساعة معتمدة
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">المقررات</h2>
        <DataTable data={courses} columns={cols} loading={isLoading} />
      </div>
    </div>
  );
}
