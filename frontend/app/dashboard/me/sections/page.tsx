'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Users, MapPin, FlaskConical, ChevronLeft } from 'lucide-react';

interface Section {
  id: string;
  term: string;
  capacity: number;
  enrolled: number;
  isLab: boolean;
  schedule: any;
  course: { code: string; nameAr: string };
  _count: { enrollments: number };
}

export default function MySectionsPage() {
  const user = useAuth((s) => s.user);
  const { data = [], isLoading } = useQuery<Section[]>({
    queryKey: ['my-sections'],
    queryFn: () => api.get('/trainers/me/sections').then(r => r.data),
    enabled: !!user?.trainerId,
  });

  if (!user?.trainerId) return <div className="card text-center py-12">للمدربين فقط.</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">شُعبي</h1>
        <p className="text-slate-500 mt-1">{data.length} شعبة في {data[0]?.term ?? '—'}</p>
      </header>

      {isLoading ? (
        <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((s) => {
            const sched = (s.schedule as any[]) ?? [];
            return (
              <Link key={s.id} href={`/dashboard/me/sections/${s.id}`}
                className="card hover:shadow-md hover:border-primary transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs font-mono text-slate-400">{s.course.code}</div>
                    <div className="font-bold mt-0.5">{s.course.nameAr}</div>
                  </div>
                  {s.isLab && <FlaskConical size={18} className="text-amber-600" />}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users size={12} />
                    <span>{s._count.enrollments}/{s.capacity} متدرب</span>
                  </div>
                  {sched.slice(0, 2).map((slot: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <MapPin size={12} />
                      <span>{slot.day} {slot.from}–{slot.to} · {slot.room}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-primary text-sm">
                  <span>عرض الشعبة</span>
                  <ChevronLeft size={16} />
                </div>
              </Link>
            );
          })}
          {data.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              لا توجد شُعب مسندة لك.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
