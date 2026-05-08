'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FlaskConical, MapPin } from 'lucide-react';

const DAYS = [
  { key: 'SUN', label: 'الأحد' },
  { key: 'MON', label: 'الإثنين' },
  { key: 'TUE', label: 'الثلاثاء' },
  { key: 'WED', label: 'الأربعاء' },
  { key: 'THU', label: 'الخميس' },
];

const HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
];

export default function SchedulePage() {
  const user = useAuth((s) => s.user);
  const { data, isLoading } = useQuery<Record<string, any[]>>({
    queryKey: ['trainer-schedule'],
    queryFn: () => api.get('/trainers/me/schedule').then(r => r.data),
    enabled: !!user?.trainerId,
  });

  if (!user?.trainerId) {
    return <div className="card text-center py-12 text-slate-600">للمدربين فقط.</div>;
  }

  const todayKey = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">جدولي الأسبوعي</h1>
        <p className="text-slate-500 mt-1">الفصل التدريبي الحالي</p>
      </header>

      {isLoading ? (
        <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
      ) : (
        <>
          {/* Mobile: stack by day */}
          <div className="lg:hidden space-y-4">
            {DAYS.map((d) => {
              const slots = data?.[d.key] ?? [];
              const isToday = d.key === todayKey;
              return (
                <div key={d.key} className={`card ${isToday ? 'border-primary border-2' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">{d.label}</h3>
                    {isToday && <span className="badge bg-primary text-white">اليوم</span>}
                  </div>
                  {slots.length === 0 ? (
                    <p className="text-sm text-slate-400">لا حصص</p>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((s, i) => (
                        <Link key={i} href={`/dashboard/me/sections/${s.sectionId}`}
                          className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100">
                          <div className="text-xs font-mono text-slate-500 min-w-[80px]">
                            {s.from}–{s.to}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{s.courseName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <MapPin size={11} /> {s.room}
                              {s.isLab && <FlaskConical size={11} className="text-amber-600" />}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: grid */}
          <div className="hidden lg:block card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-right text-xs text-slate-500 w-16">الساعة</th>
                  {DAYS.map((d) => (
                    <th key={d.key} className={`p-2 text-right text-sm ${d.key === todayKey ? 'text-primary font-bold' : ''}`}>
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hr) => (
                  <tr key={hr} className="border-b border-slate-100 h-14">
                    <td className="text-xs text-slate-400 font-mono">{hr}</td>
                    {DAYS.map((d) => {
                      const slot = (data?.[d.key] ?? []).find((s: any) => s.from === hr);
                      return (
                        <td key={d.key} className="p-1">
                          {slot && (
                            <Link href={`/dashboard/me/sections/${slot.sectionId}`}
                              className={`block p-2 rounded-lg text-xs ${slot.isLab ? 'bg-amber-100 text-amber-900' : 'bg-primary-50 text-primary-900'} hover:scale-[1.02] transition`}>
                              <div className="font-bold">{slot.courseCode}</div>
                              <div className="text-[10px] opacity-80 mt-0.5">{slot.room}</div>
                              <div className="text-[10px] opacity-80">{slot.from}–{slot.to}</div>
                            </Link>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
