'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface TrainingPlan {
  id: string;
  fiscalYear: string;
  scope: string;
  status: string;
  goals: any[];
  activities: any[];
  department?: { nameAr: string };
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'مسودة', SUBMITTED: 'مقدّمة', APPROVED: 'معتمدة', REJECTED: 'مرفوضة', ARCHIVED: 'مؤرشفة',
};
const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

export default function TrainingPlansPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('dept.training_plan.create');
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<TrainingPlan[]>({
    queryKey: ['training-plans'],
    queryFn: () => api.get('/academic/training-plans').then(r => r.data),
  });

  const cols: Column<TrainingPlan>[] = [
    { header: 'القسم', render: (p) => <span className="font-medium">{p.department?.nameAr ?? '—'}</span> },
    { header: 'السنة', render: (p) => p.fiscalYear },
    { header: 'النطاق', render: (p) => p.scope === 'YEARLY' ? 'سنوية' : 'فصلية' },
    { header: 'الأهداف', render: (p) => p.goals?.length ?? 0 },
    { header: 'النشاطات', render: (p) => p.activities?.length ?? 0 },
    { header: 'الحالة', render: (p) => (
      <span className={`badge ${STATUS_BADGE[p.status] ?? 'bg-slate-100'}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الخطط التشغيلية للأقسام التدريبية</h1>
          <p className="text-slate-500 mt-1">{data.length} خطة</p>
        </div>
        {canCreate && <button onClick={() => setShowForm(true)} className="btn-primary">+ خطة جديدة</button>}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد خطط بعد." />
      </div>

      {showForm && <NewPlan onClose={() => setShowForm(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['training-plans'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewPlan({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: depts = [] } = useQuery<{ id: string; nameAr: string }[]>({
    queryKey: ['departments-flat'],
    queryFn: () => api.get('/org/departments').then(r => r.data),
  });

  const [departmentId, setDepartmentId] = useState('');
  const [fiscalYear, setFiscalYear] = useState('1447');
  const [scope, setScope] = useState<'SEASONAL' | 'YEARLY'>('YEARLY');
  const [goals, setGoals] = useState([{ ar: '' }]);
  const [activities, setActivities] = useState([{ ar: '', startDate: '', endDate: '' }]);

  const submit = useMutation({
    mutationFn: () => api.post('/academic/training-plans', {
      departmentId, fiscalYear, scope,
      goals: goals.filter(g => g.ar),
      activities: activities.filter(a => a.ar),
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-2xl my-8">
        <h3 className="text-lg font-semibold mb-4">خطة تشغيلية جديدة</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">القسم</label>
              <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">— اختر —</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="label">السنة المالية</label>
              <input className="input" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} />
            </div>
            <div>
              <label className="label">النطاق</label>
              <select className="input" value={scope} onChange={(e) => setScope(e.target.value as any)}>
                <option value="YEARLY">سنوية</option>
                <option value="SEASONAL">فصلية</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">الأهداف</label>
            {goals.map((g, i) => (
              <input
                key={i}
                className="input mb-2"
                placeholder={`هدف ${i + 1}`}
                value={g.ar}
                onChange={(e) => { const a = [...goals]; a[i].ar = e.target.value; setGoals(a); }}
              />
            ))}
            <button type="button" onClick={() => setGoals([...goals, { ar: '' }])} className="text-sm text-primary hover:underline">+ هدف</button>
          </div>

          <div>
            <label className="label">النشاطات</label>
            {activities.map((a, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                <input className="input col-span-6" placeholder="نشاط" value={a.ar}
                  onChange={(e) => { const arr = [...activities]; arr[i].ar = e.target.value; setActivities(arr); }} />
                <input type="date" className="input col-span-3" value={a.startDate}
                  onChange={(e) => { const arr = [...activities]; arr[i].startDate = e.target.value; setActivities(arr); }} />
                <input type="date" className="input col-span-3" value={a.endDate}
                  onChange={(e) => { const arr = [...activities]; arr[i].endDate = e.target.value; setActivities(arr); }} />
              </div>
            ))}
            <button type="button" onClick={() => setActivities([...activities, { ar: '', startDate: '', endDate: '' }])} className="text-sm text-primary hover:underline">+ نشاط</button>
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!departmentId || !fiscalYear || submit.isPending}>
            {submit.isPending ? 'جارٍ الحفظ...' : 'حفظ كمسوّدة'}
          </button>
        </div>
      </div>
    </div>
  );
}
