'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Eye, AlertCircle, Clock, Users } from 'lucide-react';

export default function MonitoringPage() {
  const { hasPermission } = useAuth();
  const { data, isLoading } = useQuery<any>({
    queryKey: ['monitoring'],
    queryFn: () => api.get('/specialized/monitoring').then(r => r.data),
    enabled: hasPermission('monitoring.tour'),
  });

  if (!hasPermission('monitoring.tour')) {
    return <div className="card text-center py-12 text-slate-600">هذه الصفحة لمراقب الرقابة فقط.</div>;
  }
  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">مساحة مراقب الرقابة</h1>
        <p className="text-slate-500 mt-1">الجولات، الحضور، والملاحظات</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card bg-emerald-50 border-emerald-200">
          <Users size={20} className="text-emerald-700 mb-2" />
          <div className="text-2xl font-bold text-emerald-900">{data?.summary.todayPresent ?? 0}</div>
          <div className="text-xs text-emerald-700">حاضر اليوم</div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <AlertCircle size={20} className="text-red-700 mb-2" />
          <div className="text-2xl font-bold text-red-900">{data?.summary.todayAbsent ?? 0}</div>
          <div className="text-xs text-red-700">غائب اليوم</div>
        </div>
        <div className="card bg-amber-50 border-amber-200">
          <Clock size={20} className="text-amber-700 mb-2" />
          <div className="text-2xl font-bold text-amber-900">{data?.summary.todayLate ?? 0}</div>
          <div className="text-xs text-amber-700">متأخر اليوم</div>
        </div>
        <div className="card bg-slate-50">
          <Eye size={20} className="text-slate-700 mb-2" />
          <div className="text-2xl font-bold">{data?.summary.recentIncidents ?? 0}</div>
          <div className="text-xs text-slate-600">حوادث الأسبوع</div>
        </div>
      </div>

      {/* Week attendance */}
      {data?.weekAttendanceCounts && (
        <section>
          <h3 className="text-sm font-semibold mb-3">📊 حضور الأسبوع</h3>
          <div className="card">
            <div className="space-y-2">
              {Object.entries(data.weekAttendanceCounts).map(([status, count]: any) => {
                const labels: Record<string, string> = {
                  PRESENT: 'حاضر', ABSENT: 'غائب', LATE: 'متأخر', LEAVE: 'إجازة', OFF: 'عطلة',
                };
                const colors: Record<string, string> = {
                  PRESENT: 'bg-emerald-500', ABSENT: 'bg-red-500', LATE: 'bg-amber-500', LEAVE: 'bg-blue-500', OFF: 'bg-slate-400',
                };
                const total = Object.values(data.weekAttendanceCounts).reduce((s: number, n: any) => s + Number(n), 0);
                const pct = total > 0 ? (Number(count) / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{labels[status] ?? status}</span>
                      <span className="font-mono">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${colors[status] ?? 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent incidents */}
      <section>
        <h3 className="text-sm font-semibold mb-3">⚠️ حوادث أمنية حديثة</h3>
        <div className="card p-0 overflow-hidden">
          {data?.recentIncidents?.length === 0 ? (
            <div className="text-slate-400 text-center py-8 text-sm">لا توجد حوادث ✅</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data?.recentIncidents?.map((inc: any) => (
                <li key={inc.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-slate-500">
                        {new Date(inc.occurredAt).toLocaleString('ar-SA')}
                      </div>
                      <div className="font-medium text-sm mt-0.5">{inc.type}: {inc.description}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{inc.location}</div>
                    </div>
                    <span className={`badge ${inc.severity === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      {inc.severity}
                    </span>
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
          <li>إعداد خطة سنوية لأعمال المتابعة وجولات رقابية</li>
          <li>التأكد من جاهزية أجهزة البصمة بالتنسيق مع الدعم الفني</li>
          <li>تنفيذ إجراءات مراقبة انتظام الحضور والتواجد</li>
          <li>الرفع بالملاحظات المتعلقة بالنظافة والصيانة</li>
          <li>تزويد إدارة الشؤون ببيانات الغياب لاتخاذ الإجراءات</li>
          <li>أخذ جولات دورية على المحاضرات لمعاينة عملية الانضباط</li>
        </ul>
      </div>
    </div>
  );
}
