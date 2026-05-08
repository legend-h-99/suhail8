'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface Plan {
  id: string; fiscalYear: string; scope: string; season?: string;
  goals: any[]; activities: any[]; status: string;
  createdAt: string; approvedAt?: string;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'مسودة', SUBMITTED: 'مقدّمة', APPROVED: 'معتمدة', REJECTED: 'مرفوضة', ARCHIVED: 'مؤرشفة',
};

export default function QualityPlansPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['quality-plans'],
    queryFn: () => api.get('/quality/plans').then(r => r.data),
  });

  const submit = useMutation({
    mutationFn: (id: string) => api.post(`/quality/plans/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quality-plans'] }),
  });

  const cols: Column<Plan>[] = [
    { header: 'السنة', render: (p) => p.fiscalYear },
    { header: 'النوع', render: (p) => p.scope === 'YEARLY' ? 'سنوية' : `فصلية (${p.season ?? '-'})` },
    { header: 'الأهداف', render: (p) => (p.goals as any[])?.length ?? 0 },
    { header: 'الأنشطة', render: (p) => (p.activities as any[])?.length ?? 0 },
    { header: 'الحالة', render: (p) => <span className={`badge ${STATUS_BADGE[p.status] ?? 'bg-slate-100'}`}>{STATUS_LABEL[p.status] ?? p.status}</span> },
    { header: '', render: (p) => p.status === 'DRAFT' && hasPermission('quality.plan.create_yearly') ? (
      <button onClick={() => submit.mutate(p.id)} className="text-sm text-primary hover:underline">تقديم</button>
    ) : null },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">خطط الجودة</h1>
          <p className="text-slate-500 mt-1">{data.length} خطة</p>
        </div>
        {hasPermission('quality.plan.create_yearly') && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ خطة جديدة</button>
        )}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد خطط بعد." />
      </div>

      {showForm && <NewPlan onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['quality-plans'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewPlan({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [scope, setScope] = useState<'YEARLY' | 'SEASONAL'>('YEARLY');
  const [fiscalYear, setFiscalYear] = useState('1447');
  const [season, setSeason] = useState('Q1');
  const [goals, setGoals] = useState([{ ar: '', target: '' }]);
  const [activities, setActivities] = useState([{ ar: '' }]);

  const submit = useMutation({
    mutationFn: () => api.post('/quality/plans', {
      scope, fiscalYear, season: scope === 'SEASONAL' ? season : undefined,
      goals: goals.filter(g => g.ar),
      activities: activities.filter(a => a.ar),
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-2xl my-8">
        <h3 className="text-lg font-semibold mb-4">خطة جودة جديدة</h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label">النوع</label>
            <select className="input" value={scope} onChange={(e) => setScope(e.target.value as any)}>
              <option value="YEARLY">سنوية</option>
              <option value="SEASONAL">فصلية</option>
            </select>
          </div>
          <div>
            <label className="label">السنة</label>
            <input className="input" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} />
          </div>
          {scope === 'SEASONAL' && (
            <div>
              <label className="label">الفصل</label>
              <select className="input" value={season} onChange={(e) => setSeason(e.target.value)}>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="label">الأهداف الاستراتيجية</label>
          {goals.map((g, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <input className="input col-span-2" placeholder="الهدف" value={g.ar}
                onChange={(e) => { const a = [...goals]; a[i].ar = e.target.value; setGoals(a); }} />
              <input className="input" placeholder="الهدف الكمي" value={g.target}
                onChange={(e) => { const a = [...goals]; a[i].target = e.target.value; setGoals(a); }} />
            </div>
          ))}
          <button type="button" onClick={() => setGoals([...goals, { ar: '', target: '' }])} className="text-sm text-primary hover:underline">+ هدف</button>
        </div>

        <div className="mb-4">
          <label className="label">الأنشطة</label>
          {activities.map((a, i) => (
            <input key={i} className="input mb-2" placeholder={`نشاط ${i + 1}`} value={a.ar}
              onChange={(e) => { const arr = [...activities]; arr[i].ar = e.target.value; setActivities(arr); }} />
          ))}
          <button type="button" onClick={() => setActivities([...activities, { ar: '' }])} className="text-sm text-primary hover:underline">+ نشاط</button>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'حفظ كمسوّدة'}
          </button>
        </div>
      </div>
    </div>
  );
}
