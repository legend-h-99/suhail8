'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Inbox, CalendarCheck2, Bell, GraduationCap, Eye, Users, Wallet, BarChart3 } from 'lucide-react';

interface Stat {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  icon?: any;
  tone?: 'default' | 'warn' | 'good' | 'bad';
}

function StatCard({ s }: { s: Stat }) {
  const Icon = s.icon;
  const toneClasses = {
    default: 'bg-white',
    warn: 'bg-amber-50 border-amber-200',
    good: 'bg-emerald-50 border-emerald-200',
    bad: 'bg-red-50 border-red-200',
  }[s.tone ?? 'default'];

  const inner = (
    <div className={`card ${toneClasses} h-full`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{s.label}</div>
          <div className="text-3xl font-bold mt-2">
            {typeof s.value === 'number' ? s.value.toLocaleString('ar') : s.value}
          </div>
          {s.hint && <div className="text-xs text-slate-400 mt-1">{s.hint}</div>}
        </div>
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-primary-50 grid place-items-center text-primary">
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );

  return s.href ? <Link href={s.href} className="block hover:scale-[1.01] transition">{inner}</Link> : inner;
}

export default function DashboardHome() {
  const { user, hasPermission, hasRole } = useAuth();
  const router = useRouter();

  // المدرب يُحوَّل لشاشة "اليوم" التي صُمّمت له خصيصاً
  useEffect(() => {
    if (user?.trainerId && hasRole('TRAINER') && !hasRole('DEAN')) {
      router.replace('/dashboard/me/today');
    }
  }, [user, hasRole, router]);

  const inbox = useQuery<any[]>({
    queryKey: ['stats', 'inbox'],
    queryFn: () => api.get('/workflow/inbox').then(r => r.data),
    enabled: !!user,
  });
  const myLeaves = useQuery<any[]>({
    queryKey: ['stats', 'my-leaves'],
    queryFn: () => api.get('/hr/leaves?mineOnly=true').then(r => r.data),
    enabled: !!user,
  });
  const unreadNotif = useQuery<{ count: number }>({
    queryKey: ['stats', 'unread'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    enabled: !!user,
  });

  const employees = useQuery<any[]>({
    queryKey: ['stats', 'employees'],
    queryFn: () => api.get('/hr/employees').then(r => r.data).catch(() => []),
    enabled: !!user && hasPermission('hr.employee.read'),
  });
  const trainees = useQuery<any[]>({
    queryKey: ['stats', 'trainees'],
    queryFn: () => api.get('/trainees').then(r => r.data).catch(() => []),
    enabled: !!user && hasPermission('trainees.read'),
  });
  const purchases = useQuery<any[]>({
    queryKey: ['stats', 'purchases'],
    queryFn: () => api.get('/finance/purchases').then(r => r.data).catch(() => []),
    enabled: !!user && hasPermission('finance.purchase.read'),
  });
  const kpis = useQuery<any[]>({
    queryKey: ['stats', 'kpis'],
    queryFn: () => api.get('/quality/kpis').then(r => r.data).catch(() => []),
    enabled: !!user && (hasPermission('quality.kpi.measure') || hasPermission('quality.kpi.update')),
  });
  const visits = useQuery<any[]>({
    queryKey: ['stats', 'visits'],
    queryFn: () => api.get('/supervision-visits').then(r => r.data).catch(() => []),
    enabled: !!user && hasPermission('trainers.read'),
  });
  const myVisits = useQuery<any[]>({
    queryKey: ['stats', 'my-visits'],
    queryFn: () => api.get('/supervision-visits/me').then(r => r.data).catch(() => []),
    enabled: !!user && !!user.trainerId,
  });

  const personal: Stat[] = [
    { label: 'بانتظار اعتمادي', value: inbox.data?.length ?? '—', icon: Inbox, href: '/dashboard/inbox',
      tone: (inbox.data?.length ?? 0) > 0 ? 'warn' : 'default' },
    { label: 'إشعارات جديدة', value: unreadNotif.data?.count ?? '—', icon: Bell, href: '/dashboard/notifications',
      tone: (unreadNotif.data?.count ?? 0) > 0 ? 'warn' : 'default' },
    { label: 'إجازاتي', value: myLeaves.data?.length ?? '—', icon: CalendarCheck2, href: '/dashboard/me/leaves' },
  ];

  const roleSpecific: Stat[] = [];

  if (hasRole('DEAN') || hasRole('SUPER_ADMIN')) {
    const pendingPRs = purchases.data?.filter((p: any) => p.status === 'UNDER_REVIEW').length ?? 0;
    roleSpecific.push(
      { label: 'الموظفون', value: employees.data?.length ?? '—', icon: Users, href: '/dashboard/hr/employees' },
      { label: 'المتدربون', value: trainees.data?.length ?? '—', icon: GraduationCap, href: '/dashboard/trainees' },
      { label: 'طلبات شراء قيد المراجعة', value: pendingPRs, icon: Wallet, href: '/dashboard/finance',
        tone: pendingPRs > 0 ? 'warn' : 'default' },
      { label: 'مؤشرات الجودة', value: kpis.data?.length ?? '—', icon: BarChart3, href: '/dashboard/reports/kpi' },
    );
  } else if (hasRole('VICE_DEAN_QUALITY')) {
    roleSpecific.push(
      { label: 'مؤشرات الجودة', value: kpis.data?.length ?? '—', icon: BarChart3, href: '/dashboard/quality' },
      { label: 'خطط التحسين', value: '—', icon: BarChart3, href: '/dashboard/quality/improvement' },
    );
  } else if (hasRole('VICE_DEAN_TRAINEES')) {
    const warned = trainees.data?.filter((t: any) => t.warnings?.length > 0).length ?? 0;
    roleSpecific.push(
      { label: 'إجمالي المتدربين', value: trainees.data?.length ?? '—', icon: GraduationCap, href: '/dashboard/trainees' },
      { label: 'منذرون أكاديمياً', value: warned, icon: GraduationCap, tone: warned > 0 ? 'warn' : 'default' },
    );
  } else if (hasRole('VICE_DEAN_TRAINERS')) {
    const followUp = visits.data?.filter((v: any) => v.status === 'FOLLOW_UP_NEEDED').length ?? 0;
    const avg = visits.data?.length
      ? visits.data.reduce((s: number, v: any) => s + Number(v.rating), 0) / visits.data.length
      : 0;
    roleSpecific.push(
      { label: 'الزيارات الإشرافية', value: visits.data?.length ?? '—', icon: Eye, href: '/dashboard/supervision' },
      { label: 'متوسط تقييم المدربين', value: avg.toFixed(2) + '/5', icon: BarChart3 },
      { label: 'تحتاج متابعة', value: followUp, tone: followUp > 0 ? 'warn' : 'default' },
    );
  } else if (hasRole('DEPT_HEAD')) {
    const followUp = visits.data?.filter((v: any) => v.status === 'FOLLOW_UP_NEEDED').length ?? 0;
    roleSpecific.push(
      { label: 'موظفو القسم', value: employees.data?.length ?? '—', icon: Users, href: '/dashboard/hr/employees' },
      { label: 'الزيارات الإشرافية', value: visits.data?.length ?? '—', icon: Eye, href: '/dashboard/supervision' },
      { label: 'تحتاج متابعة', value: followUp, tone: followUp > 0 ? 'warn' : 'default' },
    );
  } else if (hasRole('TRAINER')) {
    const myAvg = myVisits.data?.length
      ? myVisits.data.reduce((s: number, v: any) => s + Number(v.rating), 0) / myVisits.data.length
      : 0;
    roleSpecific.push(
      { label: 'تقييماتي الإشرافية', value: myVisits.data?.length ?? '—', icon: Eye, href: '/dashboard/me/visits' },
      { label: 'متوسط تقييمي', value: myAvg.toFixed(2) + '/5', icon: BarChart3,
        tone: myAvg >= 4 ? 'good' : myAvg >= 3 ? 'default' : 'warn' },
    );
  } else if (hasRole('IT_MANAGER')) {
    roleSpecific.push(
      { label: 'تذاكر تقنية مفتوحة', value: '—', icon: Inbox, href: '/dashboard/it' },
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">مرحباً، {user?.fullNameAr}</h1>
        <p className="text-slate-500 mt-1">
          {user?.roles.join('، ')} {user?.employee?.department?.nameAr ? `— ${user.employee.department.nameAr}` : ''}
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">شخصي</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {personal.map((s) => <StatCard key={s.label} s={s} />)}
        </div>
      </section>

      {roleSpecific.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">حسب دوري</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {roleSpecific.map((s) => <StatCard key={s.label} s={s} />)}
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">روابط سريعة</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link href="/dashboard/inbox" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <div className="font-medium text-sm">صندوق الاعتمادات</div>
            <div className="text-xs text-slate-500 mt-1">معالجة الطلبات الواردة</div>
          </Link>
          {hasPermission('council.meeting.create') && (
            <Link href="/dashboard/council" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-medium text-sm">جدولة اجتماع</div>
              <div className="text-xs text-slate-500 mt-1">المجلس واللجان</div>
            </Link>
          )}
          {hasPermission('finance.purchase.create') && (
            <Link href="/dashboard/finance" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-medium text-sm">طلب شراء</div>
              <div className="text-xs text-slate-500 mt-1">سقف 100,000 ر.س للعميد</div>
            </Link>
          )}
          {hasPermission('dept.training_plan.create') && (
            <Link href="/dashboard/training-plans" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-medium text-sm">خطة تشغيلية</div>
              <div className="text-xs text-slate-500 mt-1">إعداد خطة سنوية للقسم</div>
            </Link>
          )}
          {hasPermission('dept.supervision_visit.log') && (
            <Link href="/dashboard/supervision" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-medium text-sm">زيارة إشرافية</div>
              <div className="text-xs text-slate-500 mt-1">تقييم المدربين</div>
            </Link>
          )}
          {hasPermission('quality.improvement_plan.execute') && (
            <Link href="/dashboard/quality/improvement" className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-medium text-sm">خطة تحسين جودة</div>
              <div className="text-xs text-slate-500 mt-1">سد فجوة في KPI</div>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
