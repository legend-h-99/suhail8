'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface Review {
  id: string;
  reviewYear: string;
  marketAlignmentScore?: string;
  recommendations: string;
  status: string;
  department?: { nameAr: string };
  feedbackEntries: any[];
}

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'قيد المراجعة', APPROVED: 'معتمدة', ARCHIVED: 'مؤرشفة',
};

export default function CurriculumPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('dept.curriculum_review.create');

  const { data = [], isLoading } = useQuery<Review[]>({
    queryKey: ['curriculum'],
    queryFn: () => api.get('/academic/curriculum-reviews').then(r => r.data),
  });

  const [showForm, setShowForm] = useState(false);

  const cols: Column<Review>[] = [
    { header: 'القسم', render: (r) => r.department?.nameAr ?? '—' },
    { header: 'السنة', render: (r) => r.reviewYear },
    { header: 'مواءمة السوق', render: (r) => r.marketAlignmentScore ? `${Number(r.marketAlignmentScore).toFixed(1)}/5` : '—' },
    { header: 'الملاحظات من المدربين', render: (r) => r.feedbackEntries.length },
    { header: 'الحالة', render: (r) => <span className="badge bg-slate-100">{STATUS_LABEL[r.status] ?? r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تقييم الحقائب التدريبية</h1>
          <p className="text-slate-500 mt-1">{data.length} مراجعة</p>
        </div>
        {canCreate && <button onClick={() => setShowForm(true)} className="btn-primary">+ مراجعة سنوية</button>}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد مراجعات." />
      </div>

      {showForm && <NewReview onClose={() => setShowForm(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['curriculum'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewReview({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: depts = [] } = useQuery<{ id: string; nameAr: string }[]>({
    queryKey: ['departments-flat'],
    queryFn: () => api.get('/org/departments').then(r => r.data),
  });

  const [departmentId, setDepartmentId] = useState('');
  const [reviewYear, setReviewYear] = useState('1447');
  const [marketAlignmentScore, setMarketAlignmentScore] = useState(3.5);
  const [recommendations, setRecommendations] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/academic/curriculum-reviews', {
      departmentId, reviewYear, marketAlignmentScore, recommendations,
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">مراجعة سنوية للحقائب</h3>

        <div className="space-y-3">
          <div>
            <label className="label">القسم</label>
            <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">— اختر —</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">السنة</label>
              <input className="input" value={reviewYear} onChange={(e) => setReviewYear(e.target.value)} />
            </div>
            <div>
              <label className="label">مواءمة السوق (0-5)</label>
              <input type="number" min={0} max={5} step={0.1} className="input"
                value={marketAlignmentScore}
                onChange={(e) => setMarketAlignmentScore(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="label">التوصيات</label>
            <textarea className="input" rows={4} value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!departmentId || !recommendations || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
