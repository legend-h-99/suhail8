'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const DEMO_ACCOUNTS: { email: string; nameAr: string; roleAr: string; group: string }[] = [
  { email: 'dean@cci-riyadh.edu.sa',              nameAr: 'د. خالد العتيبي',       roleAr: 'العميد',             group: 'القيادة' },
  { email: 'vd-quality@cci-riyadh.edu.sa',        nameAr: 'د. عبدالله الزهراني',  roleAr: 'وكيل الجودة',         group: 'القيادة' },
  { email: 'vd-trainees@cci-riyadh.edu.sa',       nameAr: 'د. فهد الشهري',         roleAr: 'وكيل المتدربين',     group: 'القيادة' },
  { email: 'vd-trainers@cci-riyadh.edu.sa',       nameAr: 'د. سلمان الدوسري',     roleAr: 'وكيل المدربين',       group: 'القيادة' },
  { email: 'trainer1@cci-riyadh.edu.sa',          nameAr: 'أ. ياسر السبيعي',      roleAr: 'مدرب',                group: 'تدريب' },
  { email: 'trainee1@cci-riyadh.edu.sa',          nameAr: 'ناصر الحربي',           roleAr: 'متدرب',               group: 'تدريب' },
  { email: 'council-sec@cci-riyadh.edu.sa',       nameAr: 'فهد البقمي',            roleAr: 'أمين المجلس',         group: 'متخصصون' },
  { email: 'warehouse@cci-riyadh.edu.sa',         nameAr: 'بدر الشمري',            roleAr: 'أمين المستودع',       group: 'متخصصون' },
  { email: 'treasury@cci-riyadh.edu.sa',          nameAr: 'تركي المطيري',          roleAr: 'أمين الصندوق',        group: 'متخصصون' },
  { email: 'doctor@cci-riyadh.edu.sa',            nameAr: 'د. عمر القرني',         roleAr: 'طبيب الكلية',         group: 'متخصصون' },
  { email: 'monitor@cci-riyadh.edu.sa',           nameAr: 'مازن البلوي',           roleAr: 'مراقب الاختبارات',    group: 'متخصصون' },
  { email: 'staff-vd-quality@cci-riyadh.edu.sa',  nameAr: 'دعاء العتيبي',          roleAr: 'موظف الجودة',         group: 'موظفون' },
  { email: 'staff-finance@cci-riyadh.edu.sa',     nameAr: 'مشاعل الفيفي',          roleAr: 'موظف المالية',        group: 'موظفون' },
];

const GROUPS = ['القيادة', 'تدريب', 'متخصصون', 'موظفون'];
const DEMO_PASSWORD = 'Password@123';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function performLogin(emailValue: string, passwordValue: string) {
    setError(null);
    try {
      const { data } = await api.post('/auth/login', {
        email: emailValue,
        password: passwordValue,
        tenantSlug: 'cci-riyadh',
      });
      localStorage.setItem('accessToken', data.accessToken);
      const me = await api.get('/auth/me');
      setUser(me.data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.messageAr || 'فشل تسجيل الدخول');
      throw err;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await performLogin(email, password);
    } catch {
      // error already set in performLogin
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(acctEmail: string) {
    setEmail(acctEmail);
    setPassword(DEMO_PASSWORD);
    setLoadingEmail(acctEmail);
    try {
      await performLogin(acctEmail, DEMO_PASSWORD);
    } catch {
      // error already set
    } finally {
      setLoadingEmail(null);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-bl from-primary-700 via-primary-800 to-slate-900 p-4">
      <div className="w-full max-w-3xl">
        <div className="card backdrop-blur">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary text-white grid place-items-center text-2xl font-bold mb-4">
              ك
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              كلية الاتصالات والمعلومات بالرياض
            </h1>
            <p className="text-sm text-slate-500 mt-1">نظام الإدارة المتكامل</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* الفورم اليدوي */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">كلمة المرور</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || loadingEmail !== null} className="btn-primary w-full">
                {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
              </button>

              <p className="text-xs text-slate-500 text-center">
                كلمة المرور لجميع الحسابات التجريبية: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{DEMO_PASSWORD}</code>
              </p>
            </form>

            {/* لوحة الحسابات التجريبية */}
            <div className="border-r border-slate-200 pr-6">
              <h2 className="text-sm font-bold text-slate-700 mb-3">دخول سريع — حسابات تجريبية</h2>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pl-1">
                {GROUPS.map((g) => (
                  <div key={g}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{g}</div>
                    <div className="space-y-1">
                      {DEMO_ACCOUNTS.filter((a) => a.group === g).map((a) => (
                        <button
                          key={a.email}
                          type="button"
                          onClick={() => handleQuickLogin(a.email)}
                          disabled={loadingEmail !== null || loading}
                          className="w-full text-right px-3 py-2 rounded-lg border border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-slate-900 truncate">{a.nameAr}</div>
                              <div className="text-xs text-slate-500 truncate">{a.roleAr}</div>
                            </div>
                            {loadingEmail === a.email ? (
                              <span className="text-xs text-primary-600">⏳</span>
                            ) : (
                              <span className="text-xs text-slate-400 group-hover:text-primary-600">←</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
