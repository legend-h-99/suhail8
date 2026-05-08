'use client';

import { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  empty?: string;
}

export function DataTable<T extends { id?: string }>({ data, columns, loading, empty = 'لا توجد بيانات' }: DataTableProps<T>) {
  if (loading) return <div className="text-slate-500 py-8 text-center">جارٍ التحميل...</div>;
  if (!data.length) return <div className="text-slate-500 py-12 text-center">{empty}</div>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className={`px-4 py-3 text-right text-xs font-semibold text-slate-700 ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row, i) => (
            <tr key={row.id ?? i} className="hover:bg-slate-50">
              {columns.map((c, j) => (
                <td key={j} className={`px-4 py-3 text-sm text-slate-700 ${c.className ?? ''}`}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
