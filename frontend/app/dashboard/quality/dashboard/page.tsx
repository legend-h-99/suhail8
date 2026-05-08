'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Award, Target, Users2, FileCheck, AlertCircle } from 'lucide-react';

interface KPI {
  id: string; code: string; nameAr: string; unit?: string;
  target: number | null; lastValue: number | null;
  trafficLight: 'green' | 'yellow' | 'red' | 'gray';
  trend: 'up' | 'down' | 'flat' | null;
  measurementsCount: number;
}

interface DashData {
  kpis: KPI[];
  kpiCounts: { green: number; yellow: number; red: number; gray: number };
  heatmap: any[];
  counts: { plans: number; qips: number; risks: number; teams: number; accreditations: number; accredReadiness: number };
  alerts: { type: string; severity: 'critical' | 'warning' | 'info'; messageAr: string; link?: string }[];
  summary: { narrative: string };
}

export default function QualityDashboardPage() {
  const { data, isLoading } = useQuery<DashData>({
    queryKey: ['quality-dashboard'],
    queryFn: () => api.get('/quality/dashboard').then(r => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">لوحة الجودة الاستراتيجية</h1>
        <p className="text-slate-500 mt-1">{data.summary.narrative || 'نظرة شاملة على أداء الجودة'}</p>
      </header>

      {/* Top counters */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Counter label="مؤشرات أداء" value={data.kpis.length} icon={Target} hint={`${data.kpiCounts.green} على المسار`} tone="default" />
        <Counter label="خطط جودة فعّالة" value={data.counts.plans} icon={FileCheck} link="/dashboard/quality/plans" />
        <Counter label="فرق نشطة" value={data.counts.teams} icon={Users2} link="/dashboard/quality/teams" />
        <Counter label="جاهزية الاعتماد" value={`${data.counts.accredReadiness}%`} icon={Award}
          tone={data.counts.accredReadiness >= 70 ? 'good' : data.counts.accredReadiness >= 40 ? 'warn' : 'bad'}
          link="/dashboard/quality/accreditation" />
      </section>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">🚨 تنبيهات</h2>
          <div className="space-y-2">
            {data.alerts.map((a, i) => {
              const color = a.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                a.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-blue-50 border-blue-200 text-blue-800';
              const Icon = a.severity === 'critical' ? AlertCircle : AlertTriangle;
              const inner = (
                <div className={`rounded-lg border p-3 flex items-center gap-2 ${color}`}>
                  <Icon size={16} />
                  <span className="text-sm flex-1">{a.messageAr}</span>
                </div>
              );
              return a.link ? <Link key={i} href={a.link}>{inner}</Link> : <div key={i}>{inner}</div>;
            })}
          </div>
        </section>
      )}

      {/* KPI Traffic Light grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500">مؤشرات الأداء (KPIs)</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {data.kpiCounts.green}</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> {data.kpiCounts.yellow}</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {data.kpiCounts.red}</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> {data.kpiCounts.gray}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.kpis.map((k) => {
            const lightColor = {
              green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-red-500', gray: 'bg-slate-300',
            }[k.trafficLight];
            const TrendIcon = k.trend === 'up' ? TrendingUp : k.trend === 'down' ? TrendingDown : Minus;
            const trendColor = k.trend === 'up' ? 'text-emerald-600' : k.trend === 'down' ? 'text-red-600' : 'text-slate-400';
            return (
              <div key={k.id} className="card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-slate-400">{k.code}</div>
                    <div className="font-semibold text-sm truncate">{k.nameAr}</div>
                  </div>
                  <span className={`h-3 w-3 rounded-full ${lightColor} shrink-0 mt-1`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {k.lastValue !== null ? k.lastValue.toLocaleString('ar-SA') : '—'}
                  </span>
                  <span className="text-xs text-slate-500">{k.unit ?? ''}</span>
                  {k.trend && <TrendIcon size={14} className={trendColor + ' mr-auto'} />}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  الهدف: {k.target ?? '—'} · {k.measurementsCount} قياس
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Heatmap */}
      {data.heatmap.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">heatmap نواتج التدريب حسب القسم</h2>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-right text-xs">القسم</th>
                  <th className="p-2 text-right text-xs">الفصل</th>
                  <th className="p-2 text-right text-xs">نسبة الاجتياز</th>
                  <th className="p-2 text-right text-xs">التوظيف</th>
                  <th className="p-2 text-right text-xs">رضا الموظفين</th>
                  <th className="p-2 text-right text-xs">رضا المتدربين</th>
                  <th className="p-2 text-right text-xs">المتوسط</th>
                </tr>
              </thead>
              <tbody>
                {data.heatmap.map((h: any) => (
                  <tr key={h.departmentId + h.term} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{h.departmentName ?? '—'}</td>
                    <td className="p-2 text-xs text-slate-500">{h.term}</td>
                    <ScoreCell value={h.scores.passRate} />
                    <ScoreCell value={h.scores.employmentRate} />
                    <ScoreCell value={h.scores.employerSatisfaction} />
                    <ScoreCell value={h.scores.studentSatisfaction} />
                    <ScoreCell value={h.overall} bold />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickLink href="/dashboard/quality/plans" label="الخطط" />
        <QuickLink href="/dashboard/quality/teams" label="الفرق" />
        <QuickLink href="/dashboard/quality/accreditation" label="الاعتماد" />
        <QuickLink href="/dashboard/quality/improvement" label="خطط التحسين" />
        <QuickLink href="/dashboard/quality/outcomes" label="نواتج التدريب" />
        <QuickLink href="/dashboard/quality/nominations" label="الترشيحات" />
        <QuickLink href="/dashboard/quality/dg-reports" label="تقارير الإدارة" />
        <QuickLink href="/dashboard/quality/campaigns" label="حملات الجودة" />
      </section>
    </div>
  );
}

function Counter({ label, value, icon: Icon, hint, tone = 'default', link }: {
  label: string; value: any; icon: any; hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad'; link?: string;
}) {
  const bg = { default: 'bg-white', good: 'bg-emerald-50', warn: 'bg-amber-50', bad: 'bg-red-50' }[tone];
  const inner = (
    <div className={`card ${bg} h-full`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-3xl font-bold mt-1">{value}</div>
          {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
        </div>
        <div className="h-9 w-9 rounded-lg bg-primary-50 grid place-items-center text-primary">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
  return link ? <Link href={link} className="block hover:scale-[1.01] transition">{inner}</Link> : inner;
}

function ScoreCell({ value, bold = false }: { value: number | null; bold?: boolean }) {
  if (value === null || value === undefined) return <td className="p-2 text-slate-300">—</td>;
  const v = Number(value);
  const bg = v >= 80 ? 'bg-emerald-100 text-emerald-800' :
    v >= 65 ? 'bg-amber-100 text-amber-800' :
    'bg-red-100 text-red-800';
  return (
    <td className="p-2">
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${bold ? 'font-bold' : ''} ${bg}`}>
        {v.toFixed(1)}
      </span>
    </td>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="card hover:bg-slate-50 hover:border-primary text-center text-sm font-medium">
      {label}
    </Link>
  );
}
