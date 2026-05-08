'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FileCheck2, Users, Calendar, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CouncilSecretaryPage() {
  const { hasPermission } = useAuth();
  const { data, isLoading } = useQuery<any>({
    queryKey: ['council-sec'],
    queryFn: () => api.get('/specialized/council-secretariat').then(r => r.data),
    enabled: hasPermission('council.minutes.draft'),
  });

  if (!hasPermission('council.minutes.draft')) {
    return <div className="card text-center py-12 text-slate-600">هذه الصفحة لأمين المجلس فقط.</div>;
  }
  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">مساحة أمين المجلس</h1>
        <p className="text-slate-500 mt-1">الاجتماعات، المحاضر، والقرارات</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Calendar} label="اجتماعات قادمة" value={data?.summary.upcomingMeetings ?? 0} tone="primary" />
        <Stat icon={FileCheck2} label="محاضر بحاجة إعداد" value={data?.summary.pendingMinutes ?? 0} tone="warn" />
        <Stat icon={Users} label="قرارات حديثة" value={data?.summary.recentDecisions ?? 0} tone="success" />
      </div>

      {/* Upcoming meetings */}
      <section>
        <h3 className="text-sm font-semibold mb-3">📅 اجتماعات قادمة</h3>
        <div className="card p-0 overflow-hidden">
          {data?.upcomingMeetings?.length === 0 ? (
            <div className="text-slate-400 text-center py-8 text-sm">لا توجد اجتماعات مجدولة.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data?.upcomingMeetings?.map((m: any) => (
                <li key={m.id}>
                  <Link href={`/dashboard/council`} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div>
                      <div className="font-medium">{m.titleAr}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(m.scheduledAt).toLocaleString('ar-SA')} · {m._count.attendees} مدعو
                      </div>
                    </div>
                    <ChevronLeft size={16} className="text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Recent decisions */}
      <section>
        <h3 className="text-sm font-semibold mb-3">📋 قرارات حديثة</h3>
        <div className="card p-0 overflow-hidden">
          {data?.recentDecisions?.length === 0 ? (
            <div className="text-slate-400 text-center py-8 text-sm">لا توجد قرارات.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data?.recentDecisions?.slice(0, 8).map((d: any) => (
                <li key={d.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-mono text-slate-400">{d.number}</div>
                      <div className="font-medium text-sm">{d.topic}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {d.meeting?.titleAr} · {new Date(d.meeting?.scheduledAt).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                    <span className={`badge ${d.vote === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : d.vote === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100'}`}>
                      {d.vote === 'APPROVED' ? 'معتمد' : d.vote === 'PENDING' ? 'معلّق' : d.vote}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Tasks reminder */}
      <div className="card bg-amber-50 border-amber-200">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">🔔 مهامي حسب الوصف الوظيفي:</h3>
        <ul className="text-sm text-amber-800 space-y-1 list-disc pr-4">
          <li>الإعداد لاجتماعات المجلس وإصدار الدعوات وجدول الأعمال</li>
          <li>تسجيل وقائع الجلسات وإعداد المحاضر</li>
          <li>إعداد القرارات والتوصيات بعد مصادقة الرئيس</li>
          <li>إعداد بيانات مكافأة الأعضاء ومتابعتها</li>
          <li>الإشراف على مقر الانعقاد وتهيئته</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: any; tone: string }) {
  const colors = {
    primary: 'bg-blue-50 text-blue-700',
    warn: 'bg-amber-50 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
  }[tone] || 'bg-slate-50';
  return (
    <div className={`card ${colors}`}>
      <Icon size={20} className="mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}
