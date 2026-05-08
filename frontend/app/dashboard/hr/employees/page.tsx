'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column } from '@/components/DataTable';

interface Employee {
  id: string;
  employeeNumber: string;
  fullNameAr: string;
  jobTitleAr: string;
  status: string;
  hireDate: string;
  department?: { nameAr: string; code: string };
  user?: { email: string };
}

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees', search, department],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (department) params.set('departmentId', department);
      return api.get(`/hr/employees?${params}`).then(r => r.data);
    },
  });

  const { data: departments = [] } = useQuery<{ id: string; nameAr: string }[]>({
    queryKey: ['departments-flat'],
    queryFn: () => api.get('/org/departments').then(r => r.data),
  });

  const cols: Column<Employee>[] = [
    { header: 'الرقم', render: (e) => <span className="font-mono text-xs text-slate-500">{e.employeeNumber}</span> },
    { header: 'الاسم', render: (e) => <span className="font-medium">{e.fullNameAr}</span> },
    { header: 'المسمى الوظيفي', render: (e) => e.jobTitleAr },
    { header: 'الإدارة', render: (e) => e.department?.nameAr ?? '—' },
    { header: 'البريد', render: (e) => <span dir="ltr" className="text-slate-500 text-xs">{e.user?.email ?? '—'}</span> },
    { header: 'تاريخ التعيين', render: (e) => new Date(e.hireDate).toLocaleDateString('ar-SA') },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">الموظفون</h1>
        <p className="text-slate-500 mt-1">{employees.length} موظف</p>
      </header>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="input max-w-sm"
            placeholder="بحث بالاسم أو الرقم الوظيفي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input max-w-xs" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">كل الإدارات</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.nameAr}</option>
            ))}
          </select>
        </div>
        <DataTable data={employees} columns={cols} loading={isLoading} />
      </div>
    </div>
  );
}
