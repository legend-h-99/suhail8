'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Printer } from 'lucide-react';
import '../print.css';

export default function KpiReportPage() {
  const { data: kpis = [] } = useQuery<any[]>({
    queryKey: ['rep-kpis-detailed'],
    queryFn: () => api.get('/quality/kpis').then(r => r.data).catch(() => []),
  });

  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-2xl font-bold">تقرير المؤشرات</h1>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer size={16} /> طباعة
        </button>
      </div>

      <article className="print-page bg-white p-8 rounded-lg shadow-sm border max-w-4xl mx-auto">
        <header className="text-center border-b border-slate-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold">تقرير مؤشرات الأداء</h1>
          <div className="text-sm text-slate-500 mt-2">كلية الاتصالات والمعلومات بالرياض — {today}</div>
        </header>

        <div className="space-y-4">
          {kpis.map((k: any) => {
            const last = k.measurements?.[0];
            const lastVal = last ? Number(last.value) : null;
            const target = k.target ? Number(k.target) : null;
            const pct = lastVal && target ? Math.min(100, (lastVal / target) * 100) : 0;
            const onTrack = lastVal !== null && target !== null && lastVal >= target * 0.9;

            return (
              <div key={k.id} className="border rounded p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-mono text-slate-400">{k.code}</div>
                    <div className="font-semibold">{k.nameAr}</div>
                  </div>
                  <span className={`badge ${onTrack ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {onTrack ? 'على المسار' : 'يحتاج متابعة'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                  <div><span className="text-slate-500">الهدف:</span> <strong>{target ?? '—'} {k.unit}</strong></div>
                  <div><span className="text-slate-500">القياس الحالي:</span> <strong>{lastVal ?? '—'}</strong></div>
                  <div><span className="text-slate-500">عدد القياسات:</span> <strong>{k.measurements?.length ?? 0}</strong></div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {k.measurements && k.measurements.length > 0 && (
                  <div className="mt-3 text-xs">
                    <div className="text-slate-500 mb-1">آخر القياسات:</div>
                    <div className="flex flex-wrap gap-2">
                      {k.measurements.slice(0, 6).reverse().map((m: any, i: number) => (
                        <span key={i} className="bg-slate-100 px-2 py-0.5 rounded">
                          {m.period}: {Number(m.value).toLocaleString('ar-SA')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}
