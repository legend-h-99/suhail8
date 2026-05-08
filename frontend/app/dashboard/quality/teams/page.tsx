'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Users2, ChevronLeft } from 'lucide-react';

interface Team {
  id: string; nameAr: string; status: string;
  charter: any; members: any[];
  _count: { tasks: number };
}

export default function QualityTeamsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<Team[]>({
    queryKey: ['quality-teams'],
    queryFn: () => api.get('/quality/teams').then(r => r.data),
  });

  const activate = useMutation({
    mutationFn: (id: string) => api.post(`/quality/teams/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quality-teams'] }),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">فرق الجودة</h1>
          <p className="text-slate-500 mt-1">{data.length} فريق</p>
        </div>
        {hasPermission('quality.team.charter') && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ تأسيس فريق</button>
        )}
      </header>

      {isLoading ? (
        <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.length === 0 ? (
            <div className="col-span-full card text-center text-slate-400 py-8 text-sm">لا توجد فرق.</div>
          ) : data.map((t) => (
            <Link key={t.id} href={`/dashboard/quality/teams/${t.id}`}
              className="card hover:shadow-md hover:border-primary transition">
              <div className="flex items-start justify-between mb-2">
                <Users2 size={20} className="text-primary" />
                <span className={`badge ${
                  t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                  t.status === 'PROPOSED' ? 'bg-amber-50 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {t.status === 'ACTIVE' ? 'نشط' : t.status === 'PROPOSED' ? 'مقترح' : 'مؤرشف'}
                </span>
              </div>
              <div className="font-semibold mt-2">{t.nameAr}</div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.charter?.purposeAr ?? ''}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>{(t.members as any[])?.length ?? 0} عضو · {t._count.tasks} مهمة</span>
                <ChevronLeft size={14} />
              </div>
              {t.status === 'PROPOSED' && hasPermission('quality.team.charter') && (
                <button onClick={(e) => { e.preventDefault(); activate.mutate(t.id); }}
                  className="btn-primary w-full mt-3 text-xs py-1.5">تفعيل الفريق</button>
              )}
            </Link>
          ))}
        </div>
      )}

      {showForm && <NewTeam onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['quality-teams'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewTeam({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nameAr, setNameAr] = useState('');
  const [purposeAr, setPurposeAr] = useState('');
  const [scopeAr, setScopeAr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deliverables, setDeliverables] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/quality/teams', {
      nameAr,
      charter: {
        purposeAr,
        scopeAr,
        deadline,
        deliverables: deliverables.split('\n').filter(Boolean),
      },
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-lg my-8">
        <h3 className="text-lg font-semibold mb-4">تأسيس فريق جودة</h3>
        <div className="space-y-3">
          <div>
            <label className="label">اسم الفريق</label>
            <input className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: فريق ضبط جودة الاختبارات" />
          </div>
          <div>
            <label className="label">الغرض</label>
            <textarea className="input" rows={2} value={purposeAr} onChange={(e) => setPurposeAr(e.target.value)} />
          </div>
          <div>
            <label className="label">النطاق</label>
            <textarea className="input" rows={2} value={scopeAr} onChange={(e) => setScopeAr(e.target.value)} />
          </div>
          <div>
            <label className="label">المخرجات (سطر لكل واحد)</label>
            <textarea className="input" rows={3} value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)} />
          </div>
          <div>
            <label className="label">الموعد النهائي</label>
            <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!nameAr || !purposeAr || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'إنشاء (مقترح)'}
          </button>
        </div>
      </div>
    </div>
  );
}
