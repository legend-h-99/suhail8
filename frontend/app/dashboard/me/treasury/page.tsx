'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Wallet, TrendingDown, AlertCircle } from 'lucide-react';

export default function TreasuryPage() {
  const { hasPermission } = useAuth();
  const { data, isLoading } = useQuery<any>({
    queryKey: ['treasury'],
    queryFn: () => api.get('/specialized/treasury').then(r => r.data),
    enabled: hasPermission('treasury.reconcile'),
  });

  if (!hasPermission('treasury.reconcile')) {
    return <div className="card text-center py-12 text-slate-600">هذه الصفحة لأمين الصندوق فقط.</div>;
  }
  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;

  const allocated = Number(data?.summary.totalAllocated ?? 0);
  const spent = Number(data?.summary.totalSpent ?? 0);
  const reserved = Number(data?.summary.totalReserved ?? 0);
  const available = allocated - spent - reserved;
  const utilization = data?.summary.utilization ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">مساحة أمين الصندوق</h1>
        <p className="text-slate-500 mt-1">المخصصات المالية، الفواتير، والتدقيق الشهري</p>
      </header>

      {/* Big budget card */}
      <div className="card bg-gradient-to-bl from-primary-700 to-primary-800 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm opacity-80">إجمالي الميزانية المخصصة لـ 1446</div>
            <div className="text-3xl font-bold mt-1">{allocated.toLocaleString('ar-SA')} ر.س</div>
          </div>
          <Wallet size={40} className="opacity-50" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t border-primary-500">
          <div>
            <div className="opacity-75 text-xs">المنصرف</div>
            <div className="font-bold">{spent.toLocaleString('ar-SA')}</div>
          </div>
          <div>
            <div className="opacity-75 text-xs">المحجوز</div>
            <div className="font-bold">{reserved.toLocaleString('ar-SA')}</div>
          </div>
          <div>
            <div className="opacity-75 text-xs">المتاح</div>
            <div className="font-bold">{available.toLocaleString('ar-SA')}</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${utilization}%` }} />
        </div>
        <div className="text-xs opacity-75 mt-1">{utilization}% من الميزانية مستهلكة</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <TrendingDown size={20} className="text-red-600 mb-2" />
          <div className="text-2xl font-bold">{utilization}%</div>
          <div className="text-xs text-slate-500">معدل الاستهلاك</div>
        </div>
        <div className="card">
          <AlertCircle size={20} className="text-amber-600 mb-2" />
          <div className="text-2xl font-bold">{data?.summary.pendingPayments ?? 0}</div>
          <div className="text-xs text-slate-500">دفعات معلّقة</div>
        </div>
        <div className="card">
          <Wallet size={20} className="text-emerald-600 mb-2" />
          <div className="text-2xl font-bold">{(data?.budgets ?? []).length}</div>
          <div className="text-xs text-slate-500">ميزانيات نشطة</div>
        </div>
      </div>

      {/* Budgets table */}
      {data?.budgets?.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">📊 الميزانيات حسب الإدارة</h3>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-right text-xs">الإدارة</th>
                  <th className="p-2 text-right text-xs">الفئة</th>
                  <th className="p-2 text-right text-xs">المخصص</th>
                  <th className="p-2 text-right text-xs">المنصرف</th>
                  <th className="p-2 text-right text-xs">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {data.budgets.slice(0, 10).map((b: any) => {
                  const allo = Number(b.allocated);
                  const sp = Number(b.spent);
                  const pct = allo > 0 ? Math.round((sp / allo) * 100) : 0;
                  return (
                    <tr key={b.id} className="border-t border-slate-100">
                      <td className="p-2">{b.department?.nameAr ?? '—'}</td>
                      <td className="p-2 text-xs">{b.category}</td>
                      <td className="p-2 font-mono">{allo.toLocaleString('ar-SA')}</td>
                      <td className="p-2 font-mono">{sp.toLocaleString('ar-SA')}</td>
                      <td className="p-2">
                        <span className={`badge ${pct >= 90 ? 'bg-red-50 text-red-700' : pct >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="card bg-slate-50">
        <h3 className="text-sm font-semibold mb-2">🔔 مهامي:</h3>
        <ul className="text-sm space-y-1 list-disc pr-4">
          <li>استلام النقد والشيكات وأوراق القبض ومايماثلها</li>
          <li>المشاركة في إعداد وتجهيز مشروع موازنة المنشأة</li>
          <li>تنظيم صرف المخصصات المالية بموجب حوالات</li>
          <li>إعداد وتدقيق الموقف المالي الشهري</li>
        </ul>
      </div>
    </div>
  );
}
