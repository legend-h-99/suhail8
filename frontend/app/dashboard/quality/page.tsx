'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface KpiMeasurement { period: string; value: string; }
interface Kpi {
  id: string;
  code: string;
  nameAr: string;
  unit?: string;
  target?: string;
  frequency: string;
  measurements: KpiMeasurement[];
}

export default function QualityPage() {
  const { data: kpis = [], isLoading } = useQuery<Kpi[]>({
    queryKey: ['kpis'],
    queryFn: () => api.get('/quality/kpis').then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">الجودة والمؤشرات</h1>
        <p className="text-slate-500 mt-1">{kpis.length} مؤشر أداء</p>
      </header>

      {isLoading ? (
        <div className="text-slate-500">جارٍ التحميل...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((k) => {
            const last = k.measurements[0];
            const lastVal = last ? Number(last.value) : null;
            const target = k.target ? Number(k.target) : null;
            const pct = lastVal && target ? Math.min(100, (lastVal / target) * 100) : 0;
            const onTrack = lastVal !== null && target !== null && lastVal >= target * 0.9;

            return (
              <div key={k.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-mono text-slate-400">{k.code}</div>
                    <div className="font-semibold">{k.nameAr}</div>
                  </div>
                  <span className="badge bg-slate-100 text-slate-600 text-[10px]">{k.frequency}</span>
                </div>

                <div className="my-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {lastVal !== null ? lastVal.toLocaleString('ar-SA') : '—'}
                    </span>
                    <span className="text-slate-500 text-sm">{k.unit ?? ''}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    الهدف: {target?.toLocaleString('ar-SA') ?? '—'} {k.unit}
                  </div>
                </div>

                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {k.measurements.length} قياس مسجّل
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
