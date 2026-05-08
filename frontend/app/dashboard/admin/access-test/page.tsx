'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Check, X, Lock, Unlock, User } from 'lucide-react';

interface AccessData {
  user: { id: string; email: string; fullNameAr: string; status: string };
  roles: { code: string; nameAr: string }[];
  profile: { isEmployee: boolean; isTrainer: boolean; isTrainee: boolean; department?: string; positions: string[] };
  permissions: { count: number; list: string[] };
  screens: {
    total: number;
    accessibleCount: number;
    list: { path: string; label: string; allowed: boolean; reason: string }[];
  };
}

export default function AccessTestPage() {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | 'me'>('me');

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['users-list', search],
    queryFn: () => api.get(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
  });

  const { data, isLoading } = useQuery<AccessData>({
    queryKey: ['access-test', selectedUserId],
    queryFn: () =>
      api.get(`/roles/matrix/access-test/${selectedUserId}`).then(r => r.data),
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">اختبار الوصول</h1>
        <p className="text-slate-500 mt-1">ماذا يمكن لكل مستخدم أن يشاهد ويفعل في النظام</p>
      </header>

      {/* User selector */}
      <div className="card">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedUserId('me')}
            className={`btn ${selectedUserId === 'me' ? 'btn-primary' : 'btn-secondary'}`}>
            🙋 أنا
          </button>
          <input className="input flex-1" placeholder="ابحث عن مستخدم..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-xs"
            value={selectedUserId === 'me' ? '' : selectedUserId}
            onChange={(e) => e.target.value && setSelectedUserId(e.target.value)}>
            <option value="">— اختر مستخدم —</option>
            {users.slice(0, 20).map((u) => (
              <option key={u.id} value={u.id}>{u.fullNameAr} ({u.email})</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>
      ) : !data ? (
        <div className="text-slate-500 text-center py-8">لا توجد بيانات.</div>
      ) : (
        <>
          {/* Identity */}
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary-100 grid place-items-center text-primary-700 text-xl font-bold">
                <User size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{data.user.fullNameAr}</h2>
                <div className="text-sm text-slate-500" dir="ltr">{data.user.email}</div>
                <div className="flex items-center gap-2 mt-2">
                  {data.roles.map((r) => (
                    <span key={r.code} className="badge bg-primary-50 text-primary-700">
                      {r.code} ({r.nameAr})
                    </span>
                  ))}
                </div>
              </div>
              <span className={`badge ${data.user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}`}>
                {data.user.status === 'ACTIVE' ? 'نشط' : data.user.status}
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-sm">
              <div>
                <div className="text-xs text-slate-500">القسم</div>
                <div className="font-medium">{data.profile.department ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">الوظائف</div>
                <div className="font-medium">{data.profile.positions.join('، ') || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">عدد الصلاحيات</div>
                <div className="font-medium">{data.permissions.count}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">الشاشات المتاحة</div>
                <div className="font-medium">
                  {data.screens.accessibleCount} / {data.screens.total}
                </div>
              </div>
            </div>
          </div>

          {/* Profile flags */}
          <div className="grid grid-cols-3 gap-3">
            <ProfileBadge label="موظف" active={data.profile.isEmployee} />
            <ProfileBadge label="مدرب" active={data.profile.isTrainer} />
            <ProfileBadge label="متدرب" active={data.profile.isTrainee} />
          </div>

          {/* Screens accessibility */}
          <section>
            <h3 className="text-sm font-semibold mb-3">🖥️ الشاشات المتاحة</h3>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-right text-xs">الوصول</th>
                    <th className="p-2 text-right text-xs">الشاشة</th>
                    <th className="p-2 text-right text-xs">المسار</th>
                    <th className="p-2 text-right text-xs">السبب</th>
                  </tr>
                </thead>
                <tbody>
                  {data.screens.list.map((s) => (
                    <tr key={s.path} className={`border-t border-slate-100 ${!s.allowed ? 'bg-red-50/30' : ''}`}>
                      <td className="p-2">
                        {s.allowed ? (
                          <Unlock size={14} className="text-emerald-600" />
                        ) : (
                          <Lock size={14} className="text-red-500" />
                        )}
                      </td>
                      <td className="p-2 font-medium">{s.label}</td>
                      <td className="p-2 font-mono text-xs text-slate-500" dir="ltr">{s.path}</td>
                      <td className="p-2 text-xs text-slate-600">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* All permissions */}
          <section>
            <h3 className="text-sm font-semibold mb-3">🔑 جميع الصلاحيات</h3>
            <div className="card">
              {data.permissions.list.length === 0 ? (
                <p className="text-slate-500 text-sm">لا توجد صلاحيات صريحة (يستخدم النظام عبر mineOnly endpoints).</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.permissions.list.map((p) => (
                    <span key={p} className="badge bg-emerald-50 text-emerald-700 text-[10px] font-mono">{p}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ProfileBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`card text-center ${active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50'}`}>
      <div className={`text-2xl ${active ? 'text-emerald-600' : 'text-slate-300'}`}>
        {active ? '✓' : '—'}
      </div>
      <div className="text-xs text-slate-600 mt-1">{label}</div>
    </div>
  );
}
