'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Play, ClipboardCheck, Edit3, Users, FlaskConical, MapPin } from 'lucide-react';

export default function SectionDetailPage() {
  const params = useParams();
  const sectionId = params.id as string;
  const user = useAuth((s) => s.user);

  const { data: section, isLoading } = useQuery<any>({
    queryKey: ['section', sectionId],
    queryFn: () => api.get(`/trainers/me/sections/${sectionId}`).then(r => r.data),
    enabled: !!user?.trainerId && !!sectionId,
  });

  if (!user?.trainerId) return <div className="card text-center py-12">للمدربين فقط.</div>;
  if (isLoading) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;
  if (!section) return <div className="text-slate-500 text-center py-8">الشعبة غير موجودة.</div>;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs text-slate-400 font-mono">{section.course.code}</div>
        <h1 className="text-2xl font-bold mt-1">{section.course.nameAr}</h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
          <span>{section.term}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Users size={14} /> {section.enrollments?.length ?? 0} متدرب</span>
          {section.isLab && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-600">
                <FlaskConical size={14} /> معمل/ورشة
              </span>
            </>
          )}
        </div>
      </header>

      {/* Schedule */}
      {section.schedule && Array.isArray(section.schedule) && section.schedule.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-500 mb-2">المواعيد</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            {section.schedule.map((slot: any, i: number) => (
              <div key={i} className="card text-sm">
                <div className="font-medium">{slot.day} · {slot.from}–{slot.to}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin size={11} /> {slot.room}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action buttons */}
      <section className="grid grid-cols-3 gap-3">
        <Link href={`/dashboard/me/sections/${sectionId}/start`}
          className="card text-center hover:bg-emerald-50 hover:border-emerald-300 hover:scale-[1.02] transition">
          <div className="h-12 w-12 mx-auto rounded-full bg-emerald-100 grid place-items-center text-emerald-700 mb-2">
            <Play size={20} />
          </div>
          <div className="font-semibold text-sm">بدء الحصة</div>
          {section.isLab && <div className="text-xs text-amber-600 mt-1">+ فحص سلامة</div>}
        </Link>

        <Link href={`/dashboard/me/sections/${sectionId}/attendance`}
          className="card text-center hover:bg-blue-50 hover:border-blue-300 hover:scale-[1.02] transition">
          <div className="h-12 w-12 mx-auto rounded-full bg-blue-100 grid place-items-center text-blue-700 mb-2">
            <ClipboardCheck size={20} />
          </div>
          <div className="font-semibold text-sm">رصد حضور</div>
        </Link>

        <Link href={`/dashboard/me/sections/${sectionId}/grades`}
          className="card text-center hover:bg-amber-50 hover:border-amber-300 hover:scale-[1.02] transition">
          <div className="h-12 w-12 mx-auto rounded-full bg-amber-100 grid place-items-center text-amber-700 mb-2">
            <Edit3 size={20} />
          </div>
          <div className="font-semibold text-sm">رصد درجات</div>
        </Link>
      </section>

      {/* Students list */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">المتدربون ({section.enrollments?.length ?? 0})</h3>
        <div className="card">
          {section.enrollments?.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">لا توجد تسجيلات.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {section.enrollments?.map((e: any) => (
                <Link key={e.id}
                  href={`/dashboard/me/sections/${sectionId}/students/${e.trainee.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-slate-50 px-2 -mx-2 rounded">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-200 grid place-items-center text-slate-600 text-sm font-bold">
                      {e.trainee.fullNameAr.split(' ')[0].charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{e.trainee.fullNameAr}</div>
                      <div className="text-xs text-slate-500 font-mono">{e.trainee.studentNumber}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {e.grade !== null && e.grade !== undefined ? `الدرجة: ${e.grade}` : 'لم يُقيّم'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
