'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Department {
  id: string;
  code: string;
  nameAr: string;
  type: string;
  children?: Department[];
}

function TreeNode({ d, level = 0 }: { d: Department; level?: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50"
        style={{ paddingInlineStart: `${level * 20 + 12}px` }}
      >
        <span className="text-sm font-medium">{d.nameAr}</span>
        <span className="badge bg-slate-100 text-slate-600 text-[10px]">{d.code}</span>
      </div>
      {d.children?.map((c) => <TreeNode key={c.id} d={c} level={level + 1} />)}
    </div>
  );
}

export default function OrgPage() {
  const { data = [], isLoading } = useQuery<Department[]>({
    queryKey: ['org', 'tree'],
    queryFn: () => api.get('/org/tree').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">الهيكل التنظيمي</h1>
        <p className="text-slate-500 mt-1">شجرة الإدارات والأقسام والوحدات</p>
      </header>

      <div className="card">
        {isLoading ? (
          <div className="text-slate-500">جارٍ التحميل...</div>
        ) : (
          <div className="space-y-1">
            {data.map((d) => <TreeNode key={d.id} d={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
