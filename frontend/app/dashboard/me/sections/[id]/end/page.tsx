'use client';

import { useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Smile, Meh, Frown, Check, AlertCircle, X } from 'lucide-react';

export default function EndClassPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id as string;

  const [mood, setMood] = useState<'GREAT' | 'OK' | 'POOR' | null>(null);
  const [planCompletion, setPlanCompletion] = useState<'FULL' | 'PARTIAL' | 'NONE' | null>(null);
  const [notes, setNotes] = useState('');

  const submit = useMutation({
    mutationFn: () => api.post(`/trainers/me/sections/${sectionId}/end`, {
      mood, planCompletion, notes,
    }),
    onSuccess: () => {
      localStorage.removeItem('cci-class-mode');
      window.dispatchEvent(new Event('class-mode-changed'));
      router.push('/dashboard/me/today');
    },
  });

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <header>
        <h1 className="text-2xl font-bold">إنهاء الحصة</h1>
        <p className="text-slate-500 mt-1">٣ ضغطات لتقرير سريع</p>
      </header>

      {/* 1. Mood */}
      <section>
        <h3 className="text-sm font-semibold mb-3">١. كيف كانت الحصة؟</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: 'GREAT', label: 'ممتازة', icon: Smile, color: 'emerald' },
            { v: 'OK', label: 'عادية', icon: Meh, color: 'slate' },
            { v: 'POOR', label: 'صعبة', icon: Frown, color: 'red' },
          ].map((opt) => {
            const Icon = opt.icon;
            const active = mood === opt.v;
            return (
              <button key={opt.v} onClick={() => setMood(opt.v as any)}
                className={`card flex flex-col items-center gap-2 py-5 transition ${
                  active ? `bg-${opt.color}-50 border-${opt.color}-400 border-2` : 'hover:bg-slate-50'
                }`}>
                <Icon size={32} className={active ? `text-${opt.color}-600` : 'text-slate-400'} />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Plan completion */}
      <section>
        <h3 className="text-sm font-semibold mb-3">٢. هل أكملت الخطة؟</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: 'FULL', label: 'نعم', icon: Check, color: 'emerald' },
            { v: 'PARTIAL', label: 'جزئياً', icon: AlertCircle, color: 'amber' },
            { v: 'NONE', label: 'لا', icon: X, color: 'red' },
          ].map((opt) => {
            const Icon = opt.icon;
            const active = planCompletion === opt.v;
            return (
              <button key={opt.v} onClick={() => setPlanCompletion(opt.v as any)}
                className={`card flex flex-col items-center gap-2 py-5 transition ${
                  active ? `bg-${opt.color}-50 border-${opt.color}-400 border-2` : 'hover:bg-slate-50'
                }`}>
                <Icon size={28} className={active ? `text-${opt.color}-600` : 'text-slate-400'} />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Optional notes */}
      <section>
        <h3 className="text-sm font-semibold mb-2">٣. ملاحظات سريعة (اختيارية)</h3>
        <textarea
          className="input"
          rows={3}
          placeholder="مثال: المتدرب أحمد تأخر، المعمل بحاجة صيانة..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <div className="sticky bottom-4 z-10 space-y-2">
        <button
          onClick={() => submit.mutate()}
          disabled={!mood || !planCompletion || submit.isPending}
          className="w-full btn-primary py-4 text-base shadow-lg disabled:bg-slate-300"
        >
          {submit.isPending ? 'جارٍ الإرسال...' : '✓ إنهاء الحصة'}
        </button>
        <button
          onClick={() => router.back()}
          className="w-full btn-secondary"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
