import Link from 'next/link';

export default function HrIndexPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">الموارد البشرية</h1>
        <p className="text-slate-500 mt-1">الموظفون، الإجازات، التقييمات</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/dashboard/hr/employees" className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
          <div className="font-medium">الموظفون</div>
          <div className="text-sm text-slate-500 mt-1">قائمة الموظفين والتفاصيل</div>
        </Link>
        <Link href="/dashboard/hr/leaves" className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
          <div className="font-medium">الإجازات</div>
          <div className="text-sm text-slate-500 mt-1">طلبات الإجازة والاعتمادات</div>
        </Link>
      </div>
    </div>
  );
}
