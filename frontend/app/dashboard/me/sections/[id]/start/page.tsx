'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Check, FlaskConical, Play, AlertTriangle } from 'lucide-react';

const SAFETY_ITEMS = [
  { key: 'equipmentOk', label: 'الأجهزة سليمة وصالحة للتشغيل' },
  { key: 'exitsOk', label: 'مخارج الطوارئ مفتوحة وغير مسدودة' },
  { key: 'firstAidOk', label: 'صناديق الإسعاف الأولي جاهزة' },
  { key: 'electricalOk', label: 'وصلات الكهرباء آمنة' },
];

export default function StartClassPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id as string;
  const user = useAuth((s) => s.user);

  const { data: section } = useQuery<any>({
    queryKey: ['section', sectionId],
    queryFn: () => api.get(`/trainers/me/sections/${sectionId}`).then(r => r.data),
    enabled: !!user?.trainerId && !!sectionId,
  });

  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [classMode, setClassMode] = useState(false);

  const start = useMutation({
    mutationFn: () => api.post(`/trainers/me/sections/${sectionId}/start`, {
      safetyCheck: section?.isLab ? checks : undefined,
    }),
    onSuccess: () => {
      setClassMode(true);
      // فعّل Class Mode عبر localStorage (الـ sidebar يقرأها)
      localStorage.setItem('cci-class-mode', 'true');
      window.dispatchEvent(new Event('class-mode-changed'));
    },
    onError: (e: any) => setError(e?.response?.data?.messageAr ?? 'فشل البدء'),
  });

  const allChecked = SAFETY_ITEMS.every((i) => checks[i.key]);
  const requiresSafety = section?.isLab;

  if (classMode) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center">
        <div className="max-w-md">
          <div className="h-20 w-20 mx-auto rounded-full bg-emerald-100 grid place-items-center text-emerald-600 mb-6">
            <Play size={32} />
          </div>
          <h1 className="text-3xl font-bold">الحصة بدأت</h1>
          <p className="text-slate-500 mt-2">{section?.course?.nameAr}</p>
          <p className="text-sm text-amber-600 mt-4 bg-amber-50 rounded p-3">
            🔇 وضع الحصة مُفعّل — الإشعارات مكتومة حتى تنهي الحصة
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => router.push(`/dashboard/me/sections/${sectionId}/attendance`)}
              className="btn-primary py-3"
            >
              رصد الحضور الآن
            </button>
            <button
              onClick={() => router.push(`/dashboard/me/sections/${sectionId}/end`)}
              className="btn-secondary py-3"
            >
              إنهاء الحصة وكتابة تقرير
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <header>
        <div className="text-xs text-slate-400 font-mono">{section?.course?.code}</div>
        <h1 className="text-2xl font-bold mt-1">{section?.course?.nameAr}</h1>
        <p className="text-sm text-slate-500 mt-1">{section?.enrollments?.length ?? 0} متدرب</p>
      </header>

      {requiresSafety ? (
        <>
          <div className="card bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <FlaskConical size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">حصة معمل / ورشة</h3>
                <p className="text-sm text-amber-800 mt-1">
                  لا يمكن بدء الحصة قبل اكتمال فحص السلامة المهنية
                </p>
              </div>
            </div>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-3">قائمة فحص السلامة</h3>
            <div className="space-y-2">
              {SAFETY_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setChecks({ ...checks, [item.key]: !checks[item.key] })}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition text-right ${
                    checks[item.key]
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`h-7 w-7 rounded-full border-2 grid place-items-center shrink-0 ${
                    checks[item.key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                  }`}>
                    {checks[item.key] && <Check size={16} strokeWidth={3} />}
                  </div>
                  <span className={`flex-1 ${checks[item.key] ? 'text-emerald-900' : 'text-slate-700'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="card">
          <p className="text-sm text-slate-600">
            هذه الحصة في فصل عادي ولا تتطلب فحص سلامة. اضغط "بدء الحصة" للبدء.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-sm text-red-800">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="sticky bottom-4 z-10">
        <button
          onClick={() => start.mutate()}
          disabled={start.isPending || (requiresSafety && !allChecked)}
          className="w-full btn-primary py-4 text-base shadow-lg disabled:bg-slate-300"
        >
          {start.isPending ? 'جارٍ البدء...' :
            requiresSafety && !allChecked ? `أكمل ${SAFETY_ITEMS.length - Object.values(checks).filter(Boolean).length} بنود متبقية` :
            '🟢 بدء الحصة'}
        </button>
      </div>
    </div>
  );
}
