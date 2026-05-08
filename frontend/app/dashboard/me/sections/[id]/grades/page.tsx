'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Save, AlertTriangle } from 'lucide-react';

export default function GradesPage() {
  const params = useParams();
  const sectionId = params.id as string;
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const { data: section, isLoading } = useQuery<any>({
    queryKey: ['section-grades', sectionId],
    queryFn: () => api.get(`/trainers/me/sections/${sectionId}`).then(r => r.data),
    enabled: !!user?.trainerId && !!sectionId,
  });

  useEffect(() => {
    if (!section?.enrollments) return;
    const initial: Record<string, string> = {};
    for (const e of section.enrollments) {
      initial[e.id] = e.grade !== null && e.grade !== undefined ? String(e.grade) : '';
    }
    setGrades(initial);
  }, [section]);

  const saveOne = useMutation({
    mutationFn: ({ enrollmentId, grade }: { enrollmentId: string; grade: number }) =>
      api.post(`/academic/enrollments/${enrollmentId}/grade`, { grade }),
    onSuccess: (_, vars) => {
      setSaved((s) => ({ ...s, [vars.enrollmentId]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [vars.enrollmentId]: false })), 1500);
      qc.invalidateQueries({ queryKey: ['section-grades', sectionId] });
    },
  });

  const handleBlur = (enrollmentId: string) => {
    const v = grades[enrollmentId];
    if (v === '' || v === undefined) return;
    const n = Number(v);
    if (isNaN(n) || n < 0 || n > 100) return;
    saveOne.mutate({ enrollmentId, grade: n });
  };

  const handlePaste = (e: React.ClipboardEvent, startIdx: number) => {
    const text = e.clipboardData.getData('text');
    const values = text.split(/[\n\t,]/).map((v) => v.trim()).filter(Boolean);
    if (values.length < 2) return;
    e.preventDefault();
    const enrollments = section?.enrollments ?? [];
    const updates: Record<string, string> = { ...grades };
    for (let i = 0; i < values.length && startIdx + i < enrollments.length; i++) {
      const enroll = enrollments[startIdx + i];
      const n = Number(values[i]);
      if (!isNaN(n) && n >= 0 && n <= 100) {
        updates[enroll.id] = String(n);
        saveOne.mutate({ enrollmentId: enroll.id, grade: n });
      }
    }
    setGrades(updates);
  };

  // إحصاءات
  const numericGrades = Object.values(grades).map(Number).filter((n) => !isNaN(n) && n > 0);
  const avg = numericGrades.length ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length : 0;
  const failing = numericGrades.filter((g) => g < 60).length;
  const distribution = {
    excellent: numericGrades.filter((g) => g >= 90).length,
    good: numericGrades.filter((g) => g >= 75 && g < 90).length,
    fair: numericGrades.filter((g) => g >= 60 && g < 75).length,
    failing,
  };
  const max = Math.max(distribution.excellent, distribution.good, distribution.fair, distribution.failing) || 1;

  if (!user?.trainerId) return <div className="card text-center py-12">للمدربين فقط.</div>;
  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">رصد الدرجات</h1>
        <div className="text-sm text-slate-500 mt-1">
          {section?.course?.nameAr} · {section?.term} · {section?.enrollments?.length ?? 0} متدرب
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Grid */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-2 text-right text-xs text-slate-500">الرقم</th>
                <th className="p-2 text-right text-xs text-slate-500">الاسم</th>
                <th className="p-2 text-right text-xs text-slate-500 w-32">الدرجة</th>
                <th className="p-2 text-right text-xs text-slate-500 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {(section?.enrollments ?? []).map((e: any, idx: number) => {
                const v = grades[e.id] ?? '';
                const numeric = Number(v);
                const isFailing = !isNaN(numeric) && v !== '' && numeric < 60;
                return (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2 text-xs font-mono text-slate-500">{e.trainee.studentNumber}</td>
                    <td className="p-2 font-medium text-sm">{e.trainee.fullNameAr}</td>
                    <td className="p-1">
                      <input
                        type="number" min={0} max={100} step="0.5"
                        className={`input py-1 text-center font-mono ${isFailing ? 'border-red-300 bg-red-50' : ''}`}
                        value={v}
                        onChange={(ev) => setGrades({ ...grades, [e.id]: ev.target.value })}
                        onBlur={() => handleBlur(e.id)}
                        onPaste={(ev) => handlePaste(ev, idx)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === 'Tab') {
                            handleBlur(e.id);
                            const next = document.querySelector<HTMLInputElement>(`input[data-row="${idx + 1}"]`);
                            if (next && ev.key === 'Enter') { ev.preventDefault(); next.focus(); }
                          }
                        }}
                        data-row={idx}
                      />
                    </td>
                    <td className="p-1 text-center">
                      {saved[e.id] && <Save size={14} className="text-emerald-600 mx-auto" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="bg-slate-50 px-3 py-2 text-xs text-slate-500 border-t">
            💡 الحفظ تلقائي عند الخروج من الخلية. ألصق من Excel: انسخ عمود الدرجات والصق في أي خلية.
          </div>
        </div>

        {/* Bell curve + warnings */}
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">توزيع الدرجات</h3>
            <div className="space-y-2">
              {[
                { key: 'excellent', label: 'ممتاز (90+)', color: 'bg-emerald-500', count: distribution.excellent },
                { key: 'good', label: 'جيد جداً (75-89)', color: 'bg-blue-500', count: distribution.good },
                { key: 'fair', label: 'مقبول (60-74)', color: 'bg-amber-500', count: distribution.fair },
                { key: 'failing', label: 'راسب (<60)', color: 'bg-red-500', count: distribution.failing },
              ].map((b) => (
                <div key={b.key}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span>{b.label}</span>
                    <span className="font-mono font-semibold">{b.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${b.color}`} style={{ width: `${(b.count / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
              <div>المتوسط: <strong>{avg.toFixed(1)}</strong></div>
              <div className="text-slate-500">المرصودون: {numericGrades.length}/{section?.enrollments?.length ?? 0}</div>
            </div>
          </div>

          {failing > numericGrades.length * 0.3 && numericGrades.length >= 5 && (
            <div className="card bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-amber-900">تنبيه:</strong>
                  <p className="text-amber-800 mt-1">
                    أكثر من ٣٠٪ من الفصل راسبون. هل تود مراجعة الاختبار قبل الإيداع؟
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
