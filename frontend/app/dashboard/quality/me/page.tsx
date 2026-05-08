'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ClipboardCheck, Upload, TrendingUp, AlertTriangle, ChevronLeft } from 'lucide-react';

export default function CoordinatorWorkspace() {
  const { user, hasPermission } = useAuth();

  const isCoordinator = hasPermission('quality.kpi.measure') || hasPermission('quality.evidence.upload');

  const { data: kpis = [] } = useQuery<any[]>({
    queryKey: ['my-kpis'],
    queryFn: () => api.get('/quality/kpis').then(r => r.data),
    enabled: isCoordinator,
  });

  const { data: accred } = useQuery<any>({
    queryKey: ['my-accred'],
    queryFn: () => api.get('/quality/accreditation').then(r => r.data),
    enabled: hasPermission('quality.evidence.upload'),
  });

  const { data: qips = [] } = useQuery<any[]>({
    queryKey: ['my-qips'],
    queryFn: () => api.get('/quality/improvement-plans?status=IN_PROGRESS').then(r => r.data),
    enabled: hasPermission('quality.improvement_plan.execute'),
  });

  if (!isCoordinator) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-600">هذه الصفحة لمنسقي وحدة ضبط الجودة فقط.</p>
      </div>
    );
  }

  // KPIs بحاجة قياس (آخر قياس قبل > 30 يوم أو لا يوجد قياسات)
  const dueKpis = kpis.filter((k: any) => {
    if (!k.measurements || k.measurements.length === 0) return true;
    const last = new Date(k.measurements[0].createdAt);
    return Date.now() - last.getTime() > 30 * 86400_000;
  });

  // معايير اعتماد بحاجة شواهد
  const accredGaps = (accred?.items ?? []).filter((a: any) =>
    a.status === 'NOT_STARTED' || a.status === 'WEAK' || (a.status === 'IN_PROGRESS' && a._count.evidence === 0)
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">مساحة منسق الجودة</h1>
        <p className="text-slate-500 mt-1">مهامي اليومية، شواهد ناقصة، خطط تنفيذية</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <ClipboardCheck className="mx-auto text-amber-600" size={28} />
          <div className="text-2xl font-bold mt-2">{dueKpis.length}</div>
          <div className="text-xs text-slate-500">قياس KPIs مستحق</div>
        </div>
        <div className="card text-center">
          <Upload className="mx-auto text-blue-600" size={28} />
          <div className="text-2xl font-bold mt-2">{accredGaps.length}</div>
          <div className="text-xs text-slate-500">معايير بحاجة شواهد</div>
        </div>
        <div className="card text-center">
          <TrendingUp className="mx-auto text-emerald-600" size={28} />
          <div className="text-2xl font-bold mt-2">{qips.length}</div>
          <div className="text-xs text-slate-500">خطط تحسين قيد التنفيذ</div>
        </div>
      </div>

      {/* KPIs due */}
      {dueKpis.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">📊 KPIs بحاجة قياس</h3>
          <div className="card p-0 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {dueKpis.slice(0, 5).map((k) => (
                <li key={k.id} className="p-3 hover:bg-slate-50">
                  <Link href="/dashboard/quality" className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{k.nameAr}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {k.measurements?.length === 0 ? 'لم يُقاس بعد' : 'القياس متأخر'}
                      </div>
                    </div>
                    <ChevronLeft size={16} className="text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Accred gaps */}
      {accredGaps.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">📂 معايير اعتماد بحاجة شواهد</h3>
          <div className="card p-0 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {accredGaps.slice(0, 5).map((a: any) => (
                <li key={a.id} className="p-3 hover:bg-slate-50">
                  <Link href="/dashboard/quality/accreditation" className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-400">{a.standardCode}</div>
                      <div className="font-medium text-sm">{a.nameAr}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {a._count.evidence} شاهد · {a.status}
                      </div>
                    </div>
                    <AlertTriangle size={16} className="text-amber-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Improvement plans */}
      {qips.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">⚙️ خطط التحسين النشطة</h3>
          <div className="card p-0 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {qips.slice(0, 5).map((q: any) => (
                <li key={q.id} className="p-3 hover:bg-slate-50">
                  <Link href="/dashboard/quality/improvement" className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{q.scope}</div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{q.rootCause}</div>
                    </div>
                    <ChevronLeft size={16} className="text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/quality" className="card hover:bg-slate-50">
          <div className="font-medium text-sm">قياس KPI جديد</div>
          <div className="text-xs text-slate-500 mt-1">إدخال قياس شهري</div>
        </Link>
        <Link href="/dashboard/quality/improvement" className="card hover:bg-slate-50">
          <div className="font-medium text-sm">تحديث خطة تحسين</div>
          <div className="text-xs text-slate-500 mt-1">تنفيذ مهام أو إغلاق</div>
        </Link>
      </section>
    </div>
  );
}
