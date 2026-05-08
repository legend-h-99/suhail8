'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Lock, Users, Building2, Trash2, Plus } from 'lucide-react';

export default function StudentProfilePage() {
  const params = useParams();
  const qc = useQueryClient();
  const traineeId = params.traineeId as string;
  const user = useAuth((s) => s.user);

  const { data: trainee } = useQuery<any>({
    queryKey: ['trainee', traineeId],
    queryFn: () => api.get(`/trainees/${traineeId}`).then(r => r.data),
    enabled: !!traineeId,
  });

  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ['trainer-notes', traineeId],
    queryFn: () => api.get(`/trainers/me/notes?traineeId=${traineeId}`).then(r => r.data),
    enabled: !!user?.trainerId && !!traineeId,
  });

  const { data: attendance } = useQuery<any[]>({
    queryKey: ['attendance-report', traineeId],
    queryFn: () => api.get(`/academic/attendance/trainee/${traineeId}/report`).then(r => r.data),
    enabled: !!traineeId,
  });

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'TEAM' | 'ADMINISTRATIVE'>('PRIVATE');

  const createNote = useMutation({
    mutationFn: () => api.post('/trainers/me/notes', { traineeId, body: noteBody, visibility }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainer-notes', traineeId] });
      setNoteBody(''); setShowNoteForm(false);
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.delete(`/trainers/me/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trainer-notes', traineeId] }),
  });

  const VIS_LABEL: Record<string, { label: string; icon: any; color: string }> = {
    PRIVATE: { label: 'خاص بي', icon: Lock, color: 'text-slate-600' },
    TEAM: { label: 'لمدربي القسم', icon: Users, color: 'text-blue-600' },
    ADMINISTRATIVE: { label: 'للإدارة', icon: Building2, color: 'text-amber-600' },
  };

  if (!trainee) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <header className="card flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary-100 grid place-items-center text-primary-700 text-xl font-bold">
          {trainee.fullNameAr.split(' ')[0].charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{trainee.fullNameAr}</h1>
          <div className="text-sm text-slate-500 mt-0.5 font-mono">{trainee.studentNumber}</div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="badge bg-slate-100">{trainee.program?.nameAr ?? '—'}</span>
            <span className="badge bg-slate-100">{trainee.status}</span>
            {trainee.gpa && <span className="badge bg-emerald-50 text-emerald-700">GPA: {trainee.gpa}</span>}
          </div>
        </div>
      </header>

      {/* تنبيه إنذارات */}
      {trainee.warnings && trainee.warnings.length > 0 && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="text-sm">
            <strong className="text-amber-900">⚠️ {trainee.warnings.length} إنذار أكاديمي ساري</strong>
          </div>
        </div>
      )}

      {/* الحضور */}
      {attendance && attendance.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">سجل الحضور حسب المقرر</h3>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-right text-xs">المقرر</th>
                  <th className="p-2 text-right text-xs">الفصل</th>
                  <th className="p-2 text-right text-xs">حاضر</th>
                  <th className="p-2 text-right text-xs">غائب</th>
                  <th className="p-2 text-right text-xs">متأخر</th>
                  <th className="p-2 text-right text-xs">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((r: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{r.course}</td>
                    <td className="p-2 text-xs text-slate-500">{r.term}</td>
                    <td className="p-2 font-mono">{r.present}</td>
                    <td className="p-2 font-mono text-red-600">{r.absent}</td>
                    <td className="p-2 font-mono text-amber-600">{r.late}</td>
                    <td className="p-2 font-mono font-bold">
                      {r.rate !== null ? `${r.rate}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ملاحظاتي */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">ملاحظاتي عنه ({notes.length})</h3>
          <button onClick={() => setShowNoteForm(!showNoteForm)}
            className="text-sm text-primary hover:underline flex items-center gap-1">
            <Plus size={14} /> إضافة ملاحظة
          </button>
        </div>

        {showNoteForm && (
          <div className="card mb-3">
            <textarea
              className="input"
              rows={3}
              placeholder="ملاحظة شخصية للمتابعة..."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
            />
            <div className="flex items-center justify-between mt-2">
              <select className="input max-w-xs"
                value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
                <option value="PRIVATE">🔒 خاصة بي فقط</option>
                <option value="TEAM">👥 لمدربي القسم</option>
                <option value="ADMINISTRATIVE">🏢 للإدارة</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowNoteForm(false)} className="btn-secondary">إلغاء</button>
                <button onClick={() => createNote.mutate()}
                  disabled={!noteBody || createNote.isPending}
                  className="btn-primary">حفظ</button>
              </div>
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="card text-center text-slate-400 py-6 text-sm">لا توجد ملاحظات.</div>
        ) : (
          <div className="space-y-2">
            {notes.map((n: any) => {
              const cfg = VIS_LABEL[n.visibility];
              const Icon = cfg.icon;
              return (
                <div key={n.id} className="card flex items-start gap-3">
                  <Icon size={16} className={cfg.color + ' shrink-0 mt-1'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm whitespace-pre-line">{n.body}</p>
                    <div className="text-xs text-slate-400 mt-1">
                      {cfg.label} · {new Date(n.createdAt).toLocaleString('ar-SA')}
                    </div>
                  </div>
                  <button onClick={() => deleteNote.mutate(n.id)}
                    className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
