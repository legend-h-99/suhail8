'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
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
  workflowInstance?: { currentStep?: string; steps?: any[] };
}

export default function MyLeavesPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [showForm, setShowForm] = useState(false);

  const { data: leaves = [], isLoading } = useQuery<Leave[]>({
    queryKey: ['my-leaves'],
    queryFn: () => api.get('/hr/leaves?mineOnly=true').then(r => r.data),
  });

  const cols: Column<Leave>[] = [
    { header: 'النوع', render: (l) => LEAVE_TYPES.find(t => t.v === l.type)?.label ?? l.type },
    { header: 'الفترة', render: (l) => `${new Date(l.startDate).toLocaleDateString('ar-SA')} ← ${new Date(l.endDate).toLocaleDateString('ar-SA')}` },
    { header: 'الأيام', render: (l) => l.days },
    { header: 'السبب', render: (l) => l.reason ?? '—' },
    { header: 'الحالة', render: (l) => (
      <span className={`badge ${STATUS_BADGE[l.status] ?? 'bg-slate-100'}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
    )},
    { header: 'الخطوة الحالية', render: (l) => l.workflowInstance?.currentStep ?? '—' },
  ];

  if (!user?.employeeId) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-600 mb-2">حسابك غير مرتبط بسجل موظف.</p>
        <p className="text-sm text-slate-500">للسماح بتقديم طلبات إجازة، يجب أن يربط مدير النظام حسابك بسجل موظف.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إجازاتي</h1>
          <p className="text-slate-500 mt-1">{leaves.length} طلب باسمك</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ طلب إجازة جديد</button>
      </header>

      <div className="card">
        <DataTable data={leaves} columns={cols} loading={isLoading} empty="لا توجد طلبات إجازة بعد." />
      </div>

      {showForm && (
        <NewMyLeaveModal
          employeeId={user.employeeId}
          onClose={() => setShowForm(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['my-leaves'] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function NewMyLeaveModal({ employeeId, onClose, onSuccess }: {
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
        <h3 className="text-lg font-semibold mb-1">طلب إجازة لي</h3>
        <p className="text-xs text-slate-500 mb-4">سيُسلسل الطلب حسب سير اعتماد قسمك.</p>

        <div className="space-y-3">
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
            disabled={!startDate || !endDate || submit.isPending}
          >
            {submit.isPending ? 'جارٍ الإرسال...' : 'تقديم الطلب'}
          </button>
        </div>
      </div>
    </div>
  );
}
