'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  Home, Users, Building2, FileCheck2, Wallet, GraduationCap,
  UserCog, BookOpen, Monitor, BarChart3, HeartHandshake, FlaskConical,
  ShieldCheck, LogOut, Inbox, CalendarCheck2, Hammer,
  ClipboardList, BookOpenCheck, Target, Eye, FileText, TrendingUp, Bell,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  /** أي صلاحية واحدة من القائمة كافية لإظهار الرابط. null = للجميع. */
  anyPerm?: string[] | null;
  /** الأدوار المستهدفة (اختياري) — يكفي وجود واحد منها. */
  anyRole?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
  /** يُظهر القسم لو المستخدم له trainerId */
  trainerOnly?: boolean;
}

/**
 * RACI-based navigation:
 *   - "أنا" → الكل (طلباتي / تذاكري / صندوق اعتماداتي)
 *   - "الهيكل والمجلس" → الكل (شفافية تنظيمية)
 *   - "العمليات الأكاديمية" → حسب الدور (مدرب/منسق/عميد)
 *   - "الإدارة والإشراف" → للمدراء والوكلاء (Accountable/Responsible)
 *   - "إعدادات النظام" → للمسؤول التقني / Super Admin
 */
const NAV_GROUPS: NavGroup[] = [
  {
    title: 'أنا',
    items: [
      { href: '/dashboard', label: 'الرئيسية', icon: Home, anyPerm: null },
      { href: '/dashboard/inbox', label: 'صندوق اعتماداتي', icon: Inbox, anyPerm: null },
      { href: '/dashboard/notifications', label: 'الإشعارات', icon: Bell, anyPerm: null },
      { href: '/dashboard/me/leaves', label: 'إجازاتي', icon: CalendarCheck2, anyPerm: null },
      { href: '/dashboard/me/tickets', label: 'تذاكري التقنية', icon: Monitor, anyPerm: null },
      { href: '/dashboard/me/visits', label: 'تقييماتي', icon: Eye, anyPerm: null },
    ],
  },
  {
    title: '🎓 فضاء المدرب',
    trainerOnly: true,
    items: [
      { href: '/dashboard/me/today', label: 'اليوم', icon: Home, anyPerm: null },
      { href: '/dashboard/me/schedule', label: 'جدولي الأسبوعي', icon: CalendarCheck2, anyPerm: null },
      { href: '/dashboard/me/sections', label: 'شُعبي', icon: BookOpenCheck, anyPerm: null },
      { href: '/dashboard/me/coop', label: 'التدريب التعاوني', icon: Building2, anyPerm: null },
      { href: '/dashboard/me/reports', label: 'تقاريري الدورية', icon: FileText, anyPerm: null },
      { href: '/dashboard/me/development', label: 'تطويري المهني', icon: TrendingUp, anyPerm: null },
    ],
  },
  {
    title: '⚙️ الأنظمة المركزية',
    items: [
      { href: '/dashboard/tasks', label: 'نظام المهام', icon: ClipboardList, anyPerm: null },
      { href: '/dashboard/projects', label: 'نظام المشاريع', icon: Target,
        anyPerm: ['projects.read', 'projects.create'] },
      { href: '/dashboard/boards', label: 'لوحات Kanban', icon: BookOpenCheck,
        anyPerm: ['boards.create', 'boards.manage_cards'] },
      { href: '/dashboard/ai-center', label: 'مركز الذكاء الاصطناعي', icon: TrendingUp,
        anyPerm: ['ai.use', 'ai.summarize'] },
      { href: '/dashboard/chatbot', label: 'الدردشة الذكية', icon: BookOpen,
        anyPerm: ['chatbot.use'] },
      { href: '/dashboard/data-lake', label: 'Data Lake', icon: FileText,
        anyPerm: ['data_lake.read'] },
      { href: '/dashboard/data-warehouse', label: 'Data Warehouse', icon: BarChart3,
        anyPerm: ['data_warehouse.read'] },
      { href: '/dashboard/data-processing', label: 'Data Processing', icon: Hammer,
        anyPerm: ['data_processing.manage'] },
    ],
  },
  {
    title: 'الهيكل والمجلس',
    items: [
      { href: '/dashboard/org', label: 'الهيكل التنظيمي', icon: Building2, anyPerm: null },
      { href: '/dashboard/council', label: 'المجلس والاجتماعات', icon: FileCheck2, anyPerm: null },
    ],
  },
  {
    title: 'العمليات الأكاديمية',
    items: [
      { href: '/dashboard/academic', label: 'البرامج والمقررات', icon: BookOpen, anyPerm: null },
      { href: '/dashboard/trainees', label: 'شؤون المتدربين', icon: GraduationCap,
        anyPerm: ['trainees.read', 'trainees.create', 'trainees.warning.issue'] },
      { href: '/dashboard/trainers', label: 'شؤون المدربين', icon: BookOpenCheck,
        anyPerm: ['trainers.read', 'trainers.load.set'] },
      { href: '/dashboard/training-plans', label: 'الخطط التشغيلية للأقسام', icon: Target,
        anyPerm: ['dept.training_plan.create', 'trainers.read'] },
      { href: '/dashboard/supervision', label: 'الزيارات الإشرافية', icon: Eye,
        anyPerm: ['dept.supervision_visit.log', 'trainers.read'] },
      { href: '/dashboard/curriculum', label: 'تقييم الحقائب التدريبية', icon: FileText,
        anyPerm: ['dept.curriculum_review.create', 'trainer.curriculum.feedback'] },
      { href: '/dashboard/community', label: 'خدمة المجتمع', icon: HeartHandshake, anyPerm: null },
      { href: '/dashboard/research', label: 'البحث والابتكار', icon: FlaskConical, anyPerm: null },
    ],
  },
  {
    title: 'الإدارة والإشراف',
    items: [
      { href: '/dashboard/hr/employees', label: 'إدارة الموظفين', icon: UserCog,
        anyPerm: ['hr.employee.read', 'hr.employee.create', 'hr.employee.update'] },
      { href: '/dashboard/hr/leaves', label: 'إدارة الإجازات', icon: ClipboardList,
        anyPerm: ['hr.leave.read', 'hr.leave.approve_dean'] },
      { href: '/dashboard/finance', label: 'الشؤون المالية', icon: Wallet,
        anyPerm: ['finance.purchase.read', 'finance.budget.read', 'finance.purchase.approve_dean'] },
      { href: '/dashboard/reports', label: 'التقارير', icon: FileText,
        anyPerm: ['dept.report.quarterly_submit', 'quality.kpi.measure', 'quality.report.dg_submit', 'trainees.read'] },
      { href: '/dashboard/services', label: 'الخدمات العامة', icon: ShieldCheck,
        anyPerm: ['services.security.read', 'services.medical.read'] },
    ],
  },
  {
    title: '🎖️ مساحاتي المتخصصة',
    items: [
      { href: '/dashboard/me/council-sec', label: 'أمين المجلس', icon: FileCheck2,
        anyPerm: ['council.minutes.draft'] },
      { href: '/dashboard/me/warehouse', label: 'أمين المستودع', icon: BookOpenCheck,
        anyPerm: ['warehouse.inventory'] },
      { href: '/dashboard/me/treasury', label: 'أمين الصندوق', icon: Wallet,
        anyPerm: ['treasury.reconcile'] },
      { href: '/dashboard/me/clinic', label: 'العيادة الطبية', icon: HeartHandshake,
        anyPerm: ['clinic.examine'] },
      { href: '/dashboard/me/monitoring', label: 'وحدة الرقابة', icon: Eye,
        anyPerm: ['monitoring.tour'] },
    ],
  },
  {
    title: '🎯 منظومة الجودة',
    items: [
      { href: '/dashboard/quality/dashboard', label: 'لوحة الجودة', icon: BarChart3,
        anyPerm: ['quality.kpi.update', 'quality.kpi.measure'] },
      { href: '/dashboard/quality', label: 'KPIs والاستبيانات', icon: Target,
        anyPerm: ['quality.kpi.update', 'quality.kpi.measure'] },
      { href: '/dashboard/quality/plans', label: 'الخطط', icon: FileCheck2,
        anyPerm: ['quality.plan.create_yearly', 'quality.kpi.measure'] },
      { href: '/dashboard/quality/teams', label: 'فرق الجودة', icon: Users,
        anyPerm: ['quality.team.charter', 'quality.team.task.update'] },
      { href: '/dashboard/quality/accreditation', label: 'الاعتماد الأكاديمي', icon: BookOpenCheck,
        anyPerm: ['quality.accreditation.manage', 'quality.evidence.upload'] },
      { href: '/dashboard/quality/improvement', label: 'خطط التحسين', icon: TrendingUp,
        anyPerm: ['quality.improvement_plan.execute'] },
      { href: '/dashboard/quality/outcomes', label: 'نواتج التدريب', icon: BookOpen,
        anyPerm: ['quality.training_outcomes.measure'] },
      { href: '/dashboard/quality/nominations', label: 'الترشيحات', icon: BookOpenCheck,
        anyPerm: ['quality.nomination.recommend'] },
      { href: '/dashboard/quality/dg-reports', label: 'تقارير الإدارة', icon: FileText,
        anyPerm: ['quality.report.dg_submit'] },
      { href: '/dashboard/quality/campaigns', label: 'حملات الجودة', icon: HeartHandshake,
        anyPerm: ['quality.campaign.create'] },
      { href: '/dashboard/quality/me', label: 'مساحتي (منسق)', icon: ClipboardList,
        anyPerm: ['quality.evidence.upload', 'quality.coordinator.report.submit'] },
    ],
  },
  {
    title: 'إعدادات النظام',
    items: [
      { href: '/dashboard/users', label: 'المستخدمون', icon: Users, anyPerm: ['users.read'] },
      { href: '/dashboard/it', label: 'إدارة Helpdesk', icon: Hammer,
        anyPerm: ['it.ticket.assign', 'it.ticket.resolve'] },
      { href: '/dashboard/admin', label: '🛡️ RBAC & Audit', icon: Hammer,
        anyPerm: ['users.read'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission, logout } = useAuth();
  const [classMode, setClassMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setClassMode(localStorage.getItem('cci-class-mode') === 'true');
    const handler = () => setClassMode(localStorage.getItem('cci-class-mode') === 'true');
    window.addEventListener('class-mode-changed', handler);
    return () => window.removeEventListener('class-mode-changed', handler);
  }, []);

  const { data: unread } = useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
    enabled: !!user && !classMode,  // كتم polling في وضع الحصة
    refetchInterval: classMode ? false : 30_000,
  });

  const canSeeItem = (it: NavItem): boolean => {
    if (it.anyPerm === null) return true;
    if (it.anyPerm && it.anyPerm.length > 0 && it.anyPerm.some((p) => hasPermission(p))) return true;
    if (it.anyRole && user && it.anyRole.some((r) => user.roles.includes(r))) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary grid place-items-center font-bold">ك</div>
          <div>
            <div className="text-sm font-semibold leading-tight">كلية الاتصالات</div>
            <div className="text-xs text-slate-400">والمعلومات — الرياض</div>
          </div>
        </div>
      </div>

      {classMode && (
        <div className="bg-amber-500 text-white text-xs text-center py-1.5 font-medium">
          🔇 وضع الحصة — الإشعارات مكتومة
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {NAV_GROUPS.map((group) => {
          if (group.trainerOnly && !user?.trainerId) return null;
          const visible = group.items.filter(canSeeItem);
          if (visible.length === 0) return null;
          return (
            <div key={group.title}>
              <div className="px-3 text-[10px] font-semibold uppercase text-slate-500 mb-1.5 tracking-wider">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {visible.map((n) => {
                  const Icon = n.icon;
                  const active = pathname === n.href || pathname.startsWith(n.href + '/');
                  const showBadge = n.href === '/dashboard/notifications' && unread && unread.count > 0;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={17} />
                      <span className="flex-1">{n.label}</span>
                      {showBadge && (
                        <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                          {unread!.count > 99 ? '99+' : unread!.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <div className="px-3 py-2 mb-2">
          <div className="text-sm font-medium truncate">{user?.fullNameAr}</div>
          <div className="text-xs text-slate-400 truncate" dir="ltr">{user?.email}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {user?.roles.slice(0, 2).map((r) => (
              <span key={r} className="badge bg-slate-700 text-slate-200">{r}</span>
            ))}
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
