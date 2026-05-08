'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Check, X } from 'lucide-react';
import '../../reports/print.css';

interface MatrixData {
  modules: string[];
  permissionsByModule: Record<string, { id: string; code: string; nameAr: string }[]>;
  roles: { code: string; nameAr: string; scope: string; userCount: number; permissionCount: number; permissionIds: string[] }[];
  totals: { roles: number; permissions: number; modules: number };
}

export default function RoleMatrixPage() {
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useQuery<MatrixData>({
    queryKey: ['role-matrix'],
    queryFn: () => api.get('/roles/matrix').then(r => r.data),
  });

  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;
  if (!data) return null;

  const filteredModules = filter
    ? data.modules.filter((m) => m.includes(filter))
    : data.modules;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold">مصفوفة الأدوار والصلاحيات (RACI)</h1>
          <p className="text-slate-500 mt-1">
            {data.totals.roles} دور × {data.totals.permissions} صلاحية في {data.totals.modules} وحدة
          </p>
        </div>
        <div className="flex gap-2">
          <input className="input max-w-xs" placeholder="فلتر بالوحدة..." value={filter}
            onChange={(e) => setFilter(e.target.value)} />
          <button onClick={() => window.print()} className="btn-secondary">طباعة</button>
        </div>
      </header>

      {/* Roles summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.roles.map((r) => (
          <div key={r.code} className="card">
            <div className="text-xs font-mono text-slate-400">{r.code}</div>
            <div className="font-semibold mt-1 text-sm">{r.nameAr}</div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span>👥 {r.userCount}</span>
              <span>🔑 {r.permissionCount}</span>
              <span className="badge bg-slate-100 text-[10px]">{r.scope}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Matrix per module */}
      {filteredModules.map((module) => {
        const perms = data.permissionsByModule[module] ?? [];
        return (
          <section key={module} className="card overflow-x-auto print-page">
            <h2 className="font-bold mb-3 sticky right-0">📦 {module}</h2>
            <table className="w-full text-xs min-w-max">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-right sticky right-0 bg-slate-50 z-10 min-w-[200px]">الصلاحية</th>
                  {data.roles.map((r) => (
                    <th key={r.code} className="p-1 text-center" style={{ minWidth: 70 }}>
                      <div className="text-[10px] font-mono whitespace-nowrap">{r.code}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perms.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="p-2 sticky right-0 bg-white">
                      <div className="font-medium text-xs">{p.nameAr}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.code}</div>
                    </td>
                    {data.roles.map((r) => {
                      const has = r.permissionIds.includes(p.id);
                      return (
                        <td key={r.code} className="p-1 text-center">
                          {has ? (
                            <Check size={14} className="mx-auto text-emerald-600" strokeWidth={3} />
                          ) : (
                            <span className="text-slate-200 text-xs">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
