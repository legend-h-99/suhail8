'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Printer } from 'lucide-react';
import '../print.css';

export default function QuarterlyReportPage() {
  const user = useAuth((s) => s.user);

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['rep-employees'],
    queryFn: () => api.get('/hr/employees/directory').then(r => r.data),
  });
  const { data: leaves = [] } = useQuery<any[]>({
    queryKey: ['rep-leaves'],
    queryFn: () => api.get('/hr/leaves').then(r => r.data).catch(() => []),
  });
  const { data: trainees = [] } = useQuery<any[]>({
    queryKey: ['rep-trainees'],
    queryFn: () => api.get('/trainees').then(r => r.data).catch(() => []),
  });
  const { data: visits = [] } = useQuery<any[]>({
    queryKey: ['rep-visits'],
    queryFn: () => api.get('/supervision-visits').then(r => r.data).catch(() => []),
  });
  const { data: kpis = [] } = useQuery<any[]>({
    queryKey: ['rep-kpis'],
    queryFn: () => api.get('/quality/kpis').then(r => r.data).catch(() => []),
  });

  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const quarter = Math.floor((new Date().getMonth()) / 3) + 1;
  const year = new Date().getFullYear();

  const approvedLeaves = leaves.filter((l: any) => l.status === 'APPROVED').length;
  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
  const activeTrainees = trainees.filter((t: any) => t.status === 'ACTIVE').length;
  const warnedTrainees = trainees.filter((t: any) => t.status === 'WARNED' || (t.warnings && t.warnings.length > 0)).length;
  const avgVisitRating = visits.length
    ? visits.reduce((s: number, v: any) => s + Number(v.rating || 0), 0) / visits.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التقرير الفصلي</h1>
          <p className="text-slate-500 mt-1">Q{quarter} - {year}</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer size={16} /> طباعة / حفظ PDF
        </button>
      </div>

      <article className="print-page bg-white p-8 rounded-lg shadow-sm border max-w-4xl mx-auto">
        <header className="text-center border-b border-slate-300 pb-4 mb-6">
          <div className="text-sm text-slate-500">المؤسسة العامة للتدريب التقني والمهني</div>
          <h1 className="text-2xl font-bold mt-1">كلية الاتصالات والمعلومات بالرياض</h1>
          <h2 className="text-lg mt-3">التقرير الفصلي — Q{quarter} لعام {year}</h2>
          <div className="text-sm text-slate-500 mt-2">{today}</div>
        </header>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-slate-200 pb-1">١. ملخص تنفيذي</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            خلال هذا الفصل، استمرت الكلية في تنفيذ خطتها التشغيلية بمنسوبيها البالغ عددهم <strong>{employees.length}</strong> موظفاً
            و <strong>{activeTrainees}</strong> متدرباً نشطاً. تم اعتماد <strong>{approvedLeaves}</strong> طلب إجازة،
            و إجراء <strong>{visits.length}</strong> زيارة إشرافية بمتوسط تقييم <strong>{avgVisitRating.toFixed(2)}/5</strong>.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-slate-200 pb-1">٢. مؤشرات الأداء الرئيسية</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-right">المؤشر</th>
                <th className="p-2 text-right">الهدف</th>
                <th className="p-2 text-right">آخر قياس</th>
                <th className="p-2 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((k: any) => {
                const last = k.measurements?.[0];
                const lastVal = last ? Number(last.value) : null;
                const target = k.target ? Number(k.target) : null;
                const onTrack = lastVal !== null && target !== null && lastVal >= target * 0.9;
                return (
                  <tr key={k.id} className="border-b border-slate-100">
                    <td className="p-2 font-medium">{k.nameAr}</td>
                    <td className="p-2 font-mono">{target ?? '—'} {k.unit}</td>
                    <td className="p-2 font-mono">{lastVal ?? '—'}</td>
                    <td className="p-2">
                      <span className={`badge ${onTrack ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {onTrack ? '✓ على المسار' : 'يحتاج تحسين'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {kpis.length === 0 && (
                <tr><td colSpan={4} className="p-3 text-center text-slate-400">لا توجد مؤشرات.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-slate-200 pb-1">٣. الموارد البشرية</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">إجمالي الموظفين</div>
              <div className="text-2xl font-bold mt-1">{employees.length}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">إجازات معتمدة</div>
              <div className="text-2xl font-bold mt-1">{approvedLeaves}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">إجازات قيد المراجعة</div>
              <div className="text-2xl font-bold mt-1">{pendingLeaves}</div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-slate-200 pb-1">٤. شؤون المتدربين</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">منتظمون</div>
              <div className="text-2xl font-bold mt-1">{activeTrainees}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">عليهم إنذارات</div>
              <div className="text-2xl font-bold mt-1 text-amber-600">{warnedTrainees}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">إجمالي مسجل</div>
              <div className="text-2xl font-bold mt-1">{trainees.length}</div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-slate-200 pb-1">٥. الإشراف على المدربين</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">عدد الزيارات الإشرافية</div>
              <div className="text-2xl font-bold mt-1">{visits.length}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">متوسط التقييم</div>
              <div className="text-2xl font-bold mt-1">{avgVisitRating.toFixed(2)}/5</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-slate-500 text-xs">تحتاج متابعة</div>
              <div className="text-2xl font-bold mt-1 text-amber-600">
                {visits.filter((v: any) => v.status === 'FOLLOW_UP_NEEDED').length}
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-300 pt-4 mt-8">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <div className="text-slate-500 mb-12">معد التقرير:</div>
              <div className="border-t border-slate-400 pt-1">{user?.fullNameAr ?? '—'}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-12">اعتماد العميد:</div>
              <div className="border-t border-slate-400 pt-1">د. خالد بن سعد العتيبي</div>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
