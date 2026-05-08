'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';
import { Send, MessageCircle } from 'lucide-react';

interface Report {
  id: string; period: string; type: string; title: string; body: string;
  status: string; submittedAt?: string; trackingNumber?: string;
  gmFeedback?: string; gmFeedbackAt?: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'مسودة', SUBMITTED: 'مُرسل', ACKNOWLEDGED: 'استلم رد',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  ACKNOWLEDGED: 'bg-emerald-50 text-emerald-700',
};

export default function DgReportsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [feedbackOn, setFeedbackOn] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const { data = [], isLoading } = useQuery<Report[]>({
    queryKey: ['dg-reports'],
    queryFn: () => api.get('/quality/dg-reports').then(r => r.data),
  });

  const submit = useMutation({
    mutationFn: (id: string) => api.post(`/quality/dg-reports/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dg-reports'] }),
  });

  const recordFeedback = useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) =>
      api.post(`/quality/dg-reports/${id}/feedback`, { feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dg-reports'] });
      setFeedbackOn(null); setFeedbackText('');
    },
  });

  const cols: Column<Report>[] = [
    { header: 'الفترة', render: (r) => <span className="font-mono text-xs">{r.period}</span> },
    { header: 'النوع', render: (r) => r.type === 'QUARTERLY' ? 'ربعي' : 'سنوي' },
    { header: 'العنوان', render: (r) => <span className="font-medium">{r.title}</span> },
    { header: 'الحالة', render: (r) => <span className={`badge ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span> },
    { header: 'رقم تتبع', render: (r) => r.trackingNumber ? <span className="font-mono text-xs">{r.trackingNumber}</span> : '—' },
    { header: '', render: (r) => (
      <div className="flex gap-1">
        {r.status === 'DRAFT' && hasPermission('quality.report.dg_submit') && (
          <button onClick={() => submit.mutate(r.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Send size={12} /> إرسال
          </button>
        )}
        {r.status === 'SUBMITTED' && hasPermission('quality.report.dg_submit') && (
          <button onClick={() => setFeedbackOn(r.id)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <MessageCircle size={12} /> تسجيل رد
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تقارير الإدارة العامة</h1>
          <p className="text-slate-500 mt-1">{data.length} تقرير</p>
        </div>
        {hasPermission('quality.report.dg_submit') && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ تقرير جديد</button>
        )}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد تقارير بعد." />
      </div>

      {/* Show feedback if recorded */}
      {data.filter(r => r.gmFeedback).map(r => (
        <div key={r.id} className="card bg-blue-50 border-blue-200">
          <div className="text-xs text-blue-700 font-mono">رد على {r.period} ({r.trackingNumber})</div>
          <p className="text-sm mt-1 whitespace-pre-line">{r.gmFeedback}</p>
        </div>
      ))}

      {showForm && <NewReport onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['dg-reports'] }); setShowForm(false); }} />}

      {feedbackOn && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
          <div className="card w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">تسجيل رد الإدارة العامة</h3>
            <textarea className="input" rows={4} placeholder="الرد المستلم..."
              value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setFeedbackOn(null)} className="btn-secondary">إلغاء</button>
              <button onClick={() => recordFeedback.mutate({ id: feedbackOn, feedback: feedbackText })}
                className="btn-primary" disabled={!feedbackText}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewReport({ onClose, onSuccess }: any) {
  const today = new Date();
  const q = Math.floor(today.getMonth() / 3) + 1;
  const [type, setType] = useState<'QUARTERLY' | 'ANNUAL'>('QUARTERLY');
  const [period, setPeriod] = useState(`${today.getFullYear()}-Q${q}`);
  const [title, setTitle] = useState(`التقرير الربعي Q${q} ${today.getFullYear()}`);
  const [body, setBody] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/quality/dg-reports', { type, period, title, body }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-lg my-8">
        <h3 className="text-lg font-semibold mb-4">تقرير للإدارة العامة</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">النوع</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="QUARTERLY">ربعي</option>
                <option value="ANNUAL">سنوي</option>
              </select>
            </div>
            <div>
              <label className="label">الفترة</label>
              <input className="input" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">العنوان</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">المحتوى</label>
            <textarea className="input" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!body || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'حفظ كمسوّدة'}
          </button>
        </div>
      </div>
    </div>
  );
}
