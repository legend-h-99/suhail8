'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface QIP {
  id: string;
  fiscalYear: string;
  scope: string;
  rootCause: string;
  status: string;
  targetKpiCode?: string;
  targetValue?: string;
  startDate?: string;
  dueDate?: string;
  actions: any[];
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'مسودة', IN_PROGRESS: 'قيد التنفيذ', COMPLETED: 'مكتملة', CANCELLED: 'ملغاة',
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
};

export default function ImprovementPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('quality.improvement_plan.execute');
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<QIP[]>({
    queryKey: ['qip'],
    queryFn: () => api.get('/quality/improvement-plans').then(r => r.data),
  });

  const startMut = useMutation({
    mutationFn: (id: string) => api.post(`/quality/improvement-plans/${id}/start`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qip'] }),
  });
  const completeMut = useMutation({
    mutationFn: (id: string) => api.post(`/quality/improvement-plans/${id}/complete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qip'] }),
  });

  const cols: Column<QIP>[] = [
    { header: 'السنة', render: (q) => q.fiscalYear },
    { header: 'النطاق', render: (q) => q.scope },
    { header: 'السبب الجذري', render: (q) => <span className="text-xs line-clamp-1">{q.rootCause}</span> },
    { header: 'KPI المستهدف', render: (q) => q.targetKpiCode ?? '—' },
    { header: 'الإجراءات', render: (q) => q.actions?.length ?? 0 },
    { header: 'الحالة', render: (q) => <span className={`badge ${STATUS_BADGE[q.status] ?? 'bg-slate-100'}`}>{STATUS_LABEL[q.status] ?? q.status}</span> },
    { header: '', render: (q) => (
      <div className="flex gap-1">
        {q.status === 'DRAFT' && canCreate && (
          <button onClick={() => startMut.mutate(q.id)} className="text-xs text-primary hover:underline">بدء</button>
        )}
        {q.status === 'IN_PROGRESS' && canCreate && (
          <button onClick={() => completeMut.mutate(q.id)} className="text-xs text-emerald-600 hover:underline">إنهاء</button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">خطط تحسين الجودة</h1>
          <p className="text-slate-500 mt-1">{data.length} خطة</p>
        </div>
        {canCreate && <button onClick={() => setShowForm(true)} className="btn-primary">+ خطة تحسين</button>}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد خطط بعد." />
      </div>

      {showForm && <NewQIP onClose={() => setShowForm(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['qip'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewQIP({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: kpis = [] } = useQuery<{ code: string; nameAr: string }[]>({
    queryKey: ['kpis'],
    queryFn: () => api.get('/quality/kpis').then(r => r.data),
  });

  const [fiscalYear, setFiscalYear] = useState('1447');
  const [scope, setScope] = useState('OPERATIONAL');
  const [rootCause, setRootCause] = useState('');
  const [targetKpiCode, setTargetKpiCode] = useState('');
  const [targetValue, setTargetValue] = useState<number | ''>('');
  const [actions, setActions] = useState([{ ar: '' }]);
  const [dueDate, setDueDate] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/quality/improvement-plans', {
      fiscalYear, scope, rootCause,
      targetKpiCode: targetKpiCode || undefined,
      targetValue: targetValue === '' ? undefined : targetValue,
      actions: actions.filter(a => a.ar),
      dueDate: dueDate || undefined,
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-lg my-8">
        <h3 className="text-lg font-semibold mb-4">خطة تحسين جودة جديدة</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">السنة</label>
              <input className="input" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} />
            </div>
            <div>
              <label className="label">النطاق</label>
              <select className="input" value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="OPERATIONAL">تشغيلي</option>
                <option value="STRATEGIC">استراتيجي</option>
                <option value="KPI_GAP">سد فجوة مؤشر</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">السبب الجذري / المشكلة</label>
            <textarea className="input" rows={2} value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">KPI المستهدف (اختياري)</label>
              <select className="input" value={targetKpiCode} onChange={(e) => setTargetKpiCode(e.target.value)}>
                <option value="">— لا شيء —</option>
                {kpis.map((k) => <option key={k.code} value={k.code}>{k.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="label">القيمة المستهدفة</label>
              <input type="number" className="input" value={targetValue}
                onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="label">الإجراءات</label>
            {actions.map((a, i) => (
              <input key={i} className="input mb-2" placeholder={`إجراء ${i + 1}`} value={a.ar}
                onChange={(e) => { const arr = [...actions]; arr[i].ar = e.target.value; setActions(arr); }} />
            ))}
            <button type="button" onClick={() => setActions([...actions, { ar: '' }])} className="text-sm text-primary hover:underline">+ إجراء</button>
          </div>

          <div>
            <label className="label">الموعد النهائي (اختياري)</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!rootCause || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
