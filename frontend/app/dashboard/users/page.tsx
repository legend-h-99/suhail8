'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface UserRole { role: { code: string; nameAr: string } }
interface User {
  id: string;
  email: string;
  fullNameAr: string;
  status: string;
  lastLoginAt?: string;
  userRoles: UserRole[];
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const { data = [], isLoading } = useQuery<User[]>({
    queryKey: ['users', search],
    queryFn: () => api.get(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
  });

  const cols: Column<User>[] = [
    { header: 'الاسم', render: (u) => <span className="font-medium">{u.fullNameAr}</span> },
    { header: 'البريد', render: (u) => <span className="text-slate-500" dir="ltr">{u.email}</span> },
    { header: 'الأدوار', render: (u) => (
      <div className="flex flex-wrap gap-1">
        {u.userRoles.map((r, i) => (
          <span key={i} className="badge bg-primary-50 text-primary-700">{r.role.nameAr}</span>
        ))}
      </div>
    )},
    { header: 'الحالة', render: (u) => (
      <span className={`badge ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
        {u.status === 'ACTIVE' ? 'نشط' : u.status}
      </span>
    )},
    { header: 'آخر دخول', render: (u) => u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-SA') : '—' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">المستخدمون</h1>
        <p className="text-slate-500 mt-1">{data.length} مستخدم</p>
      </header>

      <div className="card">
        <input
          className="input mb-4 max-w-sm"
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <DataTable data={data} columns={cols} loading={isLoading} />
      </div>
    </div>
  );
}
