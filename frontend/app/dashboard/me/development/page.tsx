'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { TrendingUp, Award } from 'lucide-react';

interface DevPlan {
  id: string;
  year: string;
  goals: any;
  progress: string;
  status: string;
}

export default function DevelopmentPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);

  const { data: plans = [], isLoading } = useQuery<DevPlan[]>({
    queryKey: ['my-development'],
    queryFn: () => api.get('/trainers/me/development').then(r => r.data),
    enabled: !!user?.trainerId,
  });

  const currentYear = String(new Date().getFullYear());
  const current = plans.find((p) => p.year === currentYear);
  const goals = (current?.goals as any[]) ?? [];

  const update = useMutation({
    mutationFn: (data: { goals: any[]; progress?: number }) =>
      api.patch('/trainers/me/development', { year: currentYear, ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-development'] }),
  });

  const [newGoal, setNewGoal] = useState('');

  if (!user?.trainerId) return <div className="card text-center py-12">للمدربين فقط.</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">خطة تطويري المهني</h1>
        <p className="text-slate-500 mt-1">{currentYear}</p>
      </header>

      {/* Progress card */}
      <div className="card bg-gradient-to-bl from-primary-700 to-primary-800 text-white">
        <div className="flex items-center gap-4">
          <Award size={36} />
          <div>
            <div className="text-sm opacity-80">تقدّمي هذا العام</div>
            <div className="text-3xl font-bold mt-1">{current?.progress ?? '0'}%</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${current?.progress ?? 0}%` }} />
        </div>
        <div className="text-xs opacity-75 mt-2">
          الهدف السنوي: ٢٤ ساعة تدريب وتطوير مهني
        </div>
      </div>

      {/* Goals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">أهدافي ({goals.length})</h3>
          <input type="number" min={0} max={100}
            value={current?.progress ?? 0}
            onChange={(e) => update.mutate({ goals, progress: Number(e.target.value) })}
            className="input max-w-[100px] text-center"
            placeholder="%" />
        </div>

        {isLoading ? (
          <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
        ) : goals.length === 0 ? (
          <div className="card text-center text-slate-400 py-8 text-sm">
            لا أهداف بعد. أضف أول هدف أدناه.
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map((g: any, i: number) => (
              <div key={i} className="card flex items-center gap-3">
                <TrendingUp size={16} className="text-primary shrink-0" />
                <span className="flex-1 text-sm">{g.ar ?? g.title ?? JSON.stringify(g)}</span>
                <button onClick={() => update.mutate({ goals: goals.filter((_: any, j: number) => j !== i) })}
                  className="text-slate-400 hover:text-red-500 text-xs">حذف</button>
              </div>
            ))}
          </div>
        )}

        <div className="card mt-3 flex gap-2">
          <input className="input flex-1" placeholder="هدف جديد، مثلاً: حضور دورة معتمدة في Cisco CCNA"
            value={newGoal} onChange={(e) => setNewGoal(e.target.value)} />
          <button
            onClick={() => {
              if (!newGoal) return;
              update.mutate({ goals: [...goals, { ar: newGoal }] });
              setNewGoal('');
            }}
            disabled={!newGoal}
            className="btn-primary">
            إضافة
          </button>
        </div>
      </section>

      {/* History */}
      {plans.filter((p) => p.year !== currentYear).length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">سنوات سابقة</h3>
          <div className="space-y-2">
            {plans.filter((p) => p.year !== currentYear).map((p) => (
              <div key={p.id} className="card flex items-center justify-between text-sm">
                <span className="font-medium">{p.year}</span>
                <span className="text-slate-500">{(p.goals as any[])?.length ?? 0} هدف</span>
                <span className="font-mono">{p.progress}%</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
