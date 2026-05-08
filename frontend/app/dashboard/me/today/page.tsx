'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Clock, MapPin, Users, AlertTriangle, BookOpen, Eye,
  TrendingUp, ChevronLeft, FlaskConical,
} from 'lucide-react';

interface ScheduleSlot {
  sectionId: string;
  courseCode: string;
  courseName: string;
  from: string;
  to: string;
  room: string;
  isLab: boolean;
  studentsCount: number;
}

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  messageAr: string;
  link?: string;
}

interface TodayData {
  trainer: { name: string; trainerNumber: string; specialization: string };
  todaySchedule: ScheduleSlot[];
  alerts: Alert[];
  thisWeek: { loadHours: number; myAttendance: number; weekDaySoFar: number };
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function TrainerTodayPage() {
  const user = useAuth((s) => s.user);

  const { data, isLoading } = useQuery<TodayData>({
    queryKey: ['trainer-today'],
    queryFn: () => api.get('/trainers/me/today').then(r => r.data),
    enabled: !!user?.trainerId,
    refetchInterval: 60_000,
  });

  const { data: kpis } = useQuery<any>({
    queryKey: ['trainer-kpis'],
    queryFn: () => api.get('/trainers/me/kpis').then(r => r.data),
    enabled: !!user?.trainerId,
  });

  if (!user?.trainerId) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-600">هذه الصفحة للمدربين فقط.</p>
      </div>
    );
  }

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'صباح الخير' : today.getHours() < 17 ? 'مساء الخير' : 'مساء الخير';
  const dateStr = `${DAYS_AR[today.getDay()]} ${today.getDate()} ${MONTHS_AR[today.getMonth()]}`;

  // الحصة القادمة
  const now = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  const nextSlot = data?.todaySchedule.find((s) => s.from > now);
  const currentSlot = data?.todaySchedule.find((s) => s.from <= now && s.to >= now);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Greeting */}
      <header>
        <p className="text-sm text-slate-500">{dateStr}</p>
        <h1 className="text-2xl font-bold mt-1">
          {greeting}، {user.fullNameAr.split(' ')[0]} 👋
        </h1>
      </header>

      {/* الحصة الحالية / القادمة */}
      {currentSlot ? (
        <Link href={`/dashboard/me/sections/${currentSlot.sectionId}/start`}
          className="block bg-gradient-to-bl from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 text-emerald-100 text-sm">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> الحصة الحالية
          </div>
          <h2 className="text-xl font-bold mt-2">{currentSlot.courseName}</h2>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1"><Clock size={14} /> {currentSlot.from} – {currentSlot.to}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {currentSlot.room}</span>
            <span className="flex items-center gap-1"><Users size={14} /> {currentSlot.studentsCount} متدرب</span>
            {currentSlot.isLab && <span className="flex items-center gap-1"><FlaskConical size={14} /> معمل</span>}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-emerald-400">
            <span className="font-medium">{currentSlot.isLab ? 'فحص السلامة + بدء' : 'بدء الحصة'}</span>
            <ChevronLeft size={20} />
          </div>
        </Link>
      ) : nextSlot ? (
        <Link href={`/dashboard/me/sections/${nextSlot.sectionId}`}
          className="block bg-gradient-to-bl from-primary-700 to-primary-800 rounded-2xl p-5 text-white shadow-lg">
          <div className="text-primary-100 text-sm">الحصة القادمة</div>
          <h2 className="text-xl font-bold mt-2">{nextSlot.courseName}</h2>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1"><Clock size={14} /> {nextSlot.from}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {nextSlot.room}</span>
            <span className="flex items-center gap-1"><Users size={14} /> {nextSlot.studentsCount} متدرب</span>
            {nextSlot.isLab && <span className="flex items-center gap-1"><FlaskConical size={14} /> معمل</span>}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary-500">
            <span className="font-medium">عرض الشعبة</span>
            <ChevronLeft size={20} />
          </div>
        </Link>
      ) : (
        <div className="card bg-slate-50 text-center py-8">
          <p className="text-slate-600">لا توجد حصص لك اليوم 🌴</p>
        </div>
      )}

      {/* جدول اليوم */}
      {data && data.todaySchedule.length > 1 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-500 mb-2">جدول اليوم</h3>
          <div className="space-y-2">
            {data.todaySchedule.map((s) => (
              <Link key={s.sectionId + s.from} href={`/dashboard/me/sections/${s.sectionId}`}
                className="card flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="font-medium">{s.courseName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {s.from} – {s.to} · {s.room} · {s.studentsCount} متدرب
                    {s.isLab && <span className="mr-1 badge bg-amber-50 text-amber-700">معمل</span>}
                  </div>
                </div>
                <ChevronLeft size={18} className="text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* تنبيهات */}
      {data && data.alerts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-500 mb-2">
            🔔 {data.alerts.length} تنبيه
          </h3>
          <div className="space-y-2">
            {data.alerts.map((a, i) => {
              const toneClass = {
                info: 'bg-blue-50 border-blue-200 text-blue-800',
                warning: 'bg-amber-50 border-amber-200 text-amber-800',
                critical: 'bg-red-50 border-red-200 text-red-800',
              }[a.severity];
              const Icon = a.severity === 'info' ? Eye : AlertTriangle;
              const content = (
                <div className={`rounded-lg border p-3 flex items-center gap-2 ${toneClass}`}>
                  <Icon size={16} />
                  <span className="text-sm flex-1">{a.messageAr}</span>
                  {a.link && <ChevronLeft size={16} />}
                </div>
              );
              return a.link ? <Link key={i} href={a.link}>{content}</Link> : <div key={i}>{content}</div>;
            })}
          </div>
        </section>
      )}

      {/* KPIs */}
      {kpis && (
        <section>
          <h3 className="text-sm font-semibold text-slate-500 mb-2">📊 مؤشراتي</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile
              label="متوسط تقييمي"
              value={kpis.avgSupervisionRating !== null ? `${kpis.avgSupervisionRating}/5` : '—'}
              tone={kpis.avgSupervisionRating >= 4 ? 'good' : kpis.avgSupervisionRating >= 3 ? 'default' : 'warn'}
              icon={Eye}
            />
            <KpiTile
              label="نسبة اجتياز متدربيي"
              value={kpis.passRate !== null ? `${kpis.passRate}%` : '—'}
              tone={kpis.passRate >= 85 ? 'good' : kpis.passRate >= 70 ? 'default' : 'warn'}
              icon={TrendingUp}
            />
            <KpiTile
              label="نصابي الأسبوعي"
              value={`${kpis.teachingLoad}س`}
              icon={BookOpen}
            />
            <KpiTile
              label="تطويري المهني"
              value={kpis.developmentProgress !== null ? `${kpis.developmentProgress}%` : '—'}
              tone={kpis.developmentProgress >= 80 ? 'good' : kpis.developmentProgress >= 50 ? 'default' : 'warn'}
              icon={TrendingUp}
            />
          </div>
        </section>
      )}

      {/* روابط سريعة */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickLink href="/dashboard/me/schedule" label="جدولي الأسبوعي" icon={Clock} />
        <QuickLink href="/dashboard/me/sections" label="شُعبي" icon={Users} />
        <QuickLink href="/dashboard/me/coop" label="التدريب التعاوني" icon={MapPin} />
        <QuickLink href="/dashboard/me/reports" label="تقاريري" icon={BookOpen} />
      </section>

      {isLoading && <div className="text-slate-500 text-sm text-center">جارٍ التحميل...</div>}
    </div>
  );
}

function KpiTile({ label, value, tone = 'default', icon: Icon }: {
  label: string; value: string | number; tone?: 'default' | 'good' | 'warn'; icon?: any;
}) {
  const toneClass = { default: 'bg-white', good: 'bg-emerald-50', warn: 'bg-amber-50' }[tone];
  return (
    <div className={`card ${toneClass}`}>
      <div className="flex items-center justify-between text-slate-500 text-xs">
        <span>{label}</span>
        {Icon && <Icon size={14} />}
      </div>
      <div className="text-xl font-bold mt-1.5">{value}</div>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <Link href={href} className="card flex items-center gap-3 hover:bg-slate-50">
      <div className="h-9 w-9 rounded-lg bg-primary-50 grid place-items-center text-primary">
        <Icon size={18} />
      </div>
      <span className="font-medium text-sm flex-1">{label}</span>
      <ChevronLeft size={16} className="text-slate-400" />
    </Link>
  );
}
