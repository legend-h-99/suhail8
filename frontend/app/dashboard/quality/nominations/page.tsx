'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface Nomination {
  id: string; courseTitle: string; providerName?: string;
  startDate: string; endDate: string; cost?: string;
  justification: string; status: string;
  employeeId: string;
}

const STATUS_LABEL: Record<string, string> = {
  PROPOSED: 'مُقترح', APPROVED: 'موافق عليه', REJECTED: 'مرفوض',
  ATTENDED: 'حضر فعلاً', NO_SHOW: 'لم يحضر',
};

const STATUS_COLOR: Record<string, string> = {
  PROPOSED: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-red-50 text-red-700',
  ATTENDED: 'bg-emerald-50 text-emerald-700',
  NO_SHOW: 'bg-slate-100 text-slate-600',
};

export default function NominationsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<Nomination[]>({
    queryKey: ['nominations'],
    queryFn: () => api.get('/quality/nominations').then(r => r.data),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/quality/nominations/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nominations'] }),
  });

  const cols: Column<Nomination>[] = [
    { header: 'الدورة', render: (n) => <span className="font-medium">{n.courseTitle}</span> },
    { header: 'الجهة', render: (n) => n.providerName ?? '—' },
    { header: 'الفترة', render: (n) => `${new Date(n.startDate).toLocaleDateString('ar-SA')} → ${new Date(n.endDate).toLocaleDateString('ar-SA')}` },
    { header: 'التكلفة', render: (n) => n.cost ? `${Number(n.cost).toLocaleString('ar-SA')} ر.س` : '—' },
    { header: 'الحالة', render: (n) => <span className={`badge ${STATUS_COLOR[n.status] ?? 'bg-slate-100'}`}>{STATUS_LABEL[n.status] ?? n.status}</span> },
    { header: '', render: (n) => hasPermission('quality.nomination.recommend') && n.status === 'APPROVED' ? (
      <select className="input text-xs py-1 max-w-[120px]"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) setStatus.mutate({ id: n.id, status: e.target.value });
        }}>
        <option value="">تحديث →</option>
        <option value="ATTENDED">حضر</option>
        <option value="NO_SHOW">لم يحضر</option>
      </select>
    ) : null },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ترشيحات للدورات الخارجية</h1>
          <p className="text-slate-500 mt-1">{data.length} ترشيح</p>
        </div>
        {hasPermission('quality.nomination.recommend') && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ ترشيح جديد</button>
        )}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد ترشيحات." />
      </div>

      {showForm && <NewNomination onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['nominations'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewNomination({ onClose, onSuccess }: any) {
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees-directory'],
    queryFn: () => api.get('/hr/employees/directory').then(r => r.data),
  });

  const [employeeId, setEmployeeId] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [providerName, setProviderName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState<number | ''>('');
  const [justification, setJustification] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/quality/nominations', {
      employeeId, courseTitle, providerName, startDate, endDate,
      cost: cost === '' ? undefined : cost,
      justification,
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-md my-8">
        <h3 className="text-lg font-semibold mb-4">ترشيح موظف لدورة</h3>
        <div className="space-y-3">
          <div>
            <label className="label">الموظف</label>
            <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">— اختر —</option>
              {employees.map((e: any) => <option key={e.id} value={e.id}>{e.fullNameAr}</option>)}
            </select>
          </div>
          <div>
            <label className="label">عنوان الدورة</label>
            <input className="input" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">الجهة المُقدِّمة</label>
            <input className="input" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
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
            <label className="label">التكلفة (ر.س)</label>
            <input type="number" className="input" value={cost}
              onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div>
            <label className="label">المبرر</label>
            <textarea className="input" rows={2} value={justification} onChange={(e) => setJustification(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!employeeId || !courseTitle || !justification || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'ترشيح'}
          </button>
        </div>
      </div>
    </div>
  );
}
