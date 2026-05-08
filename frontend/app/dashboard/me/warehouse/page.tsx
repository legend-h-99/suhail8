'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Package, AlertTriangle, Truck } from 'lucide-react';

export default function WarehousePage() {
  const { hasPermission } = useAuth();
  const { data, isLoading } = useQuery<any>({
    queryKey: ['warehouse'],
    queryFn: () => api.get('/specialized/warehouse').then(r => r.data),
    enabled: hasPermission('warehouse.inventory'),
  });

  if (!hasPermission('warehouse.inventory')) {
    return <div className="card text-center py-12 text-slate-600">هذه الصفحة لأمين المستودع فقط.</div>;
  }
  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">مساحة أمين المستودع</h1>
        <p className="text-slate-500 mt-1">جرد، استلام، صرف، وتصنيف اللوازم</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card">
          <Package size={20} className="text-blue-600 mb-2" />
          <div className="text-2xl font-bold">{data?.summary.totalAssets ?? 0}</div>
          <div className="text-xs text-slate-500">إجمالي اللوازم</div>
        </div>
        <div className="card">
          <Package size={20} className="text-purple-600 mb-2" />
          <div className="text-2xl font-bold">{data?.summary.categoriesCount ?? 0}</div>
          <div className="text-xs text-slate-500">عدد الفئات</div>
        </div>
        <div className="card">
          <Truck size={20} className="text-amber-600 mb-2" />
          <div className="text-2xl font-bold">{data?.summary.pendingDeliveries ?? 0}</div>
          <div className="text-xs text-slate-500">في انتظار التسليم</div>
        </div>
        <div className="card">
          <Package size={20} className="text-emerald-600 mb-2" />
          <div className="text-2xl font-bold">{Number(data?.summary.totalReceivedValue ?? 0).toLocaleString('ar-SA')}</div>
          <div className="text-xs text-slate-500">قيمة المستلَم (ر.س)</div>
        </div>
      </div>

      {/* Low stock alerts */}
      {data?.lowStockAlerts?.length > 0 && (
        <div className="card bg-amber-50 border-amber-200">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
            <AlertTriangle size={16} /> تنبيهات نفاد المخزون
          </h3>
          <ul className="text-sm text-amber-800 space-y-1 list-disc pr-4">
            {data.lowStockAlerts.map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Categories */}
      <section>
        <h3 className="text-sm font-semibold mb-3">📦 التصنيف حسب الفئة</h3>
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(data?.byCategory ?? {}).map(([cat, count]: any) => (
            <div key={cat} className="card text-center">
              <div className="text-xs text-slate-500">{cat}</div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending deliveries */}
      {data?.pendingDeliveries?.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">🚚 شحنات في انتظار الاستلام</h3>
          <div className="card p-0 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {data.pendingDeliveries.map((pr: any) => (
                <li key={pr.id} className="p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium text-sm">{pr.description}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {pr.number} · {pr.department?.nameAr}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-mono font-bold">{Number(pr.amount).toLocaleString('ar-SA')}</div>
                      <div className="text-xs text-slate-400">ر.س</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="card bg-slate-50">
        <h3 className="text-sm font-semibold mb-2">🔔 مهامي:</h3>
        <ul className="text-sm space-y-1 list-disc pr-4">
          <li>تصنيف اللوازم وتوقيرها وفقاً لأحدث الأساليب</li>
          <li>الجرد السنوي وتقديم تقارير بمجموع اللوازم</li>
          <li>حصر الاحتياجات اللازمة للموظفين</li>
          <li>استلام المواد التالفة وعمل الكشوفات</li>
        </ul>
      </div>
    </div>
  );
}
