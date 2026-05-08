'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

const LEAVE_TYPES = [
  { v: 'ANNUAL', label: 'اعتيادية' },
  { v: 'SICK', label: 'مرضية' },
  { v: 'EMERGENCY', label: 'اضطرارية' },
  { v: 'STUDY', label: 'دراسية' },
  { v: 'EXAM', label: 'أداء اختبار' },
  { v: 'POST_SECONDARY', label: 'ما بعد الثانوي' },
  { v: 'EXCEPTIONAL', label: 'استثنائية' },
  { v: 'MATERNITY', label: 'أمومة' },
  { v: 'UNPAID', label: 'بدون راتب' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمدة',
  REJECTED: 'مرفوضة',
  CANCELLED: 'ملغاة',
};

interface Leave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string;
  employee: { fullNameAr: string; employeeNumber: string };
  workflowInstance?: { currentStep?: string };
}

export default function LeavesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: leaves = [], isLoading } = useQuery<Leave[]>({
    queryKey: ['leaves'],
    queryFn: () => api.get('/hr/leaves').then(r => r.data),
  });

  const cols: Column<Leave>[] = [
    { header: 'الموظف', render: (l) => (
      <div>
        <div className="font-medium">{l.employee.fullNameAr}</div>
        <div className="text-xs text-slate-500 font-mono">{l.employee.employeeNumber}</div>
      </div>
    )},
    { header: 'النوع', render: (l) => LEAVE_TYPES.find(t => t.v === l.type)?.label ?? l.type },
    { header: 'الفترة', render: (l) => `${new Date(l.startDate).toLocaleDateString('ar-SA')} ← ${new Date(l.endDate).toLocaleDateString('ar-SA')}` },
    { header: 'الأيام', render: (l) => l.days },
    { header: 'الحالة', render: (l) => (
      <span className={`badge ${STATUS_BADGE[l.status] ?? 'bg-slate-100'}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
    )},
    { header: 'الخطوة الحالية', render: (l) => l.workflowInstance?.currentStep ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الإجازات</h1>
          <p className="text-slate-500 mt-1">{leaves.length} طلب</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ طلب إجازة جديد</button>
      </header>

      <div className="card">
        <DataTable data={leaves} columns={cols} loading={isLoading} />
      </div>

      {showForm && (
        <NewLeaveModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['leaves'] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function NewLeaveModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: employees = [] } = useQuery<{ id: string; fullNameAr: string; employeeNumber: string }[]>({
    queryKey: ['employees-directory'],
    queryFn: () => api.get('/hr/employees/directory').then(r => r.data),
  });

  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => api.post('/hr/leaves', { employeeId, type, startDate, endDate, reason }),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.messageAr ?? 'فشل الإرسال'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">طلب إجازة جديد</h3>

        <div className="space-y-3">
          <div>
            <label className="label">الموظف</label>
            <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">— اختر —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullNameAr} ({e.employeeNumber})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">نوع الإجازة</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {LEAVE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">من</label>
              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label">إلى</label>
              <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">السبب (اختياري)</label>
            <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          {error && <div className="rounded bg-red-50 text-red-700 p-2 text-sm">{error}</div>}
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button
            onClick={() => submit.mutate()}
            className="btn-primary"
            disabled={!employeeId || !startDate || !endDate || submit.isPending}
          >
            {submit.isPending ? 'جارٍ الإرسال...' : 'تقديم الطلب'}
          </button>
        </div>
      </div>
    </div>
  );
}
