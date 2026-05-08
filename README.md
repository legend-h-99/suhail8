# نظام ERP لكلية الاتصالات والمعلومات بالرياض

نظام إدارة متكامل (ERP) للكليات التقنية فئة A، مبني وفق الهيكل التنظيمي والصلاحيات والمهام التشغيلية الرسمية. الإصدار الحالي مُعدّ لـ **كلية الاتصالات والمعلومات بالرياض** كنموذج عمل (Tenant)، مع بنية قابلة للتوسع لاستيعاب فروع وكليات أخرى.

---

## 📦 ما تم بناؤه

| الطبقة | التفاصيل |
|---|---|
| **Backend** | NestJS 10 + TypeScript + Prisma 5 + Postgres 16 |
| **Frontend** | Next.js 15 + React 19 + Tailwind CSS + RTL عربي |
| **Auth** | JWT (Access + Refresh) + Argon2 + Sessions |
| **RBAC** | أدوار + صلاحيات ديناميكية + Position-based budget limits |
| **Multi-tenant** | عزل بـ tenantId + CLS context + Tenant Interceptor |
| **Workflow Engine** | محرك سير عمل عام (LEAVE / PR / MEETING_MINUTES / EVALUATION / GRADUATION) |
| **Audit** | Audit Log تلقائي على كل عملية تعديل |
| **API Docs** | Swagger UI مدمج |
| **Docker** | docker-compose جاهز (Postgres + API + Web) |

---

## 🏗️ الـ Modules

### مكتمل بالكامل (Production-ready CRUD + Workflows)

1. **Auth** — تسجيل الدخول، JWT، Refresh Tokens، Sessions، MFA-ready
2. **Org** — الهيكل التنظيمي الكامل (40+ نوع إدارة، شجرة هرمية، Positions، Assignments)
3. **Users / Roles** — RBAC مع scope (TENANT/DEPARTMENT/UNIT)، 50+ permission
4. **HR** — الموظفون، الإجازات (مع سير اعتماد متعدد الخطوات)، التقييمات، الحضور
5. **Council** — مجلس المنشأة، الاجتماعات، القرارات، التصويت، اعتماد المحاضر
6. **Finance** — الميزانيات، طلبات الشراء (سقف العميد 100,000 ر.س + ترقية تلقائية)

### Stubs قابلة للاستخدام (CRUD أساسي + ready to extend)

7. **Trainees** — شؤون المتدربين، الإنذارات، التدريب التعاوني، التخرج
8. **Trainers** — شؤون المدربين، النصاب التدريبي، خطط التطوير
9. **Academic** — البرامج، المقررات، الشُّعب، التسجيل، الدرجات
10. **LMS** — مقررات إلكترونية، بنوك أسئلة، اختبارات، التسليمات
11. **IT** — Helpdesk، التذاكر، الأصول التقنية
12. **Quality** — KPIs، الاستبيانات، إدارة المخاطر
13. **Community** — مركز خدمة المجتمع، الدورات، التسجيل، الشهادات
14. **Research** — مشاريع البحث، التمويل، الابتكارات
15. **General Services** — الصيانة، الأمن، العيادة

---

## 🚀 التشغيل السريع

### الخيار 1: Docker (الأسرع)

```bash
# من جذر المشروع
docker compose up --build
```

ثم افتح:
- **الواجهة**: http://localhost:3000
- **API Swagger**: http://localhost:4000/docs
- **API**: http://localhost:4000/api/v1

أول تشغيل سيقوم تلقائياً بـ:
- إنشاء قاعدة البيانات
- تشغيل الـ migrations
- تشغيل seed data بأسماء كلية الاتصالات والمعلومات بالرياض

### الخيار 2: تشغيل محلي بدون Docker

```bash
# 1. شغّل Postgres محلياً (أو عبر Docker فقط)
docker compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev          # → http://localhost:4000

# 3. Frontend (terminal آخر)
cd ../frontend
cp .env.example .env.local
npm install --legacy-peer-deps
npm run dev                # → http://localhost:3000
```

---

## 🔐 حسابات تجريبية

كلمة المرور لجميع الحسابات: **`Password@123`**

| البريد | الدور | الاستخدام |
|---|---|---|
| `admin@cci-riyadh.edu.sa` | Super Admin | كل شيء |
| `dean@cci-riyadh.edu.sa` | عميد الكلية | اعتماد طلبات حتى 100,000 ر.س |
| `vd-trainees@cci-riyadh.edu.sa` | وكيل شؤون المتدربين | |
| `vd-trainers@cci-riyadh.edu.sa` | وكيل شؤون المدربين | |
| `vd-quality@cci-riyadh.edu.sa` | وكيل الجودة | |
| `it-mgr@cci-riyadh.edu.sa` | مدير تقنية المعلومات | |
| `finance@cci-riyadh.edu.sa` | محاسب | |
| `trainer1@cci-riyadh.edu.sa` | مدرب | |
| `trainee1@cci-riyadh.edu.sa` | متدرب | |

---

## 📁 بنية المشروع

