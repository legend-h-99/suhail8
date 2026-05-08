'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Cog, Play, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  ETL: 'ETL',
  VALIDATION: 'تحقق',
  CLEANING: 'تنظيف',
  AGGREGATION: 'تجميع',
  KPI_COMPUTE: 'حساب KPI',
  AI_INDEXING: 'AI Indexing',
};

const STATUS_ICON: Record<string, any> = {
  RUNNING: { icon: Clock, color: 'text-amber-600' },
  SUCCESS: { icon: CheckCircle, color: 'text-emerald-600' },
  FAILED: { icon: XCircle, color: 'text-red-600' },
  SKIPPED: { icon: Clock, color: 'text-slate-400' },
};

export default function DataProcessingPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ['processing-jobs'],
    queryFn: () => api.get('/data/processing/jobs').then(r => r.data),
  });

  const run = useMutation({
    mutationFn: (id: string) => api.post(`/data/processing/jobs/${id}/run`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processing-jobs'] }),
  });

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cog /> Data Processing Jobs
          </h1>
          <p className="text-slate-500 mt-1">{jobs.length} مهمة معالجة بيانات</p>
        </div>
        {hasPermission('data_processing.manage') && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1">
            <Plus size={14} /> مهمة معالجة جديدة
          </button>
        )}
      </header>

      <div className="card p-0 overflow-hidden">
        {jobs.length === 0 ? (
          <div className="text-slate-400 text-center py-12">
            لا توجد مهام معالجة. أنشئ مهمة ETL أو AGGREGATION.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-right text-xs">الاسم</th>
                <th className="p-2 text-right text-xs">النوع</th>
                <th className="p-2 text-right text-xs">الجدولة</th>
                <th className="p-2 text-right text-xs">آخر تشغيل</th>
                <th className="p-2 text-right text-xs">الحالة</th>
                <th className="p-2 text-right text-xs">السجلات</th>
                <th className="p-2 text-right text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const s = STATUS_ICON[j.lastStatus ?? 'SKIPPED'];
                const Icon = s.icon;
                return (
                  <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-2 font-medium">{j.nameAr}</td>
                    <td className="p-2"><span className="badge bg-slate-100">{TYPE_LABEL[j.type] ?? j.type}</span></td>
                    <td className="p-2 text-xs font-mono">{j.schedule ?? 'manual'}</td>
                    <td className="p-2 text-xs">
                      {j.lastRunAt ? new Date(j.lastRunAt).toLocaleString('ar-SA') : '—'}
                    </td>
                    <td className="p-2">
                      <span className="flex items-center gap-1">
                        <Icon size={14} className={s.color} />
                        <span className="text-xs">{j.lastStatus ?? 'لم يُشغّل'}</span>
                      </span>
                    </td>
                    <td className="p-2 font-mono text-xs">{j.rowsProcessed}</td>
                    <td className="p-2">
                      {hasPermission('data_processing.manage') && (
                        <button onClick={() => run.mutate(j.id)}
                          className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Play size={11} /> تشغيل
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <NewJob onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['processing-jobs'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewJob({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState('AGGREGATION');
  const [schedule, setSchedule] = useState('manual');

  const submit = useMutation({
    mutationFn: () => api.post('/data/processing/jobs', { nameAr, type, schedule }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="font-semibold mb-3">مهمة معالجة جديدة</h3>
        <div className="space-y-3">
          <div>
            <label className="label">الاسم</label>
            <input className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </div>
          <div>
            <label className="label">النوع</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ETL">ETL</option>
              <option value="VALIDATION">تحقق</option>
              <option value="CLEANING">تنظيف</option>
              <option value="AGGREGATION">تجميع</option>
              <option value="KPI_COMPUTE">حساب KPI</option>
              <option value="AI_INDEXING">AI Indexing</option>
            </select>
          </div>
          <div>
            <label className="label">الجدولة (cron أو manual)</label>
            <input className="input" value={schedule} onChange={(e) => setSchedule(e.target.value)}
              placeholder="مثال: 0 0 * * * أو manual" />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary" disabled={!nameAr || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'إنشاء'}
          </button>
        </div>
      </div>
    </div>
  );
}
