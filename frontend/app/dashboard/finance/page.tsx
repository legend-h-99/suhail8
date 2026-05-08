'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface PR {
  id: string;
  number: string;
  description: string;
  amount: string;
  status: string;
  type: string;
  vendorName?: string;
  department?: { nameAr: string };
  createdAt: string;
  workflowInstance?: { currentStep?: string; steps?: any[] };
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'مسودة',
  SUBMITTED: 'مقدّم',
  UNDER_REVIEW: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  ORDERED: 'تم الطلب',
  RECEIVED: 'تم الاستلام',
};

export default function FinancePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: prs = [], isLoading } = useQuery<PR[]>({
    queryKey: ['purchases'],
    queryFn: () => api.get('/finance/purchases').then(r => r.data),
  });

  const cols: Column<PR>[] = [
    { header: 'الرقم', render: (p) => <span className="font-mono text-xs text-slate-500">{p.number}</span> },
    { header: 'الوصف', render: (p) => <span className="font-medium">{p.description}</span> },
    { header: 'الإدارة', render: (p) => p.department?.nameAr ?? '—' },
    { header: 'المبلغ', render: (p) => (
      <span className="font-mono">
        {Number(p.amount).toLocaleString('ar-SA')} ر.س
        {Number(p.amount) > 100000 && <span className="badge bg-red-50 text-red-700 mr-2 text-[10px]">يحتاج مدير عام</span>}
      </span>
    )},
    { header: 'الحالة', render: (p) => (
      <span className={`badge ${STATUS_BADGE[p.status] ?? 'bg-slate-100'}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
    )},
    { header: 'الخطوة', render: (p) => p.workflowInstance?.currentStep ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الشؤون المالية — طلبات الشراء</h1>
          <p className="text-slate-500 mt-1">{prs.length} طلب • سقف العميد 100,000 ر.س</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ طلب شراء جديد</button>
      </header>

      <div className="card">
        <DataTable data={prs} columns={cols} loading={isLoading} />
      </div>

      {showForm && (
        <NewPRModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['purchases'] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function NewPRModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: departments = [] } = useQuery<{ id: string; nameAr: string }[]>({
    queryKey: ['departments-flat'],
    queryFn: () => api.get('/org/departments').then(r => r.data),
  });

  const [departmentId, setDepartmentId] = useState('');
  const [type, setType] = useState('EQUIPMENT');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [items, setItems] = useState([{ nameAr: '', qty: 1, unitPrice: 0 }]);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0);

  const submit = useMutation({
    mutationFn: () => api.post('/finance/purchases', {
      departmentId, type, description, vendorName,
      amount: total,
      items: items.map(i => ({ ...i, qty: Number(i.qty), unitPrice: Number(i.unitPrice) })),
    }),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.messageAr ?? 'فشل الإرسال'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50 overflow-auto">
      <div className="card w-full max-w-2xl my-8">
        <h3 className="text-lg font-semibold mb-4">طلب شراء جديد</h3>

        <div className="space-y-3">
          <div>
            <label className="label">الإدارة المستفيدة</label>
            <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">— اختر —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">النوع</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="EQUIPMENT">أجهزة وتجهيزات</option>
                <option value="TRAINING_NEEDS">احتياجات تدريبية</option>
                <option value="MAINTENANCE">صيانة</option>
                <option value="INSURANCE">تأمين</option>
                <option value="COMMUNITY_CENTER">مركز المجتمع</option>
                <option value="OTHER">أخرى</option>
              </select>
            </div>
            <div>
              <label className="label">المورد</label>
              <input className="input" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="اختياري" />
            </div>
          </div>

          <div>
            <label className="label">الوصف</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="label">البنود</label>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input
                    className="input col-span-6"
                    placeholder="اسم البند"
                    value={it.nameAr}
                    onChange={(e) => { const a = [...items]; a[i].nameAr = e.target.value; setItems(a); }}
                  />
                  <input
                    type="number" min={1} className="input col-span-2" placeholder="الكمية"
                    value={it.qty}
                    onChange={(e) => { const a = [...items]; a[i].qty = Number(e.target.value); setItems(a); }}
                  />
                  <input
                    type="number" min={0} className="input col-span-3" placeholder="سعر الوحدة"
                    value={it.unitPrice}
                    onChange={(e) => { const a = [...items]; a[i].unitPrice = Number(e.target.value); setItems(a); }}
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => setItems(items.filter((_, j) => j !== i))}
                      className="col-span-1 text-red-600 hover:bg-red-50 rounded"
                      type="button"
                    >×</button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItems([...items, { nameAr: '', qty: 1, unitPrice: 0 }])}
              className="text-sm text-primary mt-2 hover:underline"
            >+ إضافة بند</button>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 flex justify-between items-center">
            <span className="text-sm text-slate-600">الإجمالي:</span>
            <span className="text-xl font-bold">{total.toLocaleString('ar-SA')} ر.س</span>
          </div>

          {total > 100_000 && (
            <div className="rounded bg-amber-50 border border-amber-200 text-amber-800 p-2 text-sm">
              ⚠️ المبلغ أكبر من 100,000 ر.س — سيُضاف اعتماد المدير العام للمنطقة في سير العمل.
            </div>
          )}

          {error && <div className="rounded bg-red-50 text-red-700 p-2 text-sm">{error}</div>}
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button
            onClick={() => submit.mutate()}
            className="btn-primary"
            disabled={!departmentId || !description || total <= 0 || submit.isPending}
          >
            {submit.isPending ? 'جارٍ الإرسال...' : 'تقديم'}
          </button>
        </div>
      </div>
    </div>
  );
}
