# Job Stories ورحلات الأدوار المتخصصة الـ12

> تطبيق RACI + RBAC + Authentication + Authorization + Accounting لكل دور متخصص في الهيكل الرسمي.

---

## ١. أمين المجلس (COUNCIL_SECRETARY)

### Authentication
- **الحساب التجريبي**: `council-sec@cci-riyadh.edu.sa` / `Password@123`
- **JWT Token**: 15 دقيقة + Refresh Token 30 يوم

### Authorization (الصلاحيات: 7)
```
council.meeting.create        ← جدولة اجتماع
council.decision.create       ← تسجيل قرار
council.meeting.minutes_submit ← رفع المحضر للاعتماد
council.minutes.draft         ← صياغة المحاضر
council.agenda.prepare        ← إعداد جدول الأعمال
council.bonus.calculate       ← إعداد بيانات المكافآت
hr.employee.read              ← عرض الموظفين (للدعوات)
```

### Accounting
- كل تعديل (إنشاء اجتماع، تسجيل قرار، رفع محضر) → audit_log تلقائي
- تتبع: من، متى، IP، التغيير

### Job Stories
```
When إنشاء اجتماع جديد للمجلس،
I want to إعداد جدول الأعمال + الدعوات + التقاويم في 5 دقائق،
So I can أركز على المحتوى وليس على الإجراءات.
```

```
When انتهت الجلسة،
I want to كتابة المحضر مباشرة من جوالي + إرفاق التوقيعات،
So I can أُسلّم خلال 24 ساعة بدلاً من أسبوع.
```

### Customer Journey
```
1. الإعداد قبل الجلسة (3 أيام قبل)
   → جدولة الاجتماع + إعداد جدول الأعمال + إرسال الدعوات
2. أثناء الجلسة
   → تسجيل المداخلات والقرارات + متابعة التصويت
3. بعد الجلسة (نفس اليوم)
   → كتابة المحضر + رفع للاعتماد
4. متابعة (أسبوعياً)
   → متابعة تنفيذ القرارات + تذكير الجهات + مكافآت الأعضاء
```

### الشاشات المتاحة
- `/dashboard/me/council-sec` ✅ — لوحته
- `/dashboard/council` — جدولة + قرارات
- `/dashboard/users` — للدعوات

---

## ٢. مدير المعهد (INSTITUTE_DIRECTOR)

### Authentication
- **الحساب**: `institute-dir@cci-riyadh.edu.sa`

### Authorization (12 صلاحية)
- نفس صلاحيات العميد لكن **scope محدود للمعهد التابع**
- `institute.manage`, `institute.report`
- `hr.employee.read/update`, `finance.purchase.read`, `finance.budget.read`
- `trainees.read`, `trainers.read`
- `council.meeting.create`

### Job Stories
```
When استلمت تقرير ربع سنوي للمعهد،
I want to رفعه للعميد بنقرة واحدة،
So I can أركّز على التشغيل بدلاً من البريد.
```

### الرحلة
```
شهرياً → اجتماع موظفي المعهد + متابعة المؤشرات
ربع سنوياً → تقرير للعميد
سنوياً → موازنة + خطة المعهد
```

---

## ٣. أمين المستودع (WAREHOUSE_KEEPER)

### Authentication & Authorization
- `warehouse@cci-riyadh.edu.sa` · 5 صلاحيات
- `warehouse.receive/dispatch/inventory/classify`, `finance.purchase.read`

### Job Stories
```
When تصل شحنة جديدة،
I want to تصنيفها وإدخالها في 3 خطوات (صورة + barcode + موقع)،
So I can أنهيها قبل الذهاب للاستراحة.
```

```
When طلب الإدارة جرد سنوي،
I want to تقرير تلقائي بمجموع اللوازم + النواقص،
So I can أُسلّمه خلال يوم واحد.
```

### الرحلة
```
يومياً  → استلام/صرف لوازم
أسبوعياً → جرد جزئي
شهرياً → تقرير حركة المستودع
سنوياً → جرد شامل
```

