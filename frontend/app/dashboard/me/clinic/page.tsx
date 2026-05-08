'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Stethoscope, Activity, Heart } from 'lucide-react';

export default function ClinicPage() {
  const { hasPermission } = useAuth();
  const { data, isLoading } = useQuery<any>({
    queryKey: ['clinic'],
    queryFn: () => api.get('/specialized/clinic').then(r => r.data),
    enabled: hasPermission('clinic.examine'),
  });

  if (!hasPermission('clinic.examine')) {
    return <div className="card text-center py-12 text-slate-600">هذه الصفحة لطبيب العيادة فقط.</div>;
  }
  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">مساحة طبيب العيادة</h1>
        <p className="text-slate-500 mt-1">الفحوصات، الزيارات، والوعي الصحي</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <div className="card bg-blue-50 border-blue-200">
          <Stethoscope size={20} className="text-blue-700 mb-2" />
          <div className="text-2xl font-bold text-blue-900">{data?.summary.thisWeekVisits ?? 0}</div>
          <div className="text-xs text-blue-700">زيارات هذا الأسبوع</div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200">
          <Activity size={20} className="text-emerald-700 mb-2" />
          <div className="text-2xl font-bold text-emerald-900">{data?.summary.totalVisits ?? 0}</div>
          <div className="text-xs text-emerald-700">إجمالي الزيارات</div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <Heart size={20} className="text-red-700 mb-2" />
          <div className="text-2xl font-bold text-red-900">
            {data?.recentVisits?.filter((v: any) => v.diagnosis?.includes('سكر') || v.diagnosis?.includes('ضغط')).length ?? 0}
          </div>
          <div className="text-xs text-red-700">حالات مزمنة</div>
        </div>
      </div>

      {/* By patient type */}
      {data?.byPatientType?.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">📊 توزيع المراجعين</h3>
          <div className="grid grid-cols-3 gap-3">
            {data.byPatientType.map((t: any) => (
              <div key={t.type} className="card text-center">
                <div className="text-2xl font-bold">{t.count}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {t.type === 'employee' ? 'موظفون' : t.type === 'trainee' ? 'متدربون' : 'زوار'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent visits */}
      <section>
        <h3 className="text-sm font-semibold mb-3">🩺 الزيارات الأخيرة</h3>
        <div className="card p-0 overflow-hidden">
          {data?.recentVisits?.length === 0 ? (
            <div className="text-slate-400 text-center py-8 text-sm">لا توجد زيارات.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data?.recentVisits?.slice(0, 10).map((v: any) => (
                <li key={v.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-slate-500">
                        {new Date(v.visitDate).toLocaleDateString('ar-SA')}
                      </div>
                      <div className="font-medium text-sm mt-0.5">
                        {v.symptoms ? `الأعراض: ${v.symptoms}` : 'فحص دوري'}
                      </div>
                      {v.diagnosis && <div className="text-xs text-slate-600 mt-0.5">التشخيص: {v.diagnosis}</div>}
                    </div>
                    <span className="badge bg-slate-100 text-xs">{v.patientType}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="card bg-slate-50">
        <h3 className="text-sm font-semibold mb-2">🔔 مهامي:</h3>
        <ul className="text-sm space-y-1 list-disc pr-4">
          <li>الكشف على الحالات المرضية لمنسوبي المنشأة (متدربين، مدربين، موظفين)</li>
          <li>جولات تفقدية لكشف الأمراض غير المكتشفة (ضغط، سكر، …)</li>
          <li>طلب الأدوية والأجهزة والعلاجات حسب الحالات المتردّدة</li>
          <li>عمل دورات إسعافية ومحاضرات تثقيفية</li>
          <li>تحويل المرضى للمستشفى عند الحاجة</li>
        </ul>
      </div>
    </div>
  );
}
