'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';
import { Building, Calendar, Star } from 'lucide-react';

interface Coop {
  id: string;
  companyName: string;
  supervisor?: string;
  startDate: string;
  endDate: string;
  status: string;
  evaluation?: string;
  trainee: { studentNumber: string; fullNameAr: string };
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'نشط', COMPLETED: 'مكتمل', CANCELLED: 'ملغى', FAILED: 'راسب',
};

export default function CoopPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [evalValue, setEvalValue] = useState(80);

  const { data = [], isLoading } = useQuery<Coop[]>({
    queryKey: ['my-coop'],
    queryFn: () => api.get('/trainers/me/coop').then(r => r.data),
    enabled: !!user?.trainerId,
  });

  const evaluate = useMutation({
    mutationFn: ({ id, evaluation }: { id: string; evaluation: number }) =>
      api.post(`/trainers/me/coop/${id}/evaluate`, { evaluation }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-coop'] });
      setEvaluating(null);
    },
  });

  if (!user?.trainerId) return <div className="card text-center py-12">للمدربين فقط.</div>;

  const cols: Column<Coop>[] = [
    { header: 'المتدرب', render: (c) => (
      <div>
        <div className="font-medium">{c.trainee.fullNameAr}</div>
        <div className="text-xs text-slate-500 font-mono">{c.trainee.studentNumber}</div>
      </div>
    )},
    { header: 'الشركة', render: (c) => (
      <div className="flex items-center gap-1.5">
        <Building size={13} className="text-slate-400" />
        <span>{c.companyName}</span>
      </div>
    )},
    { header: 'المشرف', render: (c) => c.supervisor ?? '—' },
    { header: 'الفترة', render: (c) => (
      <div className="text-xs">
        {new Date(c.startDate).toLocaleDateString('ar-SA')} ←<br/>
        {new Date(c.endDate).toLocaleDateString('ar-SA')}
      </div>
    )},
    { header: 'الحالة', render: (c) => <span className="badge bg-slate-100">{STATUS_LABEL[c.status] ?? c.status}</span> },
    { header: 'تقييمي', render: (c) => c.evaluation
      ? <span className="font-mono font-bold">{c.evaluation}</span>
      : <button onClick={() => { setEvaluating(c.id); setEvalValue(80); }}
          className="text-xs text-primary hover:underline">تقييم →</button>
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">التدريب التعاوني — متدربيي</h1>
        <p className="text-slate-500 mt-1">{data.length} تدريب نشط/سابق</p>
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا متدربين في تدريب تعاوني حالياً." />
      </div>

      {evaluating && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
          <div className="card w-full max-w-md">
            <h3 className="text-lg font-semibold mb-1">تقييم التدريب التعاوني</h3>
            <p className="text-sm text-slate-500 mb-4">
              {data.find(c => c.id === evaluating)?.trainee.fullNameAr}
            </p>
            <label className="label flex items-center justify-between">
              <span>التقييم (٠ - ١٠٠)</span>
              <span className="font-mono text-2xl font-bold">{evalValue}</span>
            </label>
            <input type="range" min={0} max={100} value={evalValue}
              onChange={(e) => setEvalValue(Number(e.target.value))}
              className="w-full" />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setEvaluating(null)} className="btn-secondary">إلغاء</button>
              <button onClick={() => evaluate.mutate({ id: evaluating, evaluation: evalValue })}
                className="btn-primary">حفظ التقييم</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
