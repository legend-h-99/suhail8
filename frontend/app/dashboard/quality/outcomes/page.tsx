'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface Outcome {
  id: string; departmentId: string; term: string;
  passRate?: string; employmentRate?: string;
  employerSatisfaction?: string; studentSatisfaction?: string;
  measuredAt: string;
}

export default function OutcomesPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<Outcome[]>({
    queryKey: ['training-outcomes'],
    queryFn: () => api.get('/quality/outcomes').then(r => r.data),
  });

  const { data: depts = [] } = useQuery<{ id: string; nameAr: string }[]>({
    queryKey: ['departments-flat'],
    queryFn: () => api.get('/org/departments').then(r => r.data),
  });

  const cols: Column<Outcome>[] = [
    { header: 'القسم', render: (o) => depts.find((d) => d.id === o.departmentId)?.nameAr ?? o.departmentId },
    { header: 'الفصل', render: (o) => o.term },
    { header: 'نسبة الاجتياز', render: (o) => o.passRate ? `${Number(o.passRate).toFixed(1)}%` : '—' },
    { header: 'نسبة التوظيف', render: (o) => o.employmentRate ? `${Number(o.employmentRate).toFixed(1)}%` : '—' },
    { header: 'رضا الموظفين', render: (o) => o.employerSatisfaction ? `${Number(o.employerSatisfaction).toFixed(1)}` : '—' },
    { header: 'رضا المتدربين', render: (o) => o.studentSatisfaction ? `${Number(o.studentSatisfaction).toFixed(1)}` : '—' },
    { header: 'تاريخ القياس', render: (o) => new Date(o.measuredAt).toLocaleDateString('ar-SA') },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">نواتج التدريب</h1>
          <p className="text-slate-500 mt-1">{data.length} قياس · لكل قسم/فصل</p>
        </div>
        {hasPermission('quality.training_outcomes.measure') && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ تسجيل قياس</button>
        )}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد قياسات بعد." />
      </div>

      {showForm && <NewOutcome depts={depts} onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['training-outcomes'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewOutcome({ depts, onClose, onSuccess }: any) {
  const [departmentId, setDepartmentId] = useState('');
  const [term, setTerm] = useState('1446-1');
  const [passRate, setPassRate] = useState<number | ''>('');
  const [employmentRate, setEmploymentRate] = useState<number | ''>('');
  const [employerSatisfaction, setEmployerSatisfaction] = useState<number | ''>('');
  const [studentSatisfaction, setStudentSatisfaction] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/quality/outcomes', {
      departmentId, term,
      passRate: passRate === '' ? undefined : passRate,
      employmentRate: employmentRate === '' ? undefined : employmentRate,
      employerSatisfaction: employerSatisfaction === '' ? undefined : employerSatisfaction,
      studentSatisfaction: studentSatisfaction === '' ? undefined : studentSatisfaction,
      notes,
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-md my-8">
        <h3 className="text-lg font-semibold mb-4">قياس نواتج تدريب</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">القسم</label>
              <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">— اختر —</option>
                {depts.map((d: any) => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="label">الفصل</label>
              <input className="input" value={term} onChange={(e) => setTerm(e.target.value)} />
            </div>
          </div>

          {[
            { key: 'passRate', label: 'نسبة الاجتياز %', val: passRate, set: setPassRate },
            { key: 'employmentRate', label: 'نسبة التوظيف %', val: employmentRate, set: setEmploymentRate },
            { key: 'employerSatisfaction', label: 'رضا الموظفين (0-100)', val: employerSatisfaction, set: setEmployerSatisfaction },
            { key: 'studentSatisfaction', label: 'رضا المتدربين (0-100)', val: studentSatisfaction, set: setStudentSatisfaction },
          ].map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input type="number" min={0} max={100} step="0.1" className="input"
                value={f.val} onChange={(e) => f.set(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          ))}

          <div>
            <label className="label">ملاحظات</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!departmentId || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
