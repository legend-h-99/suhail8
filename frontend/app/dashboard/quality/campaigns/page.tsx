'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface Campaign {
  id: string; title: string; type: string;
  startDate: string; endDate: string;
  targetAudience: string; objectiveAr: string;
  attendeesCount?: number;
}

const TYPE_LABEL: Record<string, string> = {
  WORKSHOP: 'ورشة', EVENT: 'فعالية', MEDIA: 'حملة إعلامية', TRAINING: 'تدريب',
};

export default function CampaignsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/quality/campaigns').then(r => r.data),
  });

  const cols: Column<Campaign>[] = [
    { header: 'العنوان', render: (c) => <span className="font-medium">{c.title}</span> },
    { header: 'النوع', render: (c) => TYPE_LABEL[c.type] ?? c.type },
    { header: 'الجمهور', render: (c) => c.targetAudience },
    { header: 'الفترة', render: (c) => `${new Date(c.startDate).toLocaleDateString('ar-SA')} → ${new Date(c.endDate).toLocaleDateString('ar-SA')}` },
    { header: 'الحضور', render: (c) => c.attendeesCount ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">حملات ثقافة الجودة</h1>
          <p className="text-slate-500 mt-1">{data.length} حملة</p>
        </div>
        {hasPermission('quality.campaign.create') && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ حملة جديدة</button>
        )}
      </header>

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد حملات." />
      </div>

      {showForm && <NewCampaign onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewCampaign({ onClose, onSuccess }: any) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('WORKSHOP');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [objectiveAr, setObjectiveAr] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/quality/campaigns', {
      title, type, startDate, endDate, targetAudience, objectiveAr,
    }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">حملة ثقافة جودة جديدة</h3>
        <div className="space-y-3">
          <div>
            <label className="label">العنوان</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">النوع</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="WORKSHOP">ورشة</option>
                <option value="EVENT">فعالية</option>
                <option value="MEDIA">إعلامية</option>
                <option value="TRAINING">تدريب</option>
              </select>
            </div>
            <div>
              <label className="label">الجمهور</label>
              <select className="input" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                <option value="ALL">الجميع</option>
                <option value="TRAINEES">المتدربين</option>
                <option value="EMPLOYEES">الموظفين</option>
                <option value="TRAINERS">المدربين</option>
              </select>
            </div>
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
            <label className="label">الهدف</label>
            <textarea className="input" rows={2} value={objectiveAr} onChange={(e) => setObjectiveAr(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary"
            disabled={!title || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
