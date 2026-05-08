'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Plus, AlertCircle } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'جديدة',
  IN_PROGRESS: 'قيد التنفيذ',
  PENDING_APPROVAL: 'بانتظار الاعتماد',
  DONE: 'مكتملة',
  OVERDUE: 'متأخرة',
  REJECTED: 'مرفوضة',
};

const PRIORITY_LABEL: Record<string, { label: string; color: string }> = {
  LOW: { label: 'منخفضة', color: 'bg-slate-100 text-slate-600' },
  NORMAL: { label: 'عادية', color: 'bg-blue-50 text-blue-700' },
  HIGH: { label: 'عالية', color: 'bg-amber-50 text-amber-700' },
  URGENT: { label: 'عاجلة', color: 'bg-red-50 text-red-700' },
};

const STATUS_COLOR: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700',
  DONE: 'bg-emerald-50 text-emerald-700',
  OVERDUE: 'bg-red-50 text-red-700',
  REJECTED: 'bg-slate-100 text-slate-500',
};

export default function TasksPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('mine');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks', filter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter === 'mine') params.set('mineOnly', 'true');
      if (statusFilter) params.set('status', statusFilter);
      return api.get(`/tasks?${params}`).then(r => r.data);
    },
  });

  const { data: stats } = useQuery<any>({
    queryKey: ['tasks-stats'],
    queryFn: () => api.get('/tasks/stats').then(r => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">نظام المهام</h1>
          <p className="text-slate-500 mt-1">{tasks.length} مهمة</p>
        </div>
        {hasPermission('tasks.create') && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1">
            <Plus size={14} /> مهمة جديدة
          </button>
        )}
      </header>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <div className="text-2xl font-bold">{stats.mine}</div>
            <div className="text-xs text-slate-500">مهامي</div>
          </div>
          <div className="card text-center bg-red-50 border-red-200">
            <AlertCircle size={20} className="mx-auto text-red-600 mb-1" />
            <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
            <div className="text-xs text-red-700">متأخرة</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold">
              {stats.byStatus.find((s: any) => s.status === 'DONE')?.count ?? 0}
            </div>
            <div className="text-xs text-slate-500">مكتملة</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1">
            <button onClick={() => setFilter('mine')}
              className={`btn ${filter === 'mine' ? 'btn-primary' : 'btn-secondary'}`}>مهامي</button>
            <button onClick={() => setFilter('all')}
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}>كل المهام</button>
          </div>
          <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {tasks.length === 0 ? (
          <div className="text-slate-400 text-center py-12">لا توجد مهام.</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 border-b border-slate-100 hover:bg-slate-50">
                <select
                  value={t.status}
                  onChange={(e) => updateStatus.mutate({ id: t.id, status: e.target.value })}
                  className={`text-xs rounded px-2 py-1 border-0 ${STATUS_COLOR[t.status] ?? 'bg-slate-100'}`}
                >
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{t.title}</div>
                  {t.description && <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.description}</div>}
                </div>
                <span className={`badge ${PRIORITY_LABEL[t.priority]?.color ?? 'bg-slate-100'}`}>
                  {PRIORITY_LABEL[t.priority]?.label ?? t.priority}
                </span>
                {t.dueDate && (
                  <span className="text-xs text-slate-500">
                    📅 {new Date(t.dueDate).toLocaleDateString('ar-SA')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <NewTask onClose={() => setShowForm(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewTask({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [dueDate, setDueDate] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/tasks', { title, description, priority, dueDate: dueDate || undefined }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">مهمة جديدة</h3>
        <div className="space-y-3">
          <div>
            <label className="label">العنوان</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الأولوية</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">منخفضة</option>
                <option value="NORMAL">عادية</option>
                <option value="HIGH">عالية</option>
                <option value="URGENT">عاجلة</option>
              </select>
            </div>
            <div>
              <label className="label">الاستحقاق</label>
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary" disabled={!title || submit.isPending}>
            {submit.isPending ? 'جارٍ...' : 'إنشاء'}
          </button>
        </div>
      </div>
    </div>
  );
}
