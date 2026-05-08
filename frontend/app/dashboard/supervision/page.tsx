'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface Visit {
  id: string;
  visitDate: string;
  rating: string;
  observations: string;
  recommendations?: string;
  status: string;
  trainer?: { trainerNumber: string; employee?: { fullNameAr: string } };
  department?: { nameAr: string };
}

const STATUS_LABEL: Record<string, string> = {
  LOGGED: 'مسجلة', FOLLOW_UP_NEEDED: 'تحتاج متابعة', CLOSED: 'مغلقة',
};

export default function SupervisionPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canLog = hasPermission('dept.supervision_visit.log');
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<Visit[]>({
    queryKey: ['supervision'],
    queryFn: () => api.get('/supervision-visits').then(r => r.data),
  });

  const cols: Column<Visit>[] = [
    { header: 'التاريخ', render: (v) => new Date(v.visitDate).toLocaleDateString('ar-SA') },
    { header: 'المدرب', render: (v) => v.trainer?.employee?.fullNameAr ?? v.trainer?.trainerNumber ?? '—' },
    { header: 'القسم', render: (v) => v.department?.nameAr ?? '—' },
    { header: 'التقييم', render: (v) => (
      <span className="font-mono">
        {Number(v.rating).toFixed(1)}/5.0
        <span className={'mr-2 ' + (Number(v.rating) >= 4 ? 'text-emerald-600' : Number(v.rating) >= 3 ? 'text-amber-600' : 'text-red-600')}>
          {Number(v.rating) >= 4 ? '⬤⬤⬤⬤⬤' : Number(v.rating) >= 3 ? '⬤⬤⬤◯◯' : '⬤◯◯◯◯'}
        </span>
      </span>
    )},
    { header: 'ملاحظات', render: (v) => <span className="text-xs text-slate-600 line-clamp-1">{v.observations}</span> },
    { header: 'الحالة', render: (v) => <span className="badge bg-slate-100">{STATUS_LABEL[v.status] ?? v.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الزيارات الإشرافية</h1>
          <p className="text-slate-500 mt-1">{data.length} زيارة</p>
        </div>
        {canLog && <button onClick={() => setShowForm(true)} className="btn-primary">+ تسجيل زيارة</button>}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد زيارات مسجلة." />
      </div>

      {showForm && <NewVisit onClose={() => setShowForm(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['supervision'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewVisit({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const user = useAuth((s) => s.user);
  const { data: trainers = [] } = useQuery<{ id: string; trainerNumber: string; employee?: { fullNameAr: string } }[]>({
    queryKey: ['trainers'],
    queryFn: () => api.get('/trainers').then(r => r.data),
  });

  const [trainerId, setTrainerId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(4);
  const [observations, setObservations] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUpAt, setFollowUpAt] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/supervision-visits', {
      trainerId, visitDate, rating, observations, recommendations: recommendations || undefined,
      followUpAt: followUpAt || undefined,
      visitorEmpId: user?.employeeId ?? '',
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">تسجيل زيارة إشرافية</h3>

        <div className="space-y-3">
          <div>
            <label className="label">المدرب</label>
            <select className="input" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
              <option value="">— اختر —</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.employee?.fullNameAr ?? t.trainerNumber} ({t.trainerNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">تاريخ الزيارة</label>
              <input type="date" className="input" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
            </div>
            <div>
              <label className="label">التقييم (0-5)</label>
              <input type="number" min={0} max={5} step={0.5} className="input" value={rating}
                onChange={(e) => setRating(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="label">الملاحظات</label>
            <textarea className="input" rows={3} value={observations}
              onChange={(e) => setObservations(e.target.value)} />
          </div>

          <div>
            <label className="label">التوصيات (اختياري)</label>
            <textarea className="input" rows={2} value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)} />
          </div>

          <div>
            <label className="label">موعد متابعة (اختياري)</label>
            <input type="date" className="input" value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!trainerId || !observations || submit.isPending}>
            {submit.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
