'use client';

import Link from 'next/link';
import { Grid3x3, Lock, FileSearch, ChevronLeft } from 'lucide-react';

export default function AdminHome() {
  const tools = [
    {
      href: '/dashboard/admin/role-matrix',
      label: 'مصفوفة الأدوار والصلاحيات',
      description: 'RACI matrix يعرض ماذا يقدر كل دور يفعل (للتحقق وإثبات الالتزام)',
      icon: Grid3x3,
    },
    {
      href: '/dashboard/admin/access-test',
      label: 'اختبار الوصول',
      description: 'تجربة لمستخدم محدد: ماذا يشاهد، ماذا يقدر يستخدم، ولماذا',
      icon: Lock,
    },
    {
      href: '/dashboard/admin/audit',
      label: 'سجل العمليات (Audit Log)',
      description: 'كل العمليات في النظام مع المستخدم + IP + التفاصيل (Accounting)',
      icon: FileSearch,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">إعدادات النظام والإدارة</h1>
        <p className="text-slate-500 mt-1">أدوات للتحقق من المصادقة، التفويض، والسجلات</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}
              className="card hover:border-primary hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary-50 grid place-items-center text-primary shrink-0">
                  <Icon size={22} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{t.label}</div>
                  <div className="text-sm text-slate-500 mt-1 leading-relaxed">{t.description}</div>
                </div>
                <ChevronLeft size={16} className="text-slate-400" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stack info */}
      <div className="card bg-slate-50">
        <h2 className="font-semibold mb-3">🔐 طبقات الأمان والتحكّم في النظام</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="font-mono text-xs text-slate-400">Authentication</div>
            <div className="font-medium mt-1">JWT + Refresh Tokens</div>
            <div className="text-xs text-slate-500 mt-0.5">Argon2 + 15min access TTL</div>
          </div>
          <div>
            <div className="font-mono text-xs text-slate-400">Authorization</div>
            <div className="font-medium mt-1">RBAC + Scopes</div>
            <div className="text-xs text-slate-500 mt-0.5">81 صلاحية × 14 دور</div>
          </div>
          <div>
            <div className="font-mono text-xs text-slate-400">Accounting</div>
            <div className="font-medium mt-1">Audit Logs</div>
            <div className="text-xs text-slate-500 mt-0.5">تلقائي لكل POST/PATCH/DELETE</div>
          </div>
          <div>
            <div className="font-mono text-xs text-slate-400">Anti-abuse</div>
            <div className="font-medium mt-1">Rate Limiting</div>
            <div className="text-xs text-slate-500 mt-0.5">100 req / 60s لكل IP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
