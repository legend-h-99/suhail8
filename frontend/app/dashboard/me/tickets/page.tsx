'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  creator?: { id: string; fullNameAr: string };
  assignee?: { fullNameAr: string };
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المعالجة',
  WAITING: 'بانتظار رد',
  RESOLVED: 'محلولة',
  CLOSED: 'مغلقة',
};

export default function MyTicketsPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [showForm, setShowForm] = useState(false);

  const { data: all = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['my-tickets'],
    queryFn: () => api.get('/it/tickets').then(r => r.data),
  });

  const tickets = all.filter((t) => !user || (t as any).creatorId === user.userId || t.creator?.id === user.userId);

  const cols: Column<Ticket>[] = [
    { header: 'الرقم', render: (t) => <span className="font-mono text-xs">{t.number}</span> },
    { header: 'الموضوع', render: (t) => <span className="font-medium">{t.subject}</span> },
    { header: 'الفئة', render: (t) => t.category },
    { header: 'الأولوية', render: (t) => t.priority },
    { header: 'المسند إليه', render: (t) => t.assignee?.fullNameAr ?? '—' },
    { header: 'الحالة', render: (t) => <span className="badge bg-slate-100">{STATUS_LABEL[t.status] ?? t.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تذاكري التقنية</h1>
          <p className="text-slate-500 mt-1">{tickets.length} تذكرة</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ تذكرة جديدة</button>
      </header>

      <div className="card">
        <DataTable data={tickets} columns={cols} loading={isLoading} empty="لا توجد تذاكر." />
      </div>

      {showForm && <NewMyTicket onClose={() => setShowForm(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['my-tickets'] }); setShowForm(false); }} />}
    </div>
  );
}

function NewMyTicket({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [category, setCategory] = useState('SOFTWARE');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post('/it/tickets', { category, priority, subject, description }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">تذكرة دعم تقني</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الفئة</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="HARDWARE">أجهزة</option>
                <option value="SOFTWARE">برامج</option>
                <option value="NETWORK">شبكة</option>
                <option value="ACCESS">صلاحيات</option>
                <option value="EMAIL">بريد</option>
                <option value="OTHER">أخرى</option>
              </select>
            </div>
            <div>
              <label className="label">الأولوية</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">منخفضة</option>
                <option value="NORMAL">عادية</option>
                <option value="HIGH">عالية</option>
                <option value="URGENT">عاجلة</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">الموضوع</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={() => submit.mutate()} className="btn-primary" disabled={!subject || !description || submit.isPending}>
            {submit.isPending ? 'جارٍ الإرسال...' : 'فتح التذكرة'}
          </button>
        </div>
      </div>
    </div>
  );
}
