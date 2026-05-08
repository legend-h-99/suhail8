'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Database, FileJson, Image, FileText, Archive } from 'lucide-react';

const CAT_LABEL: Record<string, { label: string; icon: any; color: string }> = {
  RAW: { label: 'بيانات خام', icon: Database, color: 'text-slate-600 bg-slate-100' },
  PROCESSED: { label: 'معالجة', icon: FileJson, color: 'text-blue-700 bg-blue-50' },
  ANALYTICS: { label: 'تحليلية', icon: FileText, color: 'text-emerald-700 bg-emerald-50' },
  ARCHIVE: { label: 'مؤرشفة', icon: Archive, color: 'text-amber-700 bg-amber-50' },
  AI_TRAINING: { label: 'تدريب AI', icon: Image, color: 'text-purple-700 bg-purple-50' },
};

export default function DataLakePage() {
  const [category, setCategory] = useState('');

  const { data: files = [], isLoading } = useQuery<any[]>({
    queryKey: ['data-lake', category],
    queryFn: () => api.get(`/data/lake${category ? `?category=${category}` : ''}`).then(r => r.data),
  });

  const stats = files.reduce((acc: any, f) => {
    acc[f.category] = (acc[f.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database /> Data Lake
        </h1>
        <p className="text-slate-500 mt-1">تخزين الملفات الخام، المعالجة، والمؤرشفة</p>
      </header>

      {/* Category counters */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(CAT_LABEL).map(([k, v]) => {
          const Icon = v.icon;
          return (
            <button key={k} onClick={() => setCategory(category === k ? '' : k)}
              className={`card text-center hover:scale-[1.02] transition ${category === k ? 'border-primary border-2' : ''}`}>
              <Icon size={20} className={`mx-auto mb-1 ${v.color.split(' ')[0]}`} />
              <div className="text-2xl font-bold">{stats[k] ?? 0}</div>
              <div className="text-xs text-slate-500">{v.label}</div>
            </button>
          );
        })}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
        ) : files.length === 0 ? (
          <div className="text-slate-400 text-center py-12">
            لا توجد ملفات في البحيرة بعد. الملفات المرفوعة في النظام (محاضر، تقارير، شواهد) ستُسجَّل هنا.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-right text-xs">الاسم</th>
                  <th className="p-2 text-right text-xs">الفئة</th>
                  <th className="p-2 text-right text-xs">المصدر</th>
                  <th className="p-2 text-right text-xs">النوع</th>
                  <th className="p-2 text-right text-xs">الحجم</th>
                  <th className="p-2 text-right text-xs">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => {
                  const cfg = CAT_LABEL[f.category] ?? CAT_LABEL.RAW;
                  return (
                    <tr key={f.id} className="border-t border-slate-100">
                      <td className="p-2 font-medium">{f.name}</td>
                      <td className="p-2"><span className={`badge ${cfg.color}`}>{cfg.label}</span></td>
                      <td className="p-2 text-xs text-slate-500">{f.source}</td>
                      <td className="p-2 text-xs">{f.mimeType ?? '—'}</td>
                      <td className="p-2 font-mono text-xs">{f.size ? `${(f.size / 1024).toFixed(1)} KB` : '—'}</td>
                      <td className="p-2 text-xs text-slate-500">{new Date(f.createdAt).toLocaleDateString('ar-SA')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