### الشاشات
- `/dashboard/me/warehouse` ✅ — لوحة الجرد + الفئات + التنبيهات

---

## ٤. أمين الصندوق (TREASURY_KEEPER)

### Authentication & Authorization
- `treasury@cci-riyadh.edu.sa` · 6 صلاحيات
- `treasury.receive/disburse/reconcile/subfund.manage`

### Job Stories
```
When تستلم نقد أو شيك،
I want to تسجيله مع رقم الإيصال + المصدر + الغرض،
So I can أتجنّب أي خطأ في الموقف الشهري.
```

```
When نهاية الشهر،
I want to تقرير "الموقف المالي" تلقائي مع جميع الحركات،
So I can أرفعه خلال ساعتين بدلاً من يومين.
```

### الرحلة
```
يومياً  → استلام/صرف نقد
أسبوعياً → مراجعة جزئية
شهرياً → الموقف المالي الشهري
ربع سنوياً → الموازنة وتجهيز مشروعها
```

---

## ٥. مدقق شؤون الموظفين (HR_AUDITOR)

### Authentication & Authorization
- `hr-audit@cci-riyadh.edu.sa` · 6 صلاحيات
- `hr.audit.attendance/compliance/files_check`, `hr.recruitment.process`

### Job Stories
```
When استلم بيانات الحضور،
I want to تنبيه تلقائي بمن تجاوز التأخر السماحي،
So I can أبدأ الإجراء النظامي مبكراً.
```

```
When يطلب الموظف تحديث ملفه،
I want to فحص الوثائق المرفقة + اعتماد التحديث،
So I can أحافظ على ملفات سليمة 100%.
```

### الرحلة
```
يومياً  → فحص الحضور
أسبوعياً → تدقيق ملفات
شهرياً → تقرير الالتزام للوكيل
```

---

## ٦. طبيب العيادة (DOCTOR)

### Authentication & Authorization
- `doctor@cci-riyadh.edu.sa` · 6 صلاحيات
- `clinic.examine/prescribe/refer/awareness`, `services.medical.*`

### Job Stories
```
When يحضر متدرب بعد الحادث،
I want to فتح ملفه + كشف + توصية بـ 3 ضغطات،
So I can أعالجه بسرعة وأوثّق كل شيء.
```

```
When شهر الفحص الدوري،
I want to قائمة بالمنسوبين الذين يحتاجون الفحص + إرسال إشعار،
So I can أكتشف الأمراض المزمنة قبل تفاقمها.
```

### الرحلة
```
يومياً  → كشف وعلاج
أسبوعياً → جولات تفقد + إعداد دورات
شهرياً → تقرير صحي + طلب أدوية
```

### الشاشات
- `/dashboard/me/clinic` ✅ — الزيارات + التشخيصات + الحالات المزمنة

---

## ٧. مراقب وحدة الرقابة (MONITOR)

### Authentication & Authorization
- `monitor@cci-riyadh.edu.sa` · 6 صلاحيات
- `monitoring.tour/absence_report/observation`, `services.security.read`, `hr.audit.attendance`

### Job Stories
```
When بدأت دوامي،
I want to جولة سريعة على المعامل + تسجيل ملاحظات،
So I can أوثّق حالة الانضباط فعلياً.
```

```
When غاب موظف 3 أيام متتالية،
I want to تقرير تلقائي + إشعار للشؤون الإدارية،
So I can أبدأ الإجراء قبل أن يصبح متراكماً.
```

### الرحلة
```
يومياً  → جولات + تقرير الحضور
أسبوعياً → تقرير الملاحظات
شهرياً → تقرير الانضباط الشامل
سنوياً → خطة الرقابة
```

### الشاشات
- `/dashboard/me/monitoring` ✅ — حضور اليوم + الحوادث + المؤشرات

---

## ٨. مرشد أكاديمي (GUIDANCE_COUNSELOR)

### Authentication & Authorization
- `guidance@cci-riyadh.edu.sa` · 4 صلاحيات
- `guidance.counseling/gifted_care`, `trainees.read`, `trainees.warning.issue`

