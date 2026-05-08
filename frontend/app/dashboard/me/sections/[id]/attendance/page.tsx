'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Check, X, Clock, FileText, ChevronRight } from 'lucide-react';

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: any }> = {
  PRESENT: { label: 'حاضر', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: Check },
  ABSENT: { label: 'غائب', color: 'text-red-700', bg: 'bg-red-100', icon: X },
  LATE: { label: 'متأخر', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  EXCUSED: { label: 'بعذر', color: 'text-blue-700', bg: 'bg-blue-100', icon: FileText },
};

interface Roster {
  enrollmentId: string;
  trainee: { id: string; fullNameAr: string; studentNumber: string };
  attendance: { status: Status } | null;
}

export default function AttendancePage() {
  const params = useParams();
  const sectionId = params.id as string;
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [saved, setSaved] = useState(false);

  const { data: roster = [], isLoading } = useQuery<Roster[]>({
    queryKey: ['attendance-roster', sectionId, date],
    queryFn: () => api.get(`/academic/attendance/section/${sectionId}?date=${date}`).then(r => r.data),
    enabled: !!sectionId && !!date,
  });

  // افتراضياً كل واحد حاضر، إلا اللي مرصود سابقاً
  useEffect(() => {
    const initial: Record<string, Status> = {};
    for (const r of roster) {
      initial[r.enrollmentId] = (r.attendance?.status as Status) ?? 'PRESENT';
    }
    setMarks(initial);
    setSaved(false);
  }, [roster, date]);

  const saveMutation = useMutation({
    mutationFn: () => api.post(`/academic/attendance/section/${sectionId}`, {
      date,
      entries: Object.entries(marks).map(([enrollmentId, status]) => ({ enrollmentId, status })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-roster', sectionId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const cycleStatus = (enrollmentId: string) => {
    const cur = marks[enrollmentId] ?? 'PRESENT';
    const next: Status = cur === 'PRESENT' ? 'ABSENT' : cur === 'ABSENT' ? 'LATE' : cur === 'LATE' ? 'EXCUSED' : 'PRESENT';
    setMarks({ ...marks, [enrollmentId]: next });
  };

  const counts = {
    PRESENT: Object.values(marks).filter(s => s === 'PRESENT').length,
    ABSENT: Object.values(marks).filter(s => s === 'ABSENT').length,
    LATE: Object.values(marks).filter(s => s === 'LATE').length,
    EXCUSED: Object.values(marks).filter(s => s === 'EXCUSED').length,
  };

  if (!user?.trainerId) return <div className="card text-center py-12">للمدربين فقط.</div>;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">رصد الحضور</h1>
          <input type="date" className="input max-w-xs" value={date}
            onChange={(e) => setDate(e.target.value)} />
        </div>
      </header>

      {/* Counts strip */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className={`rounded-lg p-2 ${cfg.bg}`}>
              <div className={`text-xs ${cfg.color}`}>{cfg.label}</div>
              <div className={`text-xl font-bold ${cfg.color}`}>{counts[s]}</div>
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <div className="text-xs text-slate-500 bg-slate-50 rounded p-2 text-center">
        💡 اضغط على المتدرب لتدوير حالته: حاضر ← غائب ← متأخر ← بعذر ← حاضر
      </div>

      {/* Students list */}
      {isLoading ? (
        <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {roster.length === 0 ? (
            <div className="text-slate-500 text-center py-12">لا يوجد متدربون.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {roster.map((r) => {
                const status = marks[r.enrollmentId] ?? 'PRESENT';
                const cfg = STATUS_CONFIG[status];
                const Icon = cfg.icon;
                return (
                  <li key={r.enrollmentId}>
                    <button
                      onClick={() => cycleStatus(r.enrollmentId)}
                      className="w-full flex items-center gap-3 py-3 px-4 hover:bg-slate-50 active:bg-slate-100 transition text-right"
                    >
                      <div className={`h-10 w-10 rounded-full ${cfg.bg} grid place-items-center ${cfg.color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{r.trainee.fullNameAr}</div>
                        <div className="text-xs text-slate-500 font-mono">{r.trainee.studentNumber}</div>
                      </div>
                      <span className={`badge ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Sticky save */}
      <div className="sticky bottom-4 z-10">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || roster.length === 0}
          className={`w-full btn-primary py-3 text-base shadow-lg ${saved ? 'bg-emerald-600' : ''}`}
        >
          {saveMutation.isPending ? 'جارٍ الحفظ...' : saved ? '✓ تم الحفظ' : `حفظ الحضور (${roster.length})`}
        </button>
      </div>
    </div>
  );
}
