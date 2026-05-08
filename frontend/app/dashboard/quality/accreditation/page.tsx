'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Award, Upload, FileCheck, AlertTriangle, Plus } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'لم يبدأ',
  IN_PROGRESS: 'قيد العمل',
  EVIDENCE_READY: 'الشواهد جاهزة',
  VERIFIED: 'مُتحقق',
  WEAK: 'ضعيف',
};

const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  EVIDENCE_READY: 'bg-amber-50 text-amber-700',
  VERIFIED: 'bg-emerald-50 text-emerald-700',
  WEAK: 'bg-red-50 text-red-700',
};

export default function AccreditationPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['accreditation'],
    queryFn: () => api.get('/quality/accreditation').then(r => r.data),
  });

  const items = data?.items ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الاعتماد الأكاديمي</h1>
          <p className="text-slate-500 mt-1">{items.length} معيار</p>
        </div>
        {hasPermission('quality.accreditation.manage') && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1">
            <Plus size={14} /> إضافة معيار
          </button>
        )}
      </header>

      {summary && (
        <div className="card bg-gradient-to-bl from-primary-700 to-primary-800 text-white">
          <div className="flex items-center gap-4">
            <Award size={36} />
            <div>
              <div className="text-sm opacity-80">جاهزية الاعتماد</div>
              <div className="text-3xl font-bold mt-1">{summary.readiness}%</div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${summary.readiness}%` }} />
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4 text-xs">
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="text-2xl font-bold">{summary.byStatus[k] ?? 0}</div>
                <div className="opacity-80">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-0">
        {isLoading ? (
          <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
        ) : items.length === 0 ? (
          <div className="text-slate-400 text-center py-12 text-sm">لا توجد معايير. أضف أول معيار اعتماد.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item: any) => (
              <li key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">{item.standardCode}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">دورة {item.cycle}</span>
                    </div>
                    <h3 className="font-semibold mt-1">{item.nameAr}</h3>
                    {item.description && (
                      <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="badge bg-slate-100 text-slate-700 flex items-center gap-1">
                        <FileCheck size={11} /> {item._count.evidence} شاهد
                      </span>
                      {item.dueDate && (
                        <span className="text-slate-500">
                          ⏰ {new Date(item.dueDate).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${STATUS_COLOR[item.status] ?? 'bg-slate-100'} shrink-0`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </div>

                {hasPermission('quality.accreditation.manage') && (
                  <div className="flex items-center gap-2 mt-3">
                    <select
                      className="input text-xs py-1 max-w-[150px]"
                      value={item.status}
                      onChange={(e) => {
                        api.patch(`/quality/accreditation/${item.id}/status`, { status: e.target.value })
                          .then(() => qc.invalidateQueries({ queryKey: ['accreditation'] }));
                      }}
                    >
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && <NewStandard onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['accreditation'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewStandard({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [standardCode, setStandardCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [cycle, setCycle] = useState(String(new Date().getFullYear()));
  const [dueDate, setDueDate] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/quality/accreditation', {
      standardCode, nameAr, description, cycle, dueDate: dueDate || undefined,
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">إضافة معيار اعتماد</h3>
        <div className="space-y-3">
          <div>
            <label className="label">رمز المعيار</label>
            <input className="input" value={standardCode} onChange={(e) => setStandardCode(e.target.value)}
              placeholder="مثل: NCAAA-3.4" />
          </div>
          <div>
            <label className="label">اسم المعيار</label>
            <input className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الدورة</label>
              <input className="input" value={cycle} onChange={(e) => setCycle(e.target.value)} />
            </div>
            <div>
              <label className="label">الموعد النهائي</label>
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!standardCode || !nameAr || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
