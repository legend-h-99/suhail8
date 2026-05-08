'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';
import { Plus } from 'lucide-react';

interface Report {
  id: string;
  period: string;
  type: string;
  status: string;
  body: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerComment?: string;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = { WEEKLY: 'أسبوعي', MONTHLY: 'شهري', TERM: 'فصلي' };
const STATUS_LABEL: Record<string, string> = { DRAFT: 'مسودة', SUBMITTED: 'مقدّم', REVIEWED: 'مراجَع' };

export default function MyReportsPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<Report[]>({
    queryKey: ['my-reports'],
    queryFn: () => api.get('/trainers/me/reports').then(r => r.data),
    enabled: !!user?.trainerId,
  });

  const submit = useMutation({
    mutationFn: (id: string) => api.post(`/trainers/me/reports/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-reports'] }),
  });

  if (!user?.trainerId) return <div className="card text-center py-12">للمدربين فقط.</div>;

  const cols: Column<Report>[] = [
    { header: 'الفترة', render: (r) => <span className="font-mono text-xs">{r.period}</span> },
    { header: 'النوع', render: (r) => TYPE_LABEL[r.type] ?? r.type },
    { header: 'الحالة', render: (r) => <span className={`badge ${
      r.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700' :
      r.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
    }`}>{STATUS_LABEL[r.status] ?? r.status}</span> },
    { header: 'تعليق المراجِع', render: (r) => r.reviewerComment ?? '—' },
    { header: '', render: (r) => r.status === 'DRAFT' ? (
      <button onClick={() => submit.mutate(r.id)}
        className="text-xs text-primary hover:underline">تقديم</button>
    ) : null },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تقاريري الدورية</h1>
          <p className="text-slate-500 mt-1">{data.length} تقرير</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1">
          <Plus size={16} /> تقرير جديد
        </button>
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد تقارير." />
      </div>

      {showForm && <NewReport onClose={() => setShowForm(false)} onSuccess={() => {
        qc.invalidateQueries({ queryKey: ['my-reports'] }); setShowForm(false);
      }} />}
    </div>
  );
}

function NewReport({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const today = new Date();
  const week = Math.ceil(((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000) / 7);
  const [type, setType] = useState<'WEEKLY' | 'MONTHLY' | 'TERM'>('WEEKLY');
  const [period, setPeriod] = useState(
    type === 'WEEKLY' ? `1446-W${week}` :
    type === 'MONTHLY' ? `1446-${today.getMonth() + 1}` : '1446-1'
  );
  const [body, setBody] = useState('');
  const [highlights, setHighlights] = useState('');
  const [challenges, setChallenges] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/trainers/me/reports', {
      type, period, body,
      highlights: highlights.split('\n').filter(Boolean).map((ar) => ({ ar })),
      challenges: challenges.split('\n').filter(Boolean).map((ar) => ({ ar })),
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-lg my-8">
        <h3 className="text-lg font-semibold mb-4">تقرير دوري جديد</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">النوع</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="WEEKLY">أسبوعي</option>
                <option value="MONTHLY">شهري</option>
                <option value="TERM">فصلي</option>
              </select>
            </div>
            <div>
              <label className="label">الفترة</label>
              <input className="input" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">ملخص الفترة</label>
            <textarea className="input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div>
            <label className="label">الإنجازات (سطر لكل واحد)</label>
            <textarea className="input" rows={3} placeholder="إنهاء الوحدة الأولى&#10;زيارة شركة Aramco" value={highlights}
              onChange={(e) => setHighlights(e.target.value)} />
          </div>

          <div>
            <label className="label">التحديات</label>
            <textarea className="input" rows={3} placeholder="نقص في أجهزة المعمل&#10;..." value={challenges}
              onChange={(e) => setChallenges(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!body || submit.isPending}>
            {submit.isPending ? 'جارٍ الحفظ...' : 'حفظ كمسوّدة'}
          </button>
        </div>
      </div>
    </div>
  );
}
