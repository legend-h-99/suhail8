'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DataTable, Column } from '@/components/DataTable';

interface Visit {
  id: string;
  visitDate: string;
  rating: string;
  observations: string;
  recommendations?: string;
  status: string;
  followUpAt?: string;
  department?: { nameAr: string };
}

export default function MyVisitsPage() {
  const user = useAuth((s) => s.user);

  const { data = [], isLoading } = useQuery<Visit[]>({
    queryKey: ['my-visits'],
    queryFn: () => api.get('/supervision-visits/me').then(r => r.data),
    enabled: !!user?.trainerId,
  });

  if (!user?.trainerId) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-600 mb-2">حسابك غير مرتبط بسجل مدرب.</p>
        <p className="text-sm text-slate-500">
          هذه الصفحة مخصصة للمدربين فقط. تواصل مع وكيل شؤون المدربين لإنشاء سجلك.
        </p>
      </div>
    );
  }

  const cols: Column<Visit>[] = [
    { header: 'التاريخ', render: (v) => new Date(v.visitDate).toLocaleDateString('ar-SA') },
    { header: 'التقييم', render: (v) => {
      const r = Number(v.rating);
      return (
        <span className={`font-mono font-semibold ${r >= 4 ? 'text-emerald-600' : r >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
          {r.toFixed(1)} / 5.0
        </span>
      );
    }},
    { header: 'الملاحظات', render: (v) => <span className="text-sm text-slate-700 line-clamp-2">{v.observations}</span> },
    { header: 'التوصيات', render: (v) => v.recommendations ? <span className="text-sm">{v.recommendations}</span> : '—' },
    { header: 'الحالة', render: (v) => (
      <span className={`badge ${v.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {v.status === 'CLOSED' ? 'مغلقة' : v.status === 'FOLLOW_UP_NEEDED' ? 'تحتاج متابعة' : 'مسجلة'}
      </span>
    )},
  ];

  const avg = data.length ? data.reduce((s, v) => s + Number(v.rating), 0) / data.length : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">تقييماتي الإشرافية</h1>
        <p className="text-slate-500 mt-1">{data.length} زيارة • متوسط التقييم: {avg.toFixed(2)}/5</p>
      </header>

      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="text-xs text-slate-500">آخر زيارة</div>
            <div className="text-lg font-semibold mt-1">
              {new Date(data[0].visitDate).toLocaleDateString('ar-SA')}
            </div>
          </div>
          <div className="card">
            <div className="text-xs text-slate-500">المتوسط العام</div>
            <div className="text-lg font-semibold mt-1">{avg.toFixed(2)} / 5</div>
          </div>
          <div className="card">
            <div className="text-xs text-slate-500">تحتاج متابعة</div>
            <div className="text-lg font-semibold mt-1">
              {data.filter((v) => v.status === 'FOLLOW_UP_NEEDED').length}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <DataTable data={data} columns={cols} loading={isLoading} empty="لم يتم تسجيل زيارات لك بعد." />
      </div>
    </div>
  );
}
