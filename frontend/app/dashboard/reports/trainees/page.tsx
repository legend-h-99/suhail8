'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Printer } from 'lucide-react';
import '../print.css';

export default function TraineesReportPage() {
  const { data: trainees = [] } = useQuery<any[]>({
    queryKey: ['rep-trainees-detailed'],
    queryFn: () => api.get('/trainees').then(r => r.data).catch(() => []),
  });

  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const byStatus: Record<string, number> = {};
  trainees.forEach((t: any) => { byStatus[t.status] = (byStatus[t.status] ?? 0) + 1; });
  const byProgram: Record<string, number> = {};
  trainees.forEach((t: any) => {
    const k = t.program?.nameAr ?? '— غير محدد —';
    byProgram[k] = (byProgram[k] ?? 0) + 1;
  });
  const withWarnings = trainees.filter((t: any) => t.warnings && t.warnings.length > 0);

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-2xl font-bold">تقرير المتدربين</h1>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer size={16} /> طباعة
        </button>
      </div>

      <article className="print-page bg-white p-8 rounded-lg shadow-sm border max-w-4xl mx-auto">
        <header className="text-center border-b border-slate-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold">تقرير شؤون المتدربين</h1>
          <div className="text-sm text-slate-500 mt-2">كلية الاتصالات والمعلومات بالرياض — {today}</div>
        </header>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3">١. التوزيع حسب الحالة</h3>
          <table className="w-full text-sm border">
            <thead className="bg-slate-100"><tr><th className="p-2 text-right">الحالة</th><th className="p-2 text-right">العدد</th></tr></thead>
            <tbody>
              {Object.entries(byStatus).map(([s, n]) => (
                <tr key={s} className="border-b"><td className="p-2">{s}</td><td className="p-2 font-mono">{n}</td></tr>
              ))}
              <tr className="font-semibold bg-slate-50"><td className="p-2">الإجمالي</td><td className="p-2 font-mono">{trainees.length}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3">٢. التوزيع حسب البرنامج</h3>
          <table className="w-full text-sm border">
            <thead className="bg-slate-100"><tr><th className="p-2 text-right">البرنامج</th><th className="p-2 text-right">العدد</th></tr></thead>
            <tbody>
              {Object.entries(byProgram).map(([p, n]) => (
                <tr key={p} className="border-b"><td className="p-2">{p}</td><td className="p-2 font-mono">{n}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3">٣. المتدربون عليهم إنذارات أكاديمية ({withWarnings.length})</h3>
          {withWarnings.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد إنذارات حالية.</p>
          ) : (
            <table className="w-full text-sm border">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-right">الرقم</th>
                  <th className="p-2 text-right">الاسم</th>
                  <th className="p-2 text-right">البرنامج</th>
                  <th className="p-2 text-right">عدد الإنذارات</th>
                </tr>
              </thead>
              <tbody>
                {withWarnings.map((t: any) => (
                  <tr key={t.id} className="border-b">
                    <td className="p-2 font-mono text-xs">{t.studentNumber}</td>
                    <td className="p-2">{t.fullNameAr}</td>
                    <td className="p-2">{t.program?.nameAr ?? '—'}</td>
                    <td className="p-2 font-mono">{t.warnings.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </article>
    </div>
  );
}
