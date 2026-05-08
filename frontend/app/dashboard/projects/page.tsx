'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Plus, Users, ListChecks, Target } from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  OPERATIONAL: 'تشغيلي', STRATEGIC: 'استراتيجي', QUALITY: 'جودة',
  TECHNICAL: 'تقني', FINANCIAL: 'مالي', TRAINING: 'تدريبي',
};

const STATUS_COLOR: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-blue-50 text-blue-700',
  ON_HOLD: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  });

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">نظام المشاريع</h1>
          <p className="text-slate-500 mt-1">{projects.length} مشروع</p>
        </div>
        {hasPermission('projects.create') && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1">
            <Plus size={14} /> مشروع جديد
          </button>
        )}
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full card text-center py-12 text-slate-400">لا توجد مشاريع.</div>
        ) : projects.map((p) => (
          <div key={p.id} className="card hover:border-primary transition">
            <div className="flex items-start justify-between mb-2">
              <span className={`badge ${STATUS_COLOR[p.status] ?? 'bg-slate-100'}`}>
                {p.status === 'PLANNING' ? 'تخطيط' :
                 p.status === 'ACTIVE' ? 'نشط' :
                 p.status === 'COMPLETED' ? 'مكتمل' : p.status}
              </span>
              <span className="badge bg-slate-100 text-xs">{TYPE_LABEL[p.type] ?? p.type}</span>
            </div>
            <div className="text-xs font-mono text-slate-400">{p.code}</div>
            <h3 className="font-semibold mt-1">{p.nameAr}</h3>
            {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}

            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Users size={11} /> {p._count.members}</span>
              <span className="flex items-center gap-1"><Target size={11} /> {p._count.milestones}</span>
              <span className="flex items-center gap-1"><ListChecks size={11} /> {p._count.tasks}</span>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>الإنجاز</span>
                <span>{p.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && <NewProject onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewProject({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState('OPERATIONAL');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/projects', { nameAr, type, description, startDate, targetEndDate: targetEndDate || undefined }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">مشروع جديد</h3>
        <div className="space-y-3">
          <div>
            <label className="label">الاسم</label>
            <input className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </div>
          <div>
            <label className="label">النوع</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="OPERATIONAL">تشغيلي</option>
              <option value="STRATEGIC">استراتيجي</option>
              <option value="QUALITY">جودة</option>
              <option value="TECHNICAL">تقني</option>
              <option value="FINANCIAL">مالي</option>
              <option value="TRAINING">تدريبي</option>
            </select>
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">البداية</label>
              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label">المستهدف</label>
              <input type="date" className="input" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary" disabled={!nameAr || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'إنشاء'}
          </button>
        </div>
      </div>
    </div>
  );
}
