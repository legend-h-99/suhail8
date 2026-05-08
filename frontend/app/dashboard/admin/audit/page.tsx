'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  ip?: string;
  createdAt: string;
  user?: { fullNameAr: string; email: string };
  before?: any;
  after?: any;
}

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const { data = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit', entityType, action],
    queryFn: () => {
      const params = new URLSearchParams();
      if (entityType) params.set('entityType', entityType);
      if (action) params.set('action', action);
      return api.get(`/audit?${params}`).then(r => r.data);
    },
  });

  const cols: Column<AuditLog>[] = [
    { header: 'الوقت', render: (l) => new Date(l.createdAt).toLocaleString('ar-SA') },
    { header: 'المستخدم', render: (l) => l.user ? (
      <div className="text-xs">
        <div className="font-medium">{l.user.fullNameAr}</div>
        <div className="text-slate-500" dir="ltr">{l.user.email}</div>
      </div>
    ) : '—' },
    { header: 'الإجراء', render: (l) => <span className="font-mono text-xs">{l.action}</span> },
    { header: 'الكيان', render: (l) => l.entityType },
    { header: 'IP', render: (l) => <span className="text-xs text-slate-500" dir="ltr">{l.ip ?? '—'}</span> },
    { header: 'تفاصيل', render: (l) => l.after ? (
      <details>
        <summary className="text-xs text-primary cursor-pointer">عرض</summary>
        <pre className="text-[10px] bg-slate-50 p-2 mt-1 rounded overflow-x-auto max-w-md max-h-40">
          {JSON.stringify(l.after, null, 2)}
        </pre>
      </details>
    ) : '—' },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">سجل العمليات (Audit Log)</h1>
        <p className="text-slate-500 mt-1">{data.length} سجل · يُسجَّل تلقائياً لكل عملية تعديل</p>
      </header>

      <div className="card">
        <div className="flex gap-2 mb-3">
          <input className="input max-w-xs" placeholder="نوع الكيان (http, leave, ...)"
            value={entityType} onChange={(e) => setEntityType(e.target.value)} />
          <input className="input max-w-xs" placeholder="الإجراء (POST, PATCH, ...)"
            value={action} onChange={(e) => setAction(e.target.value)} />
        </div>
        <DataTable data={data} columns={cols} loading={isLoading} empty="لا توجد سجلات." />
      </div>
    </div>
  );
}