```
.
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # Schema شامل (50+ model)
│   │   └── seed.ts           # Seed بأسماء كلية الاتصالات والمعلومات
│   ├── src/
│   │   ├── auth/             # JWT + RBAC + Permissions
│   │   ├── tenancy/          # Multi-tenant context
│   │   ├── audit/            # Audit logs
│   │   ├── workflow/         # محرك سير العمل
│   │   ├── common/           # Decorators, Guards, Filters
│   │   └── modules/
│   │       ├── org/          # الهيكل التنظيمي
│   │       ├── users/        # المستخدمون
│   │       ├── roles/        # الأدوار والصلاحيات
│   │       ├── hr/           # الموظفون والإجازات
│   │       ├── council/      # المجلس والاجتماعات
│   │       ├── finance/      # الشؤون المالية
│   │       ├── trainees/     # شؤون المتدربين
│   │       ├── trainers/     # شؤون المدربين
│   │       ├── academic/     # البرامج والمقررات
│   │       ├── lms/          # التدرب الإلكتروني
│   │       ├── it/           # تقنية المعلومات
│   │       ├── quality/      # الجودة والمؤشرات
│   │       ├── community/    # مركز خدمة المجتمع
│   │       ├── research/     # البحث والابتكار
│   │       └── services-general/  # الخدمات العامة
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                 # Next.js 15 RTL
│   ├── app/
│   │   ├── login/            # صفحة تسجيل الدخول
│   │   ├── dashboard/
│   │   │   ├── page.tsx      # اللوحة الرئيسية
│   │   │   ├── inbox/        # صندوق الاعتمادات
│   │   │   ├── org/          # شجرة الهيكل
│   │   │   └── ...
│   │   └── globals.css
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── auth.ts
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🔄 سير الاعتمادات (Workflow Engine)

النظام يحتوي على **محرك سير عمل ديناميكي** يدعم:

- خطوات متعددة بدور مطلوب لكل خطوة
- شروط منطقية (مثل: إذا المبلغ > 100,000 → ترقى للمدير العام)
- SLA لكل خطوة
- Inbox لكل دور بالاعتمادات المعلقة

### Workflows جاهزة في الـ seed:

| الكود | الوصف | الخطوات |
|---|---|---|
| `LEAVE_REQUEST` | طلب إجازة | رئيس قسم → وكيل → عميد |
| `PR_APPROVAL` | اعتماد طلب شراء | رئيس قسم → مالية → عميد (≤100K) أو مدير عام (>100K) |
| `MEETING_MINUTES` | اعتماد محضر اجتماع | أمين المجلس → عميد |
| `EVALUATION` | اعتماد تقييم أداء | عميد |
| `GRADUATION` | اعتماد التخرج | قبول → وكيل → عميد |

---

## 🔐 نموذج RBAC

- **Permission code**: `<module>.<resource>.<action>` (مثال: `finance.purchase.approve_dean`)
- **Role scope**: `GLOBAL` / `TENANT` / `DEPARTMENT` / `UNIT`
- **Position budget limits**: العميد 100,000 ر.س، الوكلاء 30,000، رؤساء الأقسام 10,000

أمثلة من الصلاحيات المدمجة:
- `council.meeting.create` — جدولة اجتماع
- `finance.purchase.approve_dean` — اعتماد عميد ≤ 100,000
- `hr.leave.approve_dean` — اعتماد إجازة على مستوى العميد
- `trainees.warning.issue` — إصدار إنذار أكاديمي

---

## 🧪 خطوات الاختبار اليدوي

1. سجّل دخول كـ `dean@` → افتح "صندوق اعتماداتي"
2. سجّل دخول كـ `vd-trainees@` في تبويب آخر → اذهب إلى HR / Leaves وقدّم طلب إجازة لموظف
3. ارجع للعميد → ستظهر الإجازة في صندوق الاعتمادات → موافقة
4. اذهب إلى Org → لاحظ الشجرة الكاملة للهيكل التنظيمي
5. اذهب إلى Finance → قدّم طلب شراء بمبلغ مختلف ولاحظ كيف يتغير سير الاعتماد

---

## 🛠️ أوامر مفيدة

```bash
# Backend
cd backend
npm run prisma:studio          # GUI لقاعدة البيانات
npm run prisma:migrate         # إنشاء migration جديدة
npm run prisma:seed            # إعادة تشغيل seed
npm run test                   # تشغيل الاختبارات

# Frontend
cd frontend
npm run build                  # بناء للإنتاج
npm run lint
```

---

## 🔮 الخطوات التالية المقترحة

- [ ] إضافة E2E tests (Playwright) لكل سير اعتماد
- [ ] دمج SMS/Email عبر provider (Twilio/SES)
- [ ] رفع الملفات (S3-compatible)
- [ ] لوحات تحكم تخصصية لكل دور (عميد / وكيل / متدرب)
- [ ] تكامل مع نظام البصمة لاستيراد الحضور
- [ ] تقارير PDF بالعربي (مع pdfmake أو puppeteer)
- [ ] Dashboard analytics مع Recharts
- [ ] Notifications service مع SSE/WebSocket
- [ ] Mobile app (React Native أو PWA)

---

## 📜 الترخيص

داخلي / للاستخدام التعليمي.
