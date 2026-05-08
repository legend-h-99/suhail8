'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Warehouse, RefreshCw } from 'lucide-react';

export default function DataWarehousePage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [factName, setFactName] = useState('');

  const { data: facts = [] } = useQuery<any[]>({
    queryKey: ['warehouse-facts', factName],
    queryFn: () => api.get(`/data/warehouse${factName ? `?factName=${factName}` : ''}`).then(r => r.data),
  });

  const compute = useMutation({
    mutationFn: () => {
      const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      return api.post('/data/warehouse/compute', { period }).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouse-facts'] }),
  });

  const factTypes = ['fact_tasks', 'fact_attendance', 'fact_finance', 'fact_quality', 'fact_reports'];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Warehouse /> Data Warehouse
          </h1>
          <p className="text-slate-500 mt-1">{facts.length} فاكت مُحسبة</p>
        </div>
        {hasPermission('data_processing.manage') && (
          <button onClick={() => compute.mutate()} disabled={compute.isPending}
            className="btn-primary flex items-center gap-1">
            <RefreshCw size={14} className={compute.isPending ? 'animate-spin' : ''} />
            احسب الآن
          </button>
        )}
      </header>

      {/* Fact filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFactName('')}
          className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${!factName ? 'bg-primary text-white' : 'bg-white border'}`}>
          الكل
        </button>
        {factTypes.map((f) => (
          <button key={f} onClick={() => setFactName(f)}
            className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${factName === f ? 'bg-primary text-white' : 'bg-white border'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Latest facts */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {facts.length === 0 ? (
          <div className="col-span-full card text-center py-12 text-slate-400">
            لا توجد فاكتس مُحسبة. اضغط "احسب الآن" لتشغيل ETL.
          </div>
        ) : facts.slice(0, 12).map((f: any) => (
          <div key={f.id} className="card">
            <div className="text-xs font-mono text-slate-400">{f.factName}</div>
            <div className="font-semibold mt-1">{f.period}</div>
            <pre className="text-xs bg-slate-50 p-2 mt-2 rounded overflow-x-auto">
              {JSON.stringify(f.measures, null, 2)}
            </pre>
            <div className="text-xs text-slate-500 mt-2">
              {new Date(f.computedAt).toLocaleString('ar-SA')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