### Job Stories
```
When يأتي متدرب تحت 2.0 GPA،
I want to رؤية تاريخه الكامل + اقتراح خطة تعزيز،
So I can أساعده فعلياً وليس مجرد جلسة شكلية.
```

```
When يكتشف مدرب موهوباً،
I want to توصية بإلحاقه بمسابقة + متابعته،
So I can أنميه قبل أن يضيع.
```

---

## ٩. منسق الأنشطة (ACTIVITIES_COORDINATOR)

### Authentication & Authorization
- `activities@cci-riyadh.edu.sa` · 2 صلاحية
- `activities.organize`, `trainees.read`

### Job Stories
```
When بداية الفصل،
I want to جدولة 5 أنشطة لاصفية + إرسال للمتدربين،
So I can أحقق هدف "متدرب نشط" المعتمد.
```

---

## ١٠. منسق التنسيق الوظيفي (JOB_COORDINATOR)

### Authentication & Authorization
- `job-coord@cci-riyadh.edu.sa` · 2 صلاحية
- `job_coord.placement`, `trainees.read`

### Job Stories
```
When يتخرج فوج جديد،
I want to قائمة الخريجين + الوظائف المتاحة + ربط آلي،
So I can أحقق نسبة التوظيف المستهدفة 70%+.
```

---

## ١١. منسق التدريب التعاوني (COOP_COORDINATOR)

### Authentication & Authorization
- `coop-coord@cci-riyadh.edu.sa` · 3 صلاحيات
- `coop.assign_supervisor`, `trainees.read`, `trainers.read`

### Job Stories
```
When يبدأ متدرب تدريبه التعاوني،
I want to تحديد مشرف ميداني + قنوات تواصل + متابعة،
So I can أضمن جدية البرنامج.
```

---

## ١٢. منسق المناهج والإشراف (CURRICULUM_COORDINATOR)

### Authentication & Authorization
- `curriculum@cci-riyadh.edu.sa` · 3 صلاحيات
- `curriculum.review`, `dept.curriculum_review.create`, `trainers.read`

### Job Stories
```
When ينتهي الفصل،
I want to جمع ملاحظات المدربين على الحقائب + تحليلها،
So I can أعدّ مراجعة سنوية مبنية على بيانات.
```

---

## مصفوفة RACI الموحّدة (الأدوار الـ 26 + العمليات الرئيسية)

| العملية | عميد | وكيل تدريب | رئيس قسم | مدرب | أمين مجلس | مدير معهد | أمين مستودع | أمين صندوق | مدقق HR | طبيب | مراقب |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| اعتماد إجازة | A | R | C | I | — | C | — | — | I | — | I |
| تشكيل لجنة | A | C | C | — | R | C | — | — | — | — | — |
| رفع محضر اجتماع | A | I | I | — | R | I | — | — | — | — | — |
| اعتماد ميزانية قسم | A | C | R | — | — | C | — | I | — | — | — |
| استلام شحنة | I | I | I | — | — | I | R | — | — | — | — |
| صرف نقد | I | — | — | — | — | I | I | R | — | — | — |
| تدقيق حضور موظف | A | — | C | — | — | C | — | — | R | — | C |
| كشف طبي | A | — | — | — | — | I | — | — | I | R | — |
| جولة رقابية | A | — | C | — | — | C | — | — | C | — | R |

---

## الخلاصة

النظام الآن يطبّق:
- ✅ **Authentication**: JWT + Refresh + Argon2 + Sessions (لكل المستخدمين الـ87)
- ✅ **Authorization**: 111 صلاحية × 26 دور مع scope (TENANT/UNIT/DEPT)
- ✅ **Accounting**: Audit Logs تلقائياً لكل تعديل
- ✅ **RACI**: مصفوفة موضحة في `/dashboard/admin/role-matrix`
- ✅ **شاشات حسب الدور**: 39 شاشة، كل دور يشاهد منها ما يخصه فقط
