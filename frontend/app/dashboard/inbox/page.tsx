'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface Instance {
  id: string;
  entityType: string;
  entityId: string;
  startedAt: string;
  data: any;
  definition: { nameAr: string; code: string };
  initiatedBy: { fullNameAr: string };
  steps: { stepNameAr: string; dueAt?: string }[];
}

export default function InboxPage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery<Instance[]>({
    queryKey: ['workflow', 'inbox'],
    queryFn: () => api.get('/workflow/inbox').then((r) => r.data),
  });

  const [acting, setActing] = useState<{ id: string; decision: 'APPROVE' | 'REJECT' } | null>(null);
  const [comment, setComment] = useState('');

  const actMutation = useMutation({
    mutationFn: (input: { id: string; decision: string; comment?: string }) =>
      api.post(`/workflow/instances/${input.id}/act`, { decision: input.decision, comment: input.comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow'] });
      setActing(null);
      setComment('');
    },
  });

  if (isLoading) return <div className="text-slate-500">جارٍ التحميل...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">صندوق اعتماداتي</h1>
        <p className="text-slate-500 mt-1">{items.length} طلب بانتظار قراركم</p>
      </header>

      {items.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          لا توجد طلبات معلقة 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="card flex flex-wrap items-start gap-4 justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-amber-50 text-amber-700">{it.definition.nameAr}</span>
                  <span className="text-xs text-slate-500">
                    من: {it.initiatedBy?.fullNameAr}
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  المرجع: {it.entityType} / {it.entityId.slice(0, 8)}
                </div>
                {it.data && (
                  <pre className="mt-2 text-xs bg-slate-50 p-2 rounded text-slate-600 overflow-x-auto">
                    {JSON.stringify(it.data, null, 2)}
                  </pre>
                )}
                <div className="text-xs text-slate-500 mt-2">
                  الخطوة الحالية: {it.steps[0]?.stepNameAr}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActing({ id: it.id, decision: 'APPROVE' })}
                  className="btn-primary text-sm"
                >
                  موافقة
                </button>
                <button
                  onClick={() => setActing({ id: it.id, decision: 'REJECT' })}
                  className="btn bg-red-600 text-white hover:bg-red-700 text-sm"
                >
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {acting && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
          <div className="card w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">
              {acting.decision === 'APPROVE' ? 'موافقة على الطلب' : 'رفض الطلب'}
            </h3>
            <label className="label">ملاحظات (اختيارية)</label>
            <textarea
              className="input"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setActing(null)} className="btn-secondary">إلغاء</button>
              <button
                onClick={() =>
                  actMutation.mutate({ id: acting.id, decision: acting.decision, comment })
                }
                className={
                  acting.decision === 'APPROVE'
                    ? 'btn-primary'
                    : 'btn bg-red-600 text-white hover:bg-red-700'
                }
                disabled={actMutation.isPending}
              >
                {actMutation.isPending ? 'جارٍ الإرسال...' : 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
