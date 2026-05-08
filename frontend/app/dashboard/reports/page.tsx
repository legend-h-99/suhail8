'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FileText, BarChart3, GraduationCap, Printer } from 'lucide-react';

export default function ReportsHome() {
  const { hasPermission } = useAuth();

  const reports = [
    {
      href: '/dashboard/reports/quarterly',
      label: 'التقرير الفصلي',
      description: 'مستويات الإنجاز + الإحصائيات للعميد والوكلاء',
      icon: FileText,
      visible: hasPermission('dept.report.quarterly_submit') || hasPermission('quality.report.dg_submit'),
    },
    {
      href: '/dashboard/reports/kpi',
      label: 'تقرير المؤشرات (KPIs)',
      description: 'حالة جميع KPIs مع آخر القياسات والاتجاه',
      icon: BarChart3,
      visible: hasPermission('quality.kpi.measure') || hasPermission('quality.kpi.update'),
    },
    {
      href: '/dashboard/reports/trainees',
      label: 'تقرير المتدربين',
      description: 'الحالة الأكاديمية، الإنذارات، نسبة الاستمرار',
      icon: GraduationCap,
      visible: hasPermission('trainees.read'),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-slate-500 mt-1">تقارير قابلة للطباعة (Cmd+P → حفظ كـ PDF)</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.filter(r => r.visible).map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.href} href={r.href}
              className="card hover:border-primary-500 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-50 grid place-items-center text-primary">
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-sm text-slate-500 mt-1">{r.description}</div>
                </div>
                <Printer size={16} className="text-slate-400" />
              </div>
            </Link>
          );
        })}
        {reports.filter(r => r.visible).length === 0 && (
          <div className="col-span-full card text-center text-slate-500">
            لا تتوفر تقارير لصلاحياتك الحالية.
          </div>
        )}
      </div>
    </div>
  );
}
