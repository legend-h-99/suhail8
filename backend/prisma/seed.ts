/**
 * Seed Data — كلية الاتصالات والمعلومات بالرياض
 *
 * يحتوي على:
 *   - Tenant: cci-riyadh
 *   - الهيكل التنظيمي الكامل (مجلس + عمادة + 3 وكالات + الأقسام والوحدات)
 *   - الأدوار والصلاحيات (50+ permission)
 *   - Workflow definitions (LEAVE_REQUEST, PR_APPROVAL, MEETING_MINUTES, EVALUATION, GRADUATION)
 *   - حسابات تجريبية: عميد، 3 وكلاء، 4 رؤساء أقسام، موظفين، متدربين، مدربين
 *   - برامج ومقررات نموذجية
 *   - مؤشرات جودة ابتدائية
 */
import { PrismaClient, DepartmentType, TenantType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const PASSWORD = 'Password@123';

// --- Permissions catalog ---
const PERMISSIONS = [
  // Org
  ['org.department.create', 'org', 'create', 'department', 'إضافة إدارة'],
  ['org.department.update', 'org', 'update', 'department', 'تعديل إدارة'],
  ['org.department.delete', 'org', 'delete', 'department', 'أرشفة إدارة'],
  ['org.position.manage', 'org', 'manage', 'position', 'إدارة الوظائف'],
  ['org.assignment.manage', 'org', 'manage', 'assignment', 'إدارة التكليفات'],
  // Users / Roles
  ['users.read', 'users', 'read', 'user', 'عرض المستخدمين'],
  ['users.create', 'users', 'create', 'user', 'إضافة مستخدم'],
  ['users.update', 'users', 'update', 'user', 'تعديل مستخدم'],
  ['users.delete', 'users', 'delete', 'user', 'تعطيل مستخدم'],
  ['users.assign_role', 'users', 'assign_role', 'user', 'إسناد أدوار'],
  ['roles.create', 'roles', 'create', 'role', 'إضافة دور'],
  ['roles.update', 'roles', 'update', 'role', 'تعديل دور'],
  // HR
  ['hr.employee.read', 'hr', 'read', 'employee', 'عرض الموظفين'],
  ['hr.employee.create', 'hr', 'create', 'employee', 'إضافة موظف'],
  ['hr.employee.update', 'hr', 'update', 'employee', 'تعديل موظف'],
  ['hr.leave.read', 'hr', 'read', 'leave', 'عرض الإجازات'],
  ['hr.leave.approve_dean', 'hr', 'approve', 'leave', 'اعتماد إجازة (عميد)'],
  // Council
  ['council.create', 'council', 'create', 'council', 'تأسيس مجلس'],
  ['council.member.add', 'council', 'add_member', 'council', 'إضافة عضو'],
  ['council.meeting.create', 'council', 'create', 'meeting', 'جدولة اجتماع'],
  ['council.decision.create', 'council', 'create', 'decision', 'تسجيل قرار'],
  ['council.meeting.minutes_submit', 'council', 'submit', 'minutes', 'رفع المحضر للاعتماد'],
  ['council.meeting.minutes_approve', 'council', 'approve', 'minutes', 'اعتماد المحضر'],
  // Finance
  ['finance.purchase.read', 'finance', 'read', 'purchase', 'عرض طلبات الشراء'],
  ['finance.purchase.create', 'finance', 'create', 'purchase', 'تقديم طلب شراء'],
  ['finance.purchase.approve_dean', 'finance', 'approve', 'purchase', 'اعتماد عميد ≤ 100,000'],
  ['finance.purchase.approve_dg', 'finance', 'approve_dg', 'purchase', 'اعتماد المدير العام للمنطقة'],
  ['finance.budget.read', 'finance', 'read', 'budget', 'عرض الميزانيات'],
  ['finance.budget.update', 'finance', 'update', 'budget', 'تعديل ميزانية'],
  // Trainees
  ['trainees.read', 'trainees', 'read', 'trainee', 'عرض المتدربين'],
  ['trainees.create', 'trainees', 'create', 'trainee', 'تسجيل متدرب'],
  ['trainees.warning.issue', 'trainees', 'issue', 'warning', 'إصدار إنذار'],
  // Trainers
  ['trainers.read', 'trainers', 'read', 'trainer', 'عرض المدربين'],
  ['trainers.load.set', 'trainers', 'set', 'load', 'تحديد النصاب'],
  // Academic
  ['academic.enroll', 'academic', 'enroll', 'enrollment', 'تسجيل في شعبة'],
  ['academic.grade', 'academic', 'grade', 'enrollment', 'رصد درجة'],
  // LMS
  ['lms.course.create', 'lms', 'create', 'course', 'إضافة مقرر إلكتروني'],
  ['lms.exam.create', 'lms', 'create', 'exam', 'إنشاء اختبار'],
  // IT
  ['it.ticket.assign', 'it', 'assign', 'ticket', 'إسناد تذكرة'],
  ['it.ticket.resolve', 'it', 'resolve', 'ticket', 'حل تذكرة'],
  ['it.asset.create', 'it', 'create', 'asset', 'تسجيل أصل'],
  // Quality
  ['quality.kpi.update', 'quality', 'update', 'kpi', 'إدارة المؤشرات'],
  ['quality.kpi.measure', 'quality', 'measure', 'kpi', 'تسجيل قياس'],
  ['quality.survey.create', 'quality', 'create', 'survey', 'إنشاء استبيان'],
  ['quality.risk.register', 'quality', 'register', 'risk', 'تسجيل مخاطرة'],
  // Community
  ['community.course.create', 'community', 'create', 'course', 'إضافة دورة'],
  ['community.payment.record', 'community', 'record', 'payment', 'تسجيل دفعة'],
  ['community.certificate.issue', 'community', 'issue', 'certificate', 'إصدار شهادة'],
  // Research
  ['research.project.create', 'research', 'create', 'project', 'تقديم بحث'],
  ['research.project.approve', 'research', 'approve', 'project', 'اعتماد بحث'],
  ['research.project.complete', 'research', 'complete', 'project', 'إنهاء بحث'],
  // Services
  ['services.security.read', 'services', 'read', 'security', 'عرض الأمن'],
  ['services.security.log', 'services', 'log', 'security', 'تسجيل حادثة'],
  ['services.medical.read', 'services', 'read', 'medical', 'عرض الزيارات الطبية'],
  ['services.medical.record', 'services', 'record', 'medical', 'تسجيل زيارة طبية'],
  // ── Quality (وكيل الجودة + وحدة ضبط الجودة)
  ['quality.plan.create_seasonal', 'quality', 'create', 'seasonal_plan', 'إعداد خطة فصلية للجودة'],
  ['quality.plan.create_yearly', 'quality', 'create', 'yearly_plan', 'إعداد خطة سنوية للجودة'],
  ['quality.team.charter', 'quality', 'charter', 'team', 'تشكيل فرق عمل الجودة'],
  ['quality.improvement_plan.execute', 'quality', 'execute', 'improvement_plan', 'تنفيذ خطط التحسين'],
  ['quality.accreditation.manage', 'quality', 'manage', 'accreditation', 'إدارة الاعتماد الأكاديمي'],
  ['quality.training_outcomes.measure', 'quality', 'measure', 'outcomes', 'قياس نواتج التدريب'],
  ['quality.report.dg_submit', 'quality', 'submit', 'dg_report', 'رفع تقارير الجودة للإدارة العامة'],
  ['quality.nomination.recommend', 'quality', 'recommend', 'nomination', 'ترشيح المنسوبين لدورات خارجية'],
  ['quality.evidence.upload', 'quality', 'upload', 'evidence', 'رفع شواهد الاعتماد'],
  ['quality.coordinator.report.submit', 'quality', 'submit', 'coordinator_report', 'تقرير دوري للمنسق'],
  ['quality.team.task.update', 'quality', 'update', 'team_task', 'تحديث مهام فرق الجودة'],
  ['quality.campaign.create', 'quality', 'create', 'campaign', 'إطلاق حملات ثقافة الجودة'],
  // ── Council Secretariat (أمانة المجلس)
  ['council.minutes.draft', 'council', 'draft', 'minutes', 'صياغة محاضر الاجتماعات'],
  ['council.agenda.prepare', 'council', 'prepare', 'agenda', 'إعداد جداول الأعمال'],
  ['council.bonus.calculate', 'council', 'calculate', 'bonus', 'إعداد بيانات مكافأة الأعضاء'],
  // ── Warehouse Keeper (أمين المستودع)
  ['warehouse.receive', 'warehouse', 'receive', 'goods', 'استلام بضائع'],
  ['warehouse.dispatch', 'warehouse', 'dispatch', 'goods', 'صرف لوازم'],
  ['warehouse.inventory', 'warehouse', 'manage', 'inventory', 'جرد المستودع'],
  ['warehouse.classify', 'warehouse', 'classify', 'goods', 'تصنيف اللوازم'],
  // ── Treasury Keeper (أمين الصندوق)
  ['treasury.receive', 'treasury', 'receive', 'cash', 'استلام نقدي'],
  ['treasury.disburse', 'treasury', 'disburse', 'cash', 'صرف مخصصات'],
  ['treasury.reconcile', 'treasury', 'reconcile', 'monthly', 'تدقيق الموقف الشهري'],
  ['treasury.subfund.manage', 'treasury', 'manage', 'subfund', 'إدارة الصندوق الفرعي للمتدربين'],
  // ── HR Auditor (مدقق شؤون الموظفين)
  ['hr.audit.attendance', 'hr', 'audit', 'attendance', 'تدقيق الحضور والانصراف'],
  ['hr.audit.compliance', 'hr', 'audit', 'compliance', 'تدقيق الالتزام النظامي'],
  ['hr.audit.files_check', 'hr', 'check', 'files', 'تدقيق ملفات الموظفين'],
  ['hr.recruitment.process', 'hr', 'process', 'recruitment', 'إجراءات تعيين موظفين جدد'],
  // ── Doctor (طبيب العيادة)
  ['clinic.examine', 'clinic', 'examine', 'patient', 'الكشف على الحالات المرضية'],
  ['clinic.prescribe', 'clinic', 'prescribe', 'medication', 'وصف أدوية'],
  ['clinic.refer', 'clinic', 'refer', 'hospital', 'تحويل للمستشفى'],
  ['clinic.awareness', 'clinic', 'create', 'awareness', 'دورات وعي صحي'],
  // ── Monitor (مراقب الرقابة)
  ['monitoring.tour', 'monitoring', 'conduct', 'tour', 'إجراء جولات رقابية'],
  ['monitoring.absence_report', 'monitoring', 'report', 'absence', 'رفع تقارير الغياب'],
  ['monitoring.observation', 'monitoring', 'log', 'observation', 'تسجيل ملاحظات الرقابة'],
  // ── Institute Director (مدير المعهد)
  ['institute.manage', 'institute', 'manage', 'institute', 'إدارة المعهد التابع'],
  ['institute.report', 'institute', 'submit', 'report', 'رفع تقارير المعهد للعميد'],
  // ── Specialized Coordinators
  ['guidance.counseling', 'guidance', 'provide', 'counseling', 'تقديم الإرشاد للمتدربين'],
  ['guidance.gifted_care', 'guidance', 'care', 'gifted', 'رعاية الموهوبين والمتعثرين'],
  ['activities.organize', 'activities', 'organize', 'event', 'تنظيم الأنشطة الطلابية'],
  ['job_coord.placement', 'job_coord', 'place', 'graduate', 'توجيه الخريجين للوظائف'],
  ['coop.assign_supervisor', 'coop', 'assign', 'supervisor', 'إسناد مشرفين للتعاوني'],
  ['curriculum.review', 'curriculum', 'review', 'package', 'مراجعة الحقائب التدريبية'],
  // ── Tasks System (نظام المهام العام)
  ['tasks.create', 'tasks', 'create', 'task', 'إنشاء مهمة'],
  ['tasks.assign', 'tasks', 'assign', 'task', 'إسناد مهمة'],
  ['tasks.update_status', 'tasks', 'update', 'task_status', 'تحديث حالة مهمة'],
  ['tasks.delete', 'tasks', 'delete', 'task', 'حذف مهمة'],
  // ── Projects System
  ['projects.create', 'projects', 'create', 'project', 'إنشاء مشروع'],
  ['projects.manage', 'projects', 'manage', 'project', 'إدارة مشروع'],
  ['projects.read', 'projects', 'read', 'project', 'عرض المشاريع'],
  // ── Boards
  ['boards.create', 'boards', 'create', 'board', 'إنشاء لوحة Kanban'],
  ['boards.manage_cards', 'boards', 'manage', 'board_cards', 'إدارة بطاقات اللوحة'],
  // ── AI System
  ['ai.use', 'ai', 'use', 'ai', 'استخدام نظام الذكاء الاصطناعي'],
  ['ai.summarize', 'ai', 'summarize', 'document', 'تلخيص بـ AI'],
  ['ai.analyze', 'ai', 'analyze', 'data', 'تحليل بـ AI'],
  // ── Chatbot
  ['chatbot.use', 'chatbot', 'use', 'chatbot', 'استخدام الدردشة الذكية'],
  // ── Data Lake / Warehouse / Processing
  ['data_lake.upload', 'data', 'upload', 'lake_file', 'رفع ملفات للبحيرة'],
  ['data_lake.read', 'data', 'read', 'lake_file', 'قراءة بحيرة البيانات'],
  ['data_warehouse.read', 'data', 'read', 'warehouse', 'عرض مستودع البيانات'],
  ['data_processing.manage', 'data', 'manage', 'processing_job', 'إدارة معالجة البيانات'],
  // ── Department Head (رئيس قسم تدريبي)
  ['dept.training_plan.create', 'dept', 'create', 'training_plan', 'إعداد خطة تشغيلية للقسم'],
  ['dept.schedule.set', 'dept', 'set', 'schedule', 'وضع الجداول التدريبية'],
  ['dept.supervision_visit.log', 'dept', 'log', 'supervision_visit', 'تسجيل زيارة إشرافية'],
  ['dept.probation.evaluate', 'dept', 'evaluate', 'probation', 'تقييم المدربين الجدد بفترة التجربة'],
  ['dept.equipment_request.submit', 'dept', 'submit', 'equipment_request', 'طلب تجهيزات وخامات تدريبية'],
  ['dept.safety.monitor', 'dept', 'monitor', 'safety', 'رصد السلامة المهنية في الورش'],
  ['dept.report.quarterly_submit', 'dept', 'submit', 'quarterly_report', 'رفع تقرير ربع/فصلي'],
  ['dept.curriculum_review.create', 'dept', 'create', 'curriculum_review', 'تقييم سنوي للحقائب التدريبية'],
  // ── Trainer (المدرب)
  ['trainer.attendance.mark', 'trainer', 'mark', 'self_attendance', 'تسجيل حضور المدرب'],
  ['trainer.section.attendance', 'trainer', 'mark', 'section_attendance', 'تسجيل حضور المتدربين'],
  ['trainer.exam.administer', 'trainer', 'administer', 'exam', 'تطبيق الاختبارات الفصلية والنهائية'],
  ['trainer.report.submit', 'trainer', 'submit', 'periodic_report', 'تقديم تقرير دوري لرئيس القسم'],
  ['trainer.coop.supervise', 'trainer', 'supervise', 'coop', 'الإشراف على التدريب التعاوني'],
  ['trainer.curriculum.feedback', 'trainer', 'feedback', 'curriculum', 'إبداء رأي في الحقائب التدريبية'],
] as const;

// Role → permissions mapping (الأكواد فقط، يقصر منها لكل دور)
const ROLE_PERMISSIONS: Record<string, string[] | '*'> = {
  SUPER_ADMIN: '*',
  DEAN: [
    'org.department.create', 'org.department.update', 'org.position.manage', 'org.assignment.manage',
    'users.read', 'users.create', 'users.update', 'users.assign_role', 'roles.create', 'roles.update',
    'hr.employee.read', 'hr.employee.create', 'hr.employee.update', 'hr.leave.read', 'hr.leave.approve_dean',
    'council.create', 'council.member.add', 'council.meeting.create', 'council.decision.create',
    'council.meeting.minutes_submit', 'council.meeting.minutes_approve',
    'finance.purchase.read', 'finance.purchase.approve_dean', 'finance.budget.read', 'finance.budget.update',
    'trainees.read', 'trainees.warning.issue',
    'trainers.read',
    'quality.kpi.update', 'quality.kpi.measure',
    'research.project.approve', 'research.project.complete',
    'services.security.read', 'services.medical.read',
    // الأنظمة الجديدة
    'tasks.create', 'tasks.assign', 'tasks.update_status', 'tasks.delete',
    'projects.create', 'projects.manage', 'projects.read',
    'boards.create', 'boards.manage_cards',
    'ai.use', 'ai.summarize', 'ai.analyze', 'chatbot.use',
    'data_lake.upload', 'data_lake.read', 'data_warehouse.read', 'data_processing.manage',
  ],
  VICE_DEAN_TRAINEES: [
    'hr.leave.read',
    'trainees.read', 'trainees.create', 'trainees.warning.issue',
    'academic.enroll',
    'council.meeting.create', 'council.decision.create',
    // Tasks/Projects/Boards/AI/Chatbot
    'tasks.create', 'tasks.assign', 'tasks.update_status',
    'projects.create', 'projects.manage', 'projects.read',
    'boards.create', 'boards.manage_cards',
    'ai.use', 'ai.summarize', 'ai.analyze', 'chatbot.use',
    'data_warehouse.read',
  ],
  VICE_DEAN_TRAINERS: [
    'hr.leave.read',
    'trainers.read', 'trainers.load.set',
    'council.meeting.create',
    'tasks.create', 'tasks.assign', 'tasks.update_status',
    'projects.create', 'projects.manage', 'projects.read',
    'boards.create', 'boards.manage_cards',
    'ai.use', 'ai.summarize', 'ai.analyze', 'chatbot.use',
    'data_warehouse.read',
  ],
  VICE_DEAN_QUALITY: [
    'quality.kpi.update', 'quality.kpi.measure', 'quality.survey.create', 'quality.risk.register',
    'quality.plan.create_seasonal', 'quality.plan.create_yearly',
    'quality.team.charter', 'quality.team.task.update',
    'quality.improvement_plan.execute',
    'quality.accreditation.manage', 'quality.evidence.upload',
    'quality.training_outcomes.measure',
    'quality.report.dg_submit',
    'quality.nomination.recommend',
    'quality.campaign.create',
    'council.meeting.create',
    'tasks.create', 'tasks.assign', 'tasks.update_status',
    'projects.create', 'projects.manage', 'projects.read',
    'boards.create', 'boards.manage_cards',
    'ai.use', 'ai.summarize', 'ai.analyze', 'chatbot.use',
    'data_warehouse.read',
  ],
  QUALITY_COORDINATOR: [
    'quality.kpi.measure',
    'quality.survey.create',
    'quality.risk.register',
    'quality.improvement_plan.execute',
    'quality.training_outcomes.measure',
    'quality.team.task.update',
    'quality.evidence.upload',
    'quality.coordinator.report.submit',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards',
    'ai.use', 'chatbot.use',
  ],
  DEPT_HEAD: [
    'hr.employee.read', 'hr.leave.read',
    'trainees.read', 'trainees.warning.issue',
    'trainers.read', 'trainers.load.set',
    'academic.enroll', 'academic.grade',
    'dept.training_plan.create', 'dept.schedule.set',
    'dept.supervision_visit.log', 'dept.probation.evaluate',
    'dept.equipment_request.submit', 'dept.safety.monitor',
    'dept.report.quarterly_submit', 'dept.curriculum_review.create',
    // Tasks/Projects/Boards/AI/Chatbot
    'tasks.create', 'tasks.assign', 'tasks.update_status',
    'projects.create', 'projects.manage', 'projects.read',
    'boards.create', 'boards.manage_cards',
    'ai.use', 'ai.summarize', 'ai.analyze', 'chatbot.use',
    'data_warehouse.read',
  ],
  COORDINATOR: [
    'hr.leave.read',
    'trainees.read', 'trainers.read',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards',
    'ai.use', 'chatbot.use',
  ],
  IT_MANAGER: [
    'it.ticket.assign', 'it.ticket.resolve', 'it.asset.create',
    'users.read',
    'tasks.create', 'tasks.assign', 'tasks.update_status',
    'projects.create', 'projects.manage', 'projects.read',
    'boards.create', 'boards.manage_cards',
    'ai.use', 'ai.summarize', 'chatbot.use',
    'data_lake.upload', 'data_lake.read', 'data_warehouse.read', 'data_processing.manage',
  ],
  ACCOUNTANT: [
    'finance.purchase.read', 'finance.budget.read',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards',
    'ai.use', 'ai.summarize', 'chatbot.use',
    'data_warehouse.read',
  ],
  TRAINER: [
    'trainees.read', 'academic.grade',
    'trainer.attendance.mark', 'trainer.section.attendance',
    'trainer.exam.administer', 'trainer.report.submit',
    'trainer.coop.supervise', 'trainer.curriculum.feedback',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards',
    'ai.use', 'chatbot.use',
  ],
  EMPLOYEE: [
    // الموظف العادي:
    //   - يقدّم طلبات إجازة لنفسه (عبر mineOnly في API بدون permission)
    //   - يفتح تذاكر دعم تقني
    //   - يطّلع على الهيكل التنظيمي والمجلس والمقررات
    //   - يستخدم نظام المهام والدردشة
    'tasks.create', 'tasks.update_status',
    'projects.read',
    'chatbot.use', 'ai.use',
  ],
  TRAINEE: [
    // المتدرب: يستخدم نظام المهام والدردشة فقط
    'tasks.create', 'tasks.update_status',
    'chatbot.use',
  ],
  AUDITOR: [
    'services.security.read', 'services.security.log',
    'hr.employee.read',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'ai.use', 'ai.summarize', 'ai.analyze', 'chatbot.use',
    'data_lake.read', 'data_warehouse.read',
  ],
  // ─────────────── أدوار متخصصة جديدة وفقاً للهيكل الرسمي ───────────────
  COUNCIL_SECRETARY: [
    'council.meeting.create', 'council.decision.create',
    'council.meeting.minutes_submit',
    'council.minutes.draft', 'council.agenda.prepare', 'council.bonus.calculate',
    'hr.employee.read',
    'tasks.create', 'tasks.update_status', 'tasks.assign', 'projects.read',
    'boards.manage_cards', 'ai.use', 'ai.summarize', 'chatbot.use',
  ],
  INSTITUTE_DIRECTOR: [
    'institute.manage', 'institute.report',
    'hr.employee.read', 'hr.employee.update', 'hr.leave.read',
    'finance.purchase.read', 'finance.budget.read',
    'trainees.read', 'trainers.read',
    'council.meeting.create', 'council.meeting.minutes_submit',
    'tasks.create', 'tasks.assign', 'tasks.update_status',
    'projects.create', 'projects.manage', 'projects.read',
    'boards.create', 'boards.manage_cards',
    'ai.use', 'ai.summarize', 'ai.analyze', 'chatbot.use',
    'data_warehouse.read',
  ],
  WAREHOUSE_KEEPER: [
    'warehouse.receive', 'warehouse.dispatch', 'warehouse.inventory', 'warehouse.classify',
    'finance.purchase.read',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards', 'ai.use', 'chatbot.use',
    'data_lake.read',
  ],
  TREASURY_KEEPER: [
    'treasury.receive', 'treasury.disburse', 'treasury.reconcile', 'treasury.subfund.manage',
    'finance.purchase.read', 'finance.budget.read',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards', 'ai.use', 'ai.summarize', 'chatbot.use',
    'data_warehouse.read',
  ],
  HR_AUDITOR: [
    'hr.audit.attendance', 'hr.audit.compliance', 'hr.audit.files_check',
    'hr.recruitment.process',
    'hr.employee.read', 'hr.leave.read',
    'tasks.create', 'tasks.update_status', 'tasks.assign', 'projects.read',
    'boards.manage_cards', 'ai.use', 'ai.summarize', 'chatbot.use',
    'data_lake.read',
  ],
  DOCTOR: [
    'clinic.examine', 'clinic.prescribe', 'clinic.refer', 'clinic.awareness',
    'services.medical.read', 'services.medical.record',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'ai.use', 'chatbot.use',
  ],
  MONITOR: [
    'monitoring.tour', 'monitoring.absence_report', 'monitoring.observation',
    'services.security.read',
    'hr.employee.read', 'hr.audit.attendance',
    'tasks.create', 'tasks.update_status', 'tasks.assign', 'projects.read',
    'boards.manage_cards', 'ai.use', 'ai.summarize', 'chatbot.use',
    'data_lake.read',
  ],
  GUIDANCE_COUNSELOR: [
    'guidance.counseling', 'guidance.gifted_care',
    'trainees.read', 'trainees.warning.issue',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards', 'ai.use', 'chatbot.use',
  ],
  ACTIVITIES_COORDINATOR: [
    'activities.organize', 'trainees.read',
    'tasks.create', 'tasks.update_status', 'projects.create', 'projects.read',
    'boards.create', 'boards.manage_cards', 'ai.use', 'chatbot.use',
  ],
  JOB_COORDINATOR: [
    'job_coord.placement', 'trainees.read',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards', 'ai.use', 'chatbot.use',
  ],
  COOP_COORDINATOR: [
    'coop.assign_supervisor', 'trainees.read', 'trainers.read',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards', 'ai.use', 'chatbot.use',
  ],
  CURRICULUM_COORDINATOR: [
    'curriculum.review', 'dept.curriculum_review.create',
    'trainers.read',
    'tasks.create', 'tasks.update_status', 'projects.read',
    'boards.manage_cards', 'ai.use', 'ai.summarize', 'chatbot.use',
  ],
};

async function main() {
  console.log('🌱 Seeding كلية الاتصالات والمعلومات بالرياض...');
  const passwordHash = await argon2.hash(PASSWORD);

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'cci-riyadh' },
    update: {},
    create: {
      slug: 'cci-riyadh',
      nameAr: 'كلية الاتصالات والمعلومات بالرياض',
      nameEn: 'College of Communications and Information — Riyadh',
      type: TenantType.COLLEGE,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Tenant:', tenant.nameAr);

  // 2. Permissions
  for (const [code, mod, action, resource, nameAr] of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: { module: mod, action, resource, nameAr },
      create: { code, module: mod, action, resource, nameAr },
    });
  }
  console.log(`✓ ${PERMISSIONS.length} permissions`);

  const allPerms = await prisma.permission.findMany();

  // 3. Roles
  const ROLE_DEFS: { code: string; nameAr: string; scope: any; system: boolean }[] = [
    { code: 'SUPER_ADMIN', nameAr: 'مدير النظام', scope: 'GLOBAL', system: true },
    { code: 'DEAN', nameAr: 'العميد', scope: 'TENANT', system: true },
    { code: 'VICE_DEAN_TRAINEES', nameAr: 'وكيل شؤون المتدربين', scope: 'TENANT', system: true },
    { code: 'VICE_DEAN_TRAINERS', nameAr: 'وكيل شؤون المدربين', scope: 'TENANT', system: true },
    { code: 'VICE_DEAN_QUALITY', nameAr: 'وكيل الجودة', scope: 'TENANT', system: true },
    { code: 'QUALITY_COORDINATOR', nameAr: 'منسق وحدة ضبط الجودة', scope: 'UNIT', system: true },
    { code: 'DEPT_HEAD', nameAr: 'رئيس قسم', scope: 'DEPARTMENT', system: true },
    { code: 'COORDINATOR', nameAr: 'منسق', scope: 'DEPARTMENT', system: true },
    { code: 'IT_MANAGER', nameAr: 'مدير وحدة تقنية المعلومات', scope: 'UNIT', system: true },
    { code: 'ACCOUNTANT', nameAr: 'محاسب', scope: 'UNIT', system: true },
    { code: 'TRAINER', nameAr: 'مدرب', scope: 'TENANT', system: true },
    { code: 'EMPLOYEE', nameAr: 'موظف إداري', scope: 'TENANT', system: true },
    { code: 'TRAINEE', nameAr: 'متدرب', scope: 'TENANT', system: true },
    { code: 'AUDITOR', nameAr: 'مراقب', scope: 'TENANT', system: true },
    // أدوار متخصصة وفقاً للهيكل الرسمي
    { code: 'COUNCIL_SECRETARY', nameAr: 'أمين المجلس', scope: 'UNIT', system: true },
    { code: 'INSTITUTE_DIRECTOR', nameAr: 'مدير المعهد', scope: 'TENANT', system: true },
    { code: 'WAREHOUSE_KEEPER', nameAr: 'أمين المستودع', scope: 'UNIT', system: true },
    { code: 'TREASURY_KEEPER', nameAr: 'أمين الصندوق', scope: 'UNIT', system: true },
    { code: 'HR_AUDITOR', nameAr: 'مدقق شؤون الموظفين', scope: 'UNIT', system: true },
    { code: 'DOCTOR', nameAr: 'طبيب العيادة', scope: 'UNIT', system: true },
    { code: 'MONITOR', nameAr: 'مراقب وحدة الرقابة', scope: 'UNIT', system: true },
    { code: 'GUIDANCE_COUNSELOR', nameAr: 'مرشد أكاديمي', scope: 'UNIT', system: true },
    { code: 'ACTIVITIES_COORDINATOR', nameAr: 'منسق الأنشطة', scope: 'UNIT', system: true },
    { code: 'JOB_COORDINATOR', nameAr: 'منسق التنسيق الوظيفي', scope: 'UNIT', system: true },
    { code: 'COOP_COORDINATOR', nameAr: 'منسق التدريب التعاوني', scope: 'UNIT', system: true },
    { code: 'CURRICULUM_COORDINATOR', nameAr: 'منسق المناهج والإشراف', scope: 'UNIT', system: true },
  ];

  const roles: Record<string, string> = {};
  for (const r of ROLE_DEFS) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: r.code } },
      update: { nameAr: r.nameAr },
      create: { tenantId: tenant.id, code: r.code, nameAr: r.nameAr, scope: r.scope, systemRole: r.system },
    });
    roles[r.code] = role.id;

    const perms = ROLE_PERMISSIONS[r.code];
    const targetPerms = perms === '*' ? allPerms : allPerms.filter((p) => (perms as string[]).includes(p.code));
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (targetPerms.length) {
      await prisma.rolePermission.createMany({
        data: targetPerms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`✓ ${ROLE_DEFS.length} roles + permissions wired`);

  // 4. Departments — يبني الهيكل الكامل
  type DeptDef = { code: string; nameAr: string; type: DepartmentType; parent?: string };
  const DEPTS: DeptDef[] = [
    { code: 'COUNCIL', nameAr: 'مجلس المنشأة', type: 'COUNCIL' },
    { code: 'COUNCIL_SEC', nameAr: 'أمانة المجلس', type: 'COUNCIL_SECRETARIAT', parent: 'COUNCIL' },
    { code: 'DEANSHIP', nameAr: 'العمادة', type: 'DEANSHIP' },
    { code: 'INSTITUTE', nameAr: 'إدارة المعهد', type: 'INSTITUTE_MGMT', parent: 'DEANSHIP' },
    { code: 'SECRETARIAT', nameAr: 'السكرتارية', type: 'SECRETARIAT', parent: 'DEANSHIP' },
    { code: 'MONITORING', nameAr: 'وحدة الرقابة', type: 'MONITORING_UNIT', parent: 'DEANSHIP' },
    { code: 'COMM_UNIT', nameAr: 'وحدة الاتصال المؤسسي', type: 'COMMUNICATION_UNIT', parent: 'DEANSHIP' },
    { code: 'IT_UNIT', nameAr: 'وحدة تقنية المعلومات', type: 'IT_UNIT', parent: 'DEANSHIP' },
    { code: 'RESEARCH_CTR', nameAr: 'مركز البحث والابتكار التقني', type: 'RESEARCH_CENTER', parent: 'DEANSHIP' },
    { code: 'COMMUNITY_CTR', nameAr: 'مركز خدمة المجتمع والتدريب المستمر الفرعي', type: 'COMMUNITY_CENTER', parent: 'DEANSHIP' },

    { code: 'VD_TRAINERS', nameAr: 'وكالة شؤون المدربين', type: 'VICE_DEANSHIP', parent: 'DEANSHIP' },
    { code: 'VD_TRAINEES', nameAr: 'وكالة شؤون المتدربين', type: 'VICE_DEANSHIP', parent: 'DEANSHIP' },
    { code: 'VD_QUALITY', nameAr: 'وكالة الجودة', type: 'VICE_DEANSHIP', parent: 'DEANSHIP' },

    { code: 'QC_UNIT', nameAr: 'وحدة ضبط الجودة', type: 'QUALITY_CONTROL_UNIT', parent: 'VD_QUALITY' },
    { code: 'SUPPORT_SVC', nameAr: 'إدارة الخدمات المساندة', type: 'SUPPORT_SERVICES', parent: 'DEANSHIP' },

    { code: 'DEPT_TRAINING', nameAr: 'الأقسام التدريبية', type: 'TRAINING_DEPT', parent: 'VD_TRAINERS' },
    { code: 'DEPT_ELEARN', nameAr: 'قسم التدرب الإلكتروني ومصادر التدريب', type: 'ELEARNING_DEPT', parent: 'VD_TRAINERS' },
    { code: 'CURRICULUM', nameAr: 'وحدة المناهج والإشراف التخصصي', type: 'CURRICULUM_UNIT', parent: 'VD_TRAINERS' },
    { code: 'GIRLS_PRISON', nameAr: 'قسم تدريب البنات بالسجون', type: 'GIRLS_PRISON_DEPT', parent: 'VD_TRAINERS' },

    { code: 'ADMISSION', nameAr: 'قسم القبول والتسجيل', type: 'ADMISSION_DEPT', parent: 'VD_TRAINEES' },
    { code: 'GUIDANCE', nameAr: 'وحدة الخدمات الإرشادية', type: 'GUIDANCE_UNIT', parent: 'VD_TRAINEES' },
    { code: 'ACTIVITIES', nameAr: 'وحدة الأنشطة', type: 'ACTIVITIES_UNIT', parent: 'VD_TRAINEES' },
    { code: 'JOB_COORD', nameAr: 'قسم التنسيق الوظيفي', type: 'JOB_COORD_DEPT', parent: 'VD_TRAINEES' },
    { code: 'COOP_TRAIN', nameAr: 'وحدة التدريب التعاوني', type: 'COOP_TRAINING_UNIT', parent: 'VD_TRAINEES' },

    { code: 'FINANCE', nameAr: 'قسم الشؤون المالية', type: 'FINANCE_DEPT', parent: 'SUPPORT_SVC' },
    { code: 'ACCOUNTING', nameAr: 'المحاسبة', type: 'ACCOUNTING', parent: 'FINANCE' },
    { code: 'WAREHOUSE', nameAr: 'أمانة المستودع', type: 'WAREHOUSE', parent: 'FINANCE' },
    { code: 'TREASURY', nameAr: 'أمانة الصندوق', type: 'TREASURY', parent: 'FINANCE' },
    { code: 'ADMIN_COMM', nameAr: 'وحدة الاتصالات الإدارية', type: 'ADMIN_COMMUNICATION', parent: 'FINANCE' },

    { code: 'HR', nameAr: 'قسم الشؤون الإدارية', type: 'HR_DEPT', parent: 'SUPPORT_SVC' },
    { code: 'EMP_AFFAIRS', nameAr: 'شؤون الموظفين', type: 'EMPLOYEE_AFFAIRS', parent: 'HR' },

    { code: 'GS', nameAr: 'قسم الخدمات العامة', type: 'GENERAL_SERVICES', parent: 'SUPPORT_SVC' },
    { code: 'SECURITY', nameAr: 'وحدة الأمن', type: 'SECURITY', parent: 'GS' },
    { code: 'MAINTENANCE', nameAr: 'وحدة المرافق والصيانة', type: 'MAINTENANCE', parent: 'GS' },
    { code: 'HEALTH_SAFETY', nameAr: 'وحدة الصحة والسلامة المهنية', type: 'HEALTH_SAFETY', parent: 'GS' },
    { code: 'CLINIC', nameAr: 'العيادة الطبية', type: 'CLINIC', parent: 'GS' },
  ];

  const deptIds: Record<string, string> = {};
  for (const d of DEPTS) {
    const parentId = d.parent ? deptIds[d.parent] : null;
    const dept = await prisma.department.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: d.code } },
      update: { nameAr: d.nameAr, type: d.type, parentId },
      create: { tenantId: tenant.id, code: d.code, nameAr: d.nameAr, type: d.type, parentId },
    });
    deptIds[d.code] = dept.id;
  }
  console.log(`✓ ${DEPTS.length} departments`);

  // 5. Positions (مع budget limits من الوثيقة)
  const POSITIONS = [
    { dept: 'DEANSHIP', code: 'DEAN', titleAr: 'العميد', isManagerial: true, budgetLimit: 100000 },
    { dept: 'INSTITUTE', code: 'INSTITUTE_MGR', titleAr: 'مدير المعهد', isManagerial: true, budgetLimit: 50000 },
    { dept: 'COUNCIL_SEC', code: 'COUNCIL_SECRETARY', titleAr: 'أمين المجلس', isManagerial: false },
    { dept: 'VD_TRAINEES', code: 'VICE_DEAN_TRAINEES', titleAr: 'وكيل شؤون المتدربين', isManagerial: true, budgetLimit: 30000 },
    { dept: 'VD_TRAINERS', code: 'VICE_DEAN_TRAINERS', titleAr: 'وكيل شؤون المدربين', isManagerial: true, budgetLimit: 30000 },
    { dept: 'VD_QUALITY', code: 'VICE_DEAN_QUALITY', titleAr: 'وكيل الجودة', isManagerial: true, budgetLimit: 30000 },
    { dept: 'DEPT_TRAINING', code: 'DEPT_HEAD', titleAr: 'رئيس قسم تدريبي', isManagerial: true, budgetLimit: 10000 },
    { dept: 'IT_UNIT', code: 'IT_MANAGER', titleAr: 'مدير وحدة تقنية المعلومات', isManagerial: true },
    { dept: 'COMMUNITY_CTR', code: 'CC_HEAD', titleAr: 'رئيس مركز خدمة المجتمع', isManagerial: true },
    { dept: 'RESEARCH_CTR', code: 'RC_HEAD', titleAr: 'رئيس مركز البحث', isManagerial: true },
    { dept: 'ADMISSION', code: 'ADMISSION_HEAD', titleAr: 'رئيس القبول والتسجيل', isManagerial: true },
    { dept: 'JOB_COORD', code: 'JC_HEAD', titleAr: 'رئيس التنسيق الوظيفي', isManagerial: true },
    { dept: 'FINANCE', code: 'FINANCE_HEAD', titleAr: 'رئيس الشؤون المالية', isManagerial: true },
    { dept: 'HR', code: 'HR_HEAD', titleAr: 'رئيس الشؤون الإدارية', isManagerial: true },
    { dept: 'GS', code: 'GS_HEAD', titleAr: 'رئيس الخدمات العامة', isManagerial: true },
    { dept: 'ACCOUNTING', code: 'ACCOUNTANT', titleAr: 'محاسب', isManagerial: false },
    { dept: 'WAREHOUSE', code: 'WAREHOUSE_KEEPER', titleAr: 'أمين مستودع', isManagerial: false },
    { dept: 'TREASURY', code: 'TREASURY_KEEPER', titleAr: 'أمين صندوق', isManagerial: false },
    { dept: 'EMP_AFFAIRS', code: 'EMP_AUDITOR', titleAr: 'مدقق شؤون موظفين', isManagerial: false },
    { dept: 'CLINIC', code: 'DOCTOR', titleAr: 'طبيب', isManagerial: false },
    { dept: 'MONITORING', code: 'MONITOR', titleAr: 'مراقب', isManagerial: false },
  ];

  const positionIds: Record<string, string> = {};
  for (const p of POSITIONS) {
    const pos = await prisma.position.upsert({
      where: { departmentId_code: { departmentId: deptIds[p.dept], code: p.code } },
      update: { titleAr: p.titleAr, isManagerial: p.isManagerial, budgetLimit: p.budgetLimit ?? null },
      create: {
        departmentId: deptIds[p.dept],
        code: p.code,
        titleAr: p.titleAr,
        isManagerial: p.isManagerial,
        budgetLimit: p.budgetLimit ?? null,
      },
    });
    positionIds[`${p.dept}.${p.code}`] = pos.id;
  }
  console.log(`✓ ${POSITIONS.length} positions`);

  // 6. Demo users + employees + assignments
  const DEMOS = [
    { email: 'admin@cci-riyadh.edu.sa', name: 'مدير النظام', role: 'SUPER_ADMIN' },
    { email: 'dean@cci-riyadh.edu.sa', name: 'د. خالد بن سعد العتيبي', role: 'DEAN', dept: 'DEANSHIP', position: 'DEANSHIP.DEAN', empNum: 'CCI-0001' },
    { email: 'vd-trainees@cci-riyadh.edu.sa', name: 'د. فهد بن ناصر الشهري', role: 'VICE_DEAN_TRAINEES', dept: 'VD_TRAINEES', position: 'VD_TRAINEES.VICE_DEAN_TRAINEES', empNum: 'CCI-0002' },
    { email: 'vd-trainers@cci-riyadh.edu.sa', name: 'د. سلمان بن محمد الدوسري', role: 'VICE_DEAN_TRAINERS', dept: 'VD_TRAINERS', position: 'VD_TRAINERS.VICE_DEAN_TRAINERS', empNum: 'CCI-0003' },
    { email: 'vd-quality@cci-riyadh.edu.sa', name: 'د. عبدالله بن إبراهيم الزهراني', role: 'VICE_DEAN_QUALITY', dept: 'VD_QUALITY', position: 'VD_QUALITY.VICE_DEAN_QUALITY', empNum: 'CCI-0004' },
    { email: 'it-mgr@cci-riyadh.edu.sa', name: 'م. أحمد بن علي الغامدي', role: 'IT_MANAGER', dept: 'IT_UNIT', position: 'IT_UNIT.IT_MANAGER', empNum: 'CCI-0005' },
    { email: 'finance@cci-riyadh.edu.sa', name: 'محمد بن فهد القحطاني', role: 'ACCOUNTANT', dept: 'ACCOUNTING', position: 'ACCOUNTING.ACCOUNTANT', empNum: 'CCI-0006' },
    { email: 'hr@cci-riyadh.edu.sa', name: 'سارة بنت عبدالعزيز المالكي', role: 'EMPLOYEE', dept: 'HR', empNum: 'CCI-0007' },
    { email: 'trainer1@cci-riyadh.edu.sa', name: 'أ. ياسر بن عبدالرحمن السبيعي', role: 'TRAINER', dept: 'DEPT_TRAINING', empNum: 'CCI-0008' },
    { email: 'trainee1@cci-riyadh.edu.sa', name: 'ناصر بن محمد الحربي', role: 'TRAINEE' },
    // أدوار متخصصة جديدة
    { email: 'council-sec@cci-riyadh.edu.sa', name: 'فهد بن عبدالله البقمي', role: 'COUNCIL_SECRETARY', dept: 'COUNCIL_SEC', empNum: 'CCI-0050' },
    { email: 'institute-dir@cci-riyadh.edu.sa', name: 'د. سالم بن محمد العتيبي', role: 'INSTITUTE_DIRECTOR', dept: 'INSTITUTE', empNum: 'CCI-0051' },
    { email: 'warehouse@cci-riyadh.edu.sa', name: 'بدر بن سعد الشمري', role: 'WAREHOUSE_KEEPER', dept: 'WAREHOUSE', empNum: 'CCI-0052' },
    { email: 'treasury@cci-riyadh.edu.sa', name: 'تركي بن خالد المطيري', role: 'TREASURY_KEEPER', dept: 'TREASURY', empNum: 'CCI-0053' },
    { email: 'hr-audit@cci-riyadh.edu.sa', name: 'أحمد بن سعود الجهني', role: 'HR_AUDITOR', dept: 'EMP_AFFAIRS', empNum: 'CCI-0054' },
    { email: 'doctor@cci-riyadh.edu.sa', name: 'د. عمر بن صالح القرني', role: 'DOCTOR', dept: 'CLINIC', empNum: 'CCI-0055' },
    { email: 'monitor@cci-riyadh.edu.sa', name: 'مازن بن إبراهيم البلوي', role: 'MONITOR', dept: 'MONITORING', empNum: 'CCI-0056' },
    { email: 'guidance@cci-riyadh.edu.sa', name: 'هاني بن علي الزهراني', role: 'GUIDANCE_COUNSELOR', dept: 'GUIDANCE', empNum: 'CCI-0057' },
    { email: 'activities@cci-riyadh.edu.sa', name: 'وليد بن فهد الدوسري', role: 'ACTIVITIES_COORDINATOR', dept: 'ACTIVITIES', empNum: 'CCI-0058' },
    { email: 'job-coord@cci-riyadh.edu.sa', name: 'سامي بن ناصر العنزي', role: 'JOB_COORDINATOR', dept: 'JOB_COORD', empNum: 'CCI-0059' },
    { email: 'coop-coord@cci-riyadh.edu.sa', name: 'ريان بن عمر الحربي', role: 'COOP_COORDINATOR', dept: 'COOP_TRAIN', empNum: 'CCI-0060' },
    { email: 'curriculum@cci-riyadh.edu.sa', name: 'مشاري بن عبدالعزيز الشهري', role: 'CURRICULUM_COORDINATOR', dept: 'CURRICULUM', empNum: 'CCI-0061' },
  ];

  for (const d of DEMOS) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: d.email } },
      update: { fullNameAr: d.name },
      create: {
        tenantId: tenant.id,
        email: d.email,
        passwordHash,
        fullNameAr: d.name,
        status: 'ACTIVE',
      },
    });

    const existingUR = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: roles[d.role], scopeType: null, scopeId: null },
    });
    if (!existingUR) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: roles[d.role] },
      });
    }

    if ('empNum' in d && d.empNum && d.dept) {
      const emp = await prisma.employee.upsert({
        where: { tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: d.empNum } },
        update: { fullNameAr: d.name, departmentId: deptIds[d.dept], userId: user.id },
        create: {
          tenantId: tenant.id,
          userId: user.id,
          employeeNumber: d.empNum,
          fullNameAr: d.name,
          gender: 'MALE',
          hireDate: new Date('2020-01-01'),
          jobTitleAr: d.role,
          departmentId: deptIds[d.dept],
        },
      });

      if ('position' in d && d.position) {
        await prisma.assignment.create({
          data: {
            employeeId: emp.id,
            positionId: positionIds[d.position],
            departmentId: deptIds[d.dept],
            isPrimary: true,
            validFrom: new Date('2020-01-01'),
          },
        });
      }
    }

    if (d.role === 'TRAINEE') {
      // Will create trainee profile after programs are seeded
    }
  }
  console.log(`✓ ${DEMOS.length} demo users`);

  // 7. Programs + Courses (نموذج)
  const programs = [
    { code: 'NETW-DIP', nameAr: 'دبلوم الشبكات', level: 'DIPLOMA', durationTerms: 4, totalCredits: 80 },
    { code: 'CYS-DIP', nameAr: 'دبلوم الأمن السيبراني', level: 'DIPLOMA', durationTerms: 4, totalCredits: 82 },
    { code: 'WEB-DIP', nameAr: 'دبلوم تطوير الويب', level: 'DIPLOMA', durationTerms: 4, totalCredits: 78 },
  ];
  const programIds: Record<string, string> = {};
  for (const p of programs) {
    const program = await prisma.program.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: p.code } },
      update: {},
      create: { tenantId: tenant.id, ...(p as any) },
    });
    programIds[p.code] = program.id;
  }

  const courses = [
    { code: 'NET-101', nameAr: 'أساسيات الشبكات', credits: 3, hours: 60, programCode: 'NETW-DIP' },
    { code: 'NET-201', nameAr: 'إدارة الشبكات', credits: 3, hours: 60, programCode: 'NETW-DIP' },
    { code: 'CYS-101', nameAr: 'مدخل إلى الأمن السيبراني', credits: 3, hours: 60, programCode: 'CYS-DIP' },
    { code: 'WEB-101', nameAr: 'تطوير الويب الأساسي', credits: 3, hours: 60, programCode: 'WEB-DIP' },
    { code: 'WEB-201', nameAr: 'تطوير الواجهات الحديثة', credits: 3, hours: 60, programCode: 'WEB-DIP' },
  ];
  for (const c of courses) {
    await prisma.course.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: c.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: c.code,
        nameAr: c.nameAr,
        credits: c.credits,
        hours: c.hours,
        programId: programIds[c.programCode],
        departmentId: deptIds['DEPT_TRAINING'],
      },
    });
  }

  // مدرب نموذجي (Trainer record مرتبط بـ employee)
  const trainerEmpUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: 'trainer1@cci-riyadh.edu.sa' } },
  });
  const trainerEmp = trainerEmpUser
    ? await prisma.employee.findFirst({ where: { userId: trainerEmpUser.id } })
    : null;
  if (trainerEmp) {
    const existingTrainer = await prisma.trainer.findFirst({
      where: { tenantId: tenant.id, employeeId: trainerEmp.id },
    });
    if (!existingTrainer) {
      await prisma.trainer.create({
        data: {
          tenantId: tenant.id,
          userId: trainerEmpUser!.id,
          employeeId: trainerEmp.id,
          trainerNumber: 'TR-0001',
          specialization: 'الشبكات والأمن السيبراني',
          qualification: 'بكالوريوس هندسة برمجيات',
          hireDate: new Date('2020-09-01'),
          loadHours: 18,
        },
      });
    }
  }

  // متدرب نموذجي
  const traineeUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: 'trainee1@cci-riyadh.edu.sa' } },
  });
  if (traineeUser) {
    await prisma.trainee.upsert({
      where: { tenantId_studentNumber: { tenantId: tenant.id, studentNumber: '44210001' } },
      update: {},
      create: {
        tenantId: tenant.id,
        userId: traineeUser.id,
        studentNumber: '44210001',
        fullNameAr: traineeUser.fullNameAr,
        gender: 'MALE',
        enrollmentDate: new Date('2024-09-01'),
        programId: programIds['NETW-DIP'],
      },
    });
  }

  // شعبتان نموذجيتان لـ trainer1 (واحدة معمل + واحدة فصل) لتظهر في "اليوم"
  const trainerForSections = await prisma.trainer.findFirst({
    where: { tenantId: tenant.id, trainerNumber: 'TR-0001' },
  });
  if (trainerForSections) {
    const netCourse = await prisma.course.findFirst({
      where: { tenantId: tenant.id, code: 'NET-101' },
    });
    const net201 = await prisma.course.findFirst({
      where: { tenantId: tenant.id, code: 'NET-201' },
    });

    if (netCourse) {
      const existing = await prisma.section.findFirst({
        where: { courseId: netCourse.id, trainerId: trainerForSections.id, term: '1446-1' },
      });
      if (!existing) {
        await prisma.section.create({
          data: {
            courseId: netCourse.id,
            trainerId: trainerForSections.id,
            term: '1446-1',
            capacity: 30,
            enrolled: 1,
            isLab: true,
            schedule: [
              { day: 'SUN', from: '08:00', to: '10:00', room: 'معمل ٢', type: 'lab' },
              { day: 'TUE', from: '08:00', to: '10:00', room: 'معمل ٢', type: 'lab' },
              { day: 'WED', from: '10:00', to: '12:00', room: 'معمل ٢', type: 'lab' },
            ],
          },
        });
      }
    }
    if (net201) {
      const existing = await prisma.section.findFirst({
        where: { courseId: net201.id, trainerId: trainerForSections.id, term: '1446-1' },
      });
      if (!existing) {
        await prisma.section.create({
          data: {
            courseId: net201.id,
            trainerId: trainerForSections.id,
            term: '1446-1',
            capacity: 25,
            enrolled: 0,
            schedule: [
              { day: 'MON', from: '10:00', to: '12:00', room: 'F-201', type: 'classroom' },
              { day: 'WED', from: '13:00', to: '15:00', room: 'F-201', type: 'classroom' },
            ],
          },
        });
      }
    }

    // تسجيل المتدرب النموذجي في الشعبة الأولى
    const traineeRecord = traineeUser
      ? await prisma.trainee.findFirst({ where: { userId: traineeUser.id } })
      : null;
    const firstSection = netCourse
      ? await prisma.section.findFirst({
          where: { courseId: netCourse.id, trainerId: trainerForSections.id },
        })
      : null;
    if (traineeRecord && firstSection) {
      const existingEnroll = await prisma.enrollment.findFirst({
        where: { traineeId: traineeRecord.id, sectionId: firstSection.id },
      });
      if (!existingEnroll) {
        await prisma.enrollment.create({
          data: { traineeId: traineeRecord.id, sectionId: firstSection.id },
        });
      }
    }
  }
  console.log('✓ Programs, courses, trainer sections + enrollment');

  // 8. Workflow Definitions
  const workflows = [
    {
      code: 'LEAVE_REQUEST',
      nameAr: 'طلب إجازة',
      entityType: 'leave',
      steps: [
        { key: 'dept_head', nameAr: 'موافقة رئيس القسم', requiredRole: 'DEPT_HEAD', slaHours: 48 },
        { key: 'vice_dean', nameAr: 'موافقة الوكيل', requiredRole: 'VICE_DEAN_TRAINEES', slaHours: 48 },
        { key: 'dean', nameAr: 'اعتماد العميد', requiredRole: 'DEAN', slaHours: 72 },
      ],
    },
    {
      code: 'PR_APPROVAL',
      nameAr: 'اعتماد طلب شراء',
      entityType: 'purchase_request',
      steps: [
        { key: 'dept_head', nameAr: 'موافقة رئيس القسم', requiredRole: 'DEPT_HEAD', slaHours: 48 },
        { key: 'finance', nameAr: 'مراجعة الشؤون المالية', requiredRole: 'ACCOUNTANT', slaHours: 48 },
        { key: 'dean', nameAr: 'اعتماد العميد (≤ 100,000)', requiredRole: 'DEAN', slaHours: 72,
          condition: { path: 'amount', op: 'lte', value: 100000 } },
        { key: 'dg', nameAr: 'اعتماد المدير العام للمنطقة (> 100,000)', requiredRole: 'SUPER_ADMIN', slaHours: 120,
          condition: { path: 'amount', op: 'gt', value: 100000 } },
      ],
    },
    {
      code: 'MEETING_MINUTES',
      nameAr: 'اعتماد محضر اجتماع',
      entityType: 'meeting',
      steps: [
        { key: 'secretary', nameAr: 'مراجعة أمين المجلس', requiredRole: 'EMPLOYEE', slaHours: 48 },
        { key: 'dean', nameAr: 'توقيع العميد', requiredRole: 'DEAN', slaHours: 72 },
      ],
    },
    {
      code: 'EVALUATION',
      nameAr: 'اعتماد تقييم أداء',
      entityType: 'evaluation',
      steps: [
        { key: 'dean', nameAr: 'اعتماد العميد', requiredRole: 'DEAN', slaHours: 168 },
      ],
    },
    {
      code: 'GRADUATION',
      nameAr: 'اعتماد التخرج',
      entityType: 'graduation',
      steps: [
        { key: 'admission', nameAr: 'مراجعة القبول والتسجيل', requiredRole: 'EMPLOYEE', slaHours: 168 },
        { key: 'vice_dean', nameAr: 'موافقة وكيل المتدربين', requiredRole: 'VICE_DEAN_TRAINEES', slaHours: 168 },
        { key: 'dean', nameAr: 'اعتماد العميد', requiredRole: 'DEAN', slaHours: 168 },
      ],
    },
    {
      code: 'TRAINING_PLAN_APPROVAL',
      nameAr: 'اعتماد خطة تشغيلية للقسم',
      entityType: 'training_plan',
      steps: [
        { key: 'vice_dean_trainers', nameAr: 'مراجعة وكيل شؤون المدربين', requiredRole: 'VICE_DEAN_TRAINERS', slaHours: 120 },
        { key: 'vice_dean_quality', nameAr: 'مراجعة الجودة', requiredRole: 'VICE_DEAN_QUALITY', slaHours: 120 },
        { key: 'dean', nameAr: 'اعتماد العميد', requiredRole: 'DEAN', slaHours: 168 },
      ],
    },
    {
      code: 'CURRICULUM_REVIEW',
      nameAr: 'اعتماد مراجعة الحقائب التدريبية',
      entityType: 'curriculum_review',
      steps: [
        { key: 'vice_dean_trainers', nameAr: 'مراجعة وكيل شؤون المدربين', requiredRole: 'VICE_DEAN_TRAINERS', slaHours: 120 },
        { key: 'dean', nameAr: 'اعتماد العميد', requiredRole: 'DEAN', slaHours: 168 },
      ],
    },
  ];
  for (const wf of workflows) {
    await prisma.workflowDefinition.upsert({
      where: { tenantId_code_version: { tenantId: tenant.id, code: wf.code, version: 1 } },
      update: { steps: wf.steps as any, nameAr: wf.nameAr },
      create: {
        tenantId: tenant.id,
        code: wf.code,
        nameAr: wf.nameAr,
        entityType: wf.entityType,
        steps: wf.steps as any,
        version: 1,
      },
    });
  }
  console.log(`✓ ${workflows.length} workflow definitions`);

  // 9. KPIs نموذجية
  const kpis = [
    { code: 'TRAINEE_RETENTION', nameAr: 'نسبة الاستمرار في الدراسة', unit: '%', target: 90, frequency: 'SEMESTER' },
    { code: 'GRADUATION_RATE', nameAr: 'نسبة التخرج', unit: '%', target: 85, frequency: 'YEARLY' },
    { code: 'EMPLOYMENT_RATE', nameAr: 'نسبة توظيف الخريجين', unit: '%', target: 70, frequency: 'YEARLY' },
    { code: 'TRAINER_LOAD_AVG', nameAr: 'متوسط النصاب التدريبي', unit: 'ساعة', target: 18, frequency: 'SEMESTER' },
    { code: 'COMPLAINT_SLA', nameAr: 'معدل التزام الشكاوى بالـ SLA', unit: '%', target: 95, frequency: 'MONTHLY' },
  ];
  for (const k of kpis) {
    await prisma.kpi.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: k.code } },
      update: { nameAr: k.nameAr, target: k.target, unit: k.unit },
      create: {
        tenantId: tenant.id,
        code: k.code,
        nameAr: k.nameAr,
        target: k.target,
        unit: k.unit,
        frequency: k.frequency as any,
      },
    });
  }
  console.log(`✓ ${kpis.length} KPIs`);

  // 10. توظيف شامل لكل الإدارات: رئيس + موظف لكل قسم/إدارة/وحدة
  console.log('\n👥 Generating staff for every department...');

  const FIRST_M = ['عبدالله', 'محمد', 'أحمد', 'سعد', 'فيصل', 'بدر', 'ماجد', 'تركي', 'يزيد', 'عمر',
                   'علي', 'سلطان', 'ناصر', 'عبدالعزيز', 'إبراهيم', 'سامي', 'وليد', 'هاني', 'مازن', 'ريان',
                   'مشاري', 'بندر', 'صالح', 'رياض', 'طلال'];
  const FIRST_F = ['نورة', 'سارة', 'منى', 'ريم', 'هند', 'لمى', 'أمل', 'دانية', 'لين', 'جود',
                   'شذى', 'أروى', 'بشاير', 'رهف', 'مشاعل', 'أسماء', 'هيا', 'دعاء', 'غادة', 'لطيفة'];
  const FATHER_M = ['عبدالرحمن', 'محمد', 'سعود', 'خالد', 'عبدالعزيز', 'سلمان', 'فهد', 'سعد', 'علي', 'إبراهيم'];
  const FAMILIES = ['الشهري', 'الزهراني', 'الغامدي', 'القحطاني', 'العتيبي', 'الحربي', 'الدوسري', 'العنزي',
                    'المطيري', 'السبيعي', 'البقمي', 'القرني', 'الشمري', 'العمري', 'الرشيدي', 'البلوي',
                    'العسيري', 'الجهني', 'المالكي', 'النفيعي', 'الأحمري', 'الصاعدي', 'الخالدي', 'الفيفي',
                    'الثبيتي', 'الصبحي', 'البيشي', 'القثامي', 'العوفي', 'الرويلي'];

  const genName = (seed: number, gender: 'MALE' | 'FEMALE') => {
    const first = gender === 'MALE' ? FIRST_M[seed % FIRST_M.length] : FIRST_F[seed % FIRST_F.length];
    const conj = gender === 'MALE' ? 'بن' : 'بنت';
    const father = FATHER_M[(seed * 3 + 1) % FATHER_M.length];
    const family = FAMILIES[(seed * 7 + 5) % FAMILIES.length];
    return `${first} ${conj} ${father} ${family}`;
  };

  // الإدارات التي عيّنا لها رئيساً مسبقاً عبر الحسابات الديمو
  const HEAD_ALREADY = new Set(['DEANSHIP', 'VD_TRAINEES', 'VD_TRAINERS', 'VD_QUALITY', 'IT_UNIT', 'ACCOUNTING', 'COUNCIL']);

  // إن لم تكن هناك وظيفة "رئيس" أو "موظف" لإدارة، أنشئها تلقائياً
  const ensurePosition = async (deptCode: string, deptId: string, code: string, titleAr: string, isManagerial: boolean, budgetLimit?: number) => {
    return prisma.position.upsert({
      where: { departmentId_code: { departmentId: deptId, code } },
      update: { titleAr, isManagerial, budgetLimit: budgetLimit ?? null },
      create: { departmentId: deptId, code, titleAr, isManagerial, budgetLimit: budgetLimit ?? null },
    });
  };

  let nextEmpNum = 100;
  let createdHeads = 0;
  let createdStaff = 0;
  const allDepts = await prisma.department.findMany({
    where: { tenantId: tenant.id },
    orderBy: { code: 'asc' },
  });

  for (const dept of allDepts) {
    const deptCode = dept.code;
    const seedIdx = parseInt(dept.id.slice(-2), 36) || nextEmpNum;
    const gender: 'MALE' | 'FEMALE' = seedIdx % 5 === 0 ? 'FEMALE' : 'MALE';

    // ─── الرئيس / المدير ───
    if (!HEAD_ALREADY.has(deptCode)) {
      const headPos = await ensurePosition(deptCode, dept.id, 'HEAD', `رئيس ${dept.nameAr}`, true, 10_000);
      const headEmail = `head-${deptCode.toLowerCase().replace(/_/g, '-')}@cci-riyadh.edu.sa`;
      const headName = genName(seedIdx, gender);
      nextEmpNum++;
      const headEmpNum = `CCI-H-${deptCode}`;

      const headUser = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: headEmail } },
        update: { fullNameAr: headName },
        create: {
          tenantId: tenant.id,
          email: headEmail,
          passwordHash,
          fullNameAr: headName,
          status: 'ACTIVE',
        },
      });

      const headRoleCode = ['IT_UNIT'].includes(deptCode) ? 'IT_MANAGER'
        : ['ACCOUNTING'].includes(deptCode) ? 'ACCOUNTANT'
        : 'DEPT_HEAD';
      const existingURHead = await prisma.userRole.findFirst({
        where: { userId: headUser.id, roleId: roles[headRoleCode] },
      });
      if (!existingURHead) {
        await prisma.userRole.create({ data: { userId: headUser.id, roleId: roles[headRoleCode] } });
      }

      const headEmp = await prisma.employee.upsert({
        where: { tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: headEmpNum } },
        update: { fullNameAr: headName, departmentId: dept.id, userId: headUser.id },
        create: {
          tenantId: tenant.id,
          userId: headUser.id,
          employeeNumber: headEmpNum,
          fullNameAr: headName,
          gender,
          hireDate: new Date('2021-01-01'),
          jobTitleAr: `رئيس ${dept.nameAr}`,
          departmentId: dept.id,
        },
      });

      // assignment
      const existingAssign = await prisma.assignment.findFirst({
        where: { employeeId: headEmp.id, positionId: headPos.id },
      });
      if (!existingAssign) {
        await prisma.assignment.create({
          data: {
            employeeId: headEmp.id,
            positionId: headPos.id,
            departmentId: dept.id,
            isPrimary: true,
            validFrom: new Date('2021-01-01'),
          },
        });
      }

      // managerId on department
      await prisma.department.update({
        where: { id: dept.id },
        data: { managerId: headEmp.id },
      });
      createdHeads++;
    }

    // ─── موظف ───
    const staffPos = await ensurePosition(deptCode, dept.id, 'STAFF', `موظف ${dept.nameAr}`, false);
    const staffEmail = `staff-${deptCode.toLowerCase().replace(/_/g, '-')}@cci-riyadh.edu.sa`;
    const staffName = genName(seedIdx + 13, gender === 'MALE' ? 'FEMALE' : 'MALE');
    nextEmpNum++;
    const staffEmpNum = `CCI-E-${deptCode}`;
    const staffGender: 'MALE' | 'FEMALE' = gender === 'MALE' ? 'FEMALE' : 'MALE';

    const staffUser = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: staffEmail } },
      update: { fullNameAr: staffName },
      create: {
        tenantId: tenant.id,
        email: staffEmail,
        passwordHash,
        fullNameAr: staffName,
        status: 'ACTIVE',
      },
    });

    const existingURStaff = await prisma.userRole.findFirst({
      where: { userId: staffUser.id, roleId: roles['EMPLOYEE'] },
    });
    if (!existingURStaff) {
      await prisma.userRole.create({ data: { userId: staffUser.id, roleId: roles['EMPLOYEE'] } });
    }

    const staffEmp = await prisma.employee.upsert({
      where: { tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: staffEmpNum } },
      update: { fullNameAr: staffName, departmentId: dept.id, userId: staffUser.id },
      create: {
        tenantId: tenant.id,
        userId: staffUser.id,
        employeeNumber: staffEmpNum,
        fullNameAr: staffName,
        gender: staffGender,
        hireDate: new Date('2022-01-01'),
        jobTitleAr: `موظف ${dept.nameAr}`,
        departmentId: dept.id,
      },
    });

    const existingStaffAssign = await prisma.assignment.findFirst({
      where: { employeeId: staffEmp.id, positionId: staffPos.id },
    });
    if (!existingStaffAssign) {
      await prisma.assignment.create({
        data: {
          employeeId: staffEmp.id,
          positionId: staffPos.id,
          departmentId: dept.id,
          isPrimary: true,
          validFrom: new Date('2022-01-01'),
        },
      });
    }
    createdStaff++;
  }
  console.log(`✓ تم إنشاء ${createdHeads} رئيس + ${createdStaff} موظف عبر ${allDepts.length} إدارة`);

  // ───────────────────────────────────────────────────────────────
  // 11. بيانات وهمية واقعية شاملة (Trainees, Sections, Attendance, Grades, Leaves, PRs, Meetings, KPIs, Quality, Tickets, Risks)
  // ───────────────────────────────────────────────────────────────
  console.log('\n🎭 Generating realistic demo data...');
  await generateDemoData(tenant.id, deptIds, programIds, roles, FIRST_M, FIRST_F, FATHER_M, FAMILIES, genName);

  // 12. تأكيد إجمالي المستخدمين والموظفين
  const totalUsers = await prisma.user.count({ where: { tenantId: tenant.id } });
  const totalEmployees = await prisma.employee.count({ where: { tenantId: tenant.id } });
  const totalTrainees = await prisma.trainee.count({ where: { tenantId: tenant.id } });
  const totalEnrollments = await prisma.enrollment.count();
  const totalAttendance = await prisma.traineeAttendance.count();
  const totalLeaves = await prisma.leave.count();
  const totalAssignments = await prisma.assignment.count();
  console.log(`📊 الإجمالي: ${totalUsers} مستخدم • ${totalEmployees} موظف • ${totalTrainees} متدرب`);
  console.log(`         ${totalEnrollments} تسجيل • ${totalAttendance} حضور • ${totalLeaves} إجازة • ${totalAssignments} تكليف`);

  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 جميع كلمات المرور:', PASSWORD);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  admin@cci-riyadh.edu.sa     → SUPER_ADMIN');
  console.log('  dean@cci-riyadh.edu.sa      → العميد');
  console.log('  vd-trainees@cci-riyadh.edu.sa → وكيل شؤون المتدربين');
  console.log('  vd-trainers@cci-riyadh.edu.sa → وكيل شؤون المدربين');
  console.log('  vd-quality@cci-riyadh.edu.sa  → وكيل الجودة');
  console.log('  it-mgr@cci-riyadh.edu.sa    → مدير تقنية المعلومات');
  console.log('  finance@cci-riyadh.edu.sa   → محاسب');
  console.log('  trainer1@cci-riyadh.edu.sa  → مدرب');
  console.log('  trainee1@cci-riyadh.edu.sa  → متدرب');
  console.log('━━━━━━ أدوار متخصصة جديدة ━━━━━━');
  console.log('  council-sec@        → أمين المجلس');
  console.log('  institute-dir@      → مدير المعهد');
  console.log('  warehouse@          → أمين المستودع');
  console.log('  treasury@           → أمين الصندوق');
  console.log('  hr-audit@           → مدقق شؤون الموظفين');
  console.log('  doctor@             → طبيب العيادة');
  console.log('  monitor@            → مراقب وحدة الرقابة');
  console.log('  guidance@           → مرشد أكاديمي');
  console.log('  activities@         → منسق الأنشطة');
  console.log('  job-coord@          → منسق التنسيق الوظيفي');
  console.log('  coop-coord@         → منسق التدريب التعاوني');
  console.log('  curriculum@         → منسق المناهج');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ════════════════════════════════════════════════════════════════
//  REALISTIC DEMO DATA GENERATOR
// ════════════════════════════════════════════════════════════════
async function generateDemoData(
  tenantId: string,
  deptIds: Record<string, string>,
  programIds: Record<string, string>,
  roles: Record<string, string>,
  FIRST_M: string[],
  FIRST_F: string[],
  FATHER_M: string[],
  FAMILIES: string[],
  genName: (seed: number, gender: 'MALE' | 'FEMALE') => string,
) {
  const passwordHash = await argon2.hash('Password@123');

  // ── 1. Trainees (60 متدرب موزعين على 3 برامج)
  console.log('  🎓 60 trainees...');
  const programDistribution = [
    { code: 'NETW-DIP', count: 30 },
    { code: 'CYS-DIP', count: 18 },
    { code: 'WEB-DIP', count: 12 },
  ];
  const traineeIds: string[] = [];
  let traineeCounter = 1000;
  for (const pd of programDistribution) {
    for (let i = 0; i < pd.count; i++) {
      traineeCounter++;
      const studentNumber = `4421${String(traineeCounter).padStart(4, '0')}`;
      const gender = traineeCounter % 4 === 0 ? 'FEMALE' : 'MALE';
      const name = genName(traineeCounter, gender);
      const existing = await prisma.trainee.findUnique({
        where: { tenantId_studentNumber: { tenantId, studentNumber } },
      });
      if (existing) {
        traineeIds.push(existing.id);
        continue;
      }
      const created = await prisma.trainee.create({
        data: {
          tenantId,
          studentNumber,
          fullNameAr: name,
          gender,
          enrollmentDate: new Date('2024-09-01'),
          programId: programIds[pd.code],
          status: traineeCounter % 17 === 0 ? 'WARNED' : 'ACTIVE',
          gpa: 2.5 + (traineeCounter % 18) / 10,
        },
      });
      traineeIds.push(created.id);

      // إنذارات للمنذرين
      if (created.status === 'WARNED') {
        await prisma.academicWarning.create({
          data: { traineeId: created.id, level: 1, reason: 'انخفاض المعدل عن 2.0' },
        });
      }
    }
  }

  // ── 2. Sections (4 شعب لكل برنامج × 3 = 12 شعبة)
  console.log('  📚 12 sections + schedules...');
  const allCourses = await prisma.course.findMany({ where: { tenantId } });
  const trainerForSections = await prisma.trainer.findFirst({ where: { tenantId } });
  const allTrainers = await prisma.trainer.findMany({ where: { tenantId } });
  // أنشئ مدربين إضافيين إذا لم يكن هناك ما يكفي
  if (allTrainers.length < 3) {
    for (let i = allTrainers.length; i < 4; i++) {
      const empNum = `CCI-T-${1000 + i}`;
      let trainerEmp = await prisma.employee.findFirst({
        where: { tenantId, employeeNumber: empNum },
      });
      if (!trainerEmp) {
        trainerEmp = await prisma.employee.create({
          data: {
            tenantId,
            employeeNumber: empNum,
            fullNameAr: genName(2000 + i, 'MALE'),
            gender: 'MALE',
            hireDate: new Date('2021-09-01'),
            jobTitleAr: 'مدرب',
            departmentId: deptIds['DEPT_TRAINING'],
          },
        });
      }
      const existingTrainer = await prisma.trainer.findFirst({
        where: { tenantId, employeeId: trainerEmp.id },
      });
      if (!existingTrainer) {
        await prisma.trainer.create({
          data: {
            tenantId,
            employeeId: trainerEmp.id,
            trainerNumber: `TR-00${10 + i}`,
            specialization: ['الشبكات', 'الأمن السيبراني', 'تطوير الويب'][i % 3],
            qualification: 'بكالوريوس',
            hireDate: new Date('2021-09-01'),
            loadHours: 18,
          },
        });
      }
    }
  }
  const trainersForSections = await prisma.trainer.findMany({ where: { tenantId } });

  const sectionIds: string[] = [];
  const courseSchedules = [
    { day: 'SUN', from: '08:00', to: '10:00' },
    { day: 'TUE', from: '08:00', to: '10:00' },
    { day: 'MON', from: '10:00', to: '12:00' },
    { day: 'WED', from: '10:00', to: '12:00' },
    { day: 'THU', from: '08:00', to: '10:00' },
  ];
  for (let i = 0; i < allCourses.length; i++) {
    const course = allCourses[i];
    for (let s = 0; s < 2; s++) {
      const trainer = trainersForSections[(i + s) % trainersForSections.length];
      const isLab = course.code.startsWith('NET') && s === 0;
      const sched = [
        courseSchedules[(i + s * 2) % courseSchedules.length],
        courseSchedules[(i + s * 2 + 1) % courseSchedules.length],
      ].map((slot) => ({
        ...slot,
        room: isLab ? `معمل ${1 + ((i + s) % 3)}` : `F-${200 + i * 10 + s}`,
        type: isLab ? 'lab' : 'classroom',
      }));
      const existing = await prisma.section.findFirst({
        where: { courseId: course.id, term: '1446-1', trainerId: trainer.id },
      });
      if (existing) {
        sectionIds.push(existing.id);
        continue;
      }
      const created = await prisma.section.create({
        data: {
          courseId: course.id,
          trainerId: trainer.id,
          term: '1446-1',
          capacity: 30,
          isLab,
          schedule: sched as any,
        },
      });
      sectionIds.push(created.id);
    }
  }

  // ── 3. Enrollments (كل متدرب في 3 شعب من برنامجه)
  console.log('  ✏️  150+ enrollments...');
  const enrollIds: string[] = [];
  for (const tid of traineeIds.slice(0, 30)) {  // أول 30 متدرب فقط
    const t = await prisma.trainee.findUnique({ where: { id: tid } });
    if (!t?.programId) continue;
    const programCourses = allCourses.filter((c) => c.programId === t.programId);
    for (let i = 0; i < Math.min(3, programCourses.length); i++) {
      const course = programCourses[i];
      const section = await prisma.section.findFirst({
        where: { courseId: course.id, term: '1446-1' },
      });
      if (!section) continue;
      const existing = await prisma.enrollment.findFirst({
        where: { traineeId: tid, sectionId: section.id },
      });
      if (existing) {
        enrollIds.push(existing.id);
        continue;
      }
      const enrolled = await prisma.enrollment.create({
        data: { traineeId: tid, sectionId: section.id },
      });
      enrollIds.push(enrolled.id);
    }
  }

  // ── 4. Attendance (10 أيام لكل تسجيل، 92% حضور)
  console.log('  📋 1500+ attendance records...');
  const today = new Date();
  for (let dayOffset = 30; dayOffset >= 1; dayOffset -= 3) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);
    for (const eid of enrollIds.slice(0, 50)) {
      const r = (eid.charCodeAt(0) + dayOffset) % 100;
      const status = r < 88 ? 'PRESENT' : r < 94 ? 'LATE' : r < 97 ? 'EXCUSED' : 'ABSENT';
      try {
        await prisma.traineeAttendance.upsert({
          where: { enrollmentId_date: { enrollmentId: eid, date } },
          update: {},
          create: {
            enrollmentId: eid,
            date,
            status: status as any,
          },
        });
      } catch {}
    }
  }

  // ── 5. Grades (50% من التسجيلات لها درجات)
  console.log('  💯 grades for 50% of enrollments...');
  for (let i = 0; i < enrollIds.length; i += 2) {
    const eid = enrollIds[i];
    const dist = i % 10;
    const grade = dist < 3 ? 90 + Math.floor(Math.random() * 10)
      : dist < 7 ? 75 + Math.floor(Math.random() * 14)
      : dist < 9 ? 60 + Math.floor(Math.random() * 14)
      : 35 + Math.floor(Math.random() * 24);
    await prisma.enrollment.update({
      where: { id: eid },
      data: { grade, status: grade >= 60 ? 'PASSED' : 'FAILED' as any },
    }).catch(() => {});
  }

  // ── 6. Leaves (15 طلب إجازة في حالات مختلفة)
  console.log('  🏖  15 leave requests...');
  const employees = await prisma.employee.findMany({ where: { tenantId }, take: 30 });
  const leaveTypes = ['ANNUAL', 'SICK', 'EMERGENCY', 'STUDY'];
  for (let i = 0; i < 15; i++) {
    const emp = employees[i % employees.length];
    const type = leaveTypes[i % leaveTypes.length];
    const start = new Date(today);
    start.setDate(today.getDate() - 30 + i * 4);
    const days = 1 + (i % 7);
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    const status = i < 8 ? 'APPROVED' : i < 12 ? 'PENDING' : i < 14 ? 'REJECTED' : 'CANCELLED';

    const exists = await prisma.leave.findFirst({
      where: { employeeId: emp.id, startDate: start },
    });
    if (exists) continue;

    await prisma.leave.create({
      data: {
        employeeId: emp.id,
        type: type as any,
        startDate: start,
        endDate: end,
        days,
        reason: `${type === 'SICK' ? 'إجازة مرضية' : type === 'ANNUAL' ? 'إجازة اعتيادية' : 'إجازة'} #${i + 1}`,
        status: status as any,
      },
    });
  }

  // ── 7. Purchase Requests (8 طلبات بمبالغ متنوعة)
  console.log('  💰 8 purchase requests...');
  const dean = await prisma.user.findFirst({ where: { email: 'dean@cci-riyadh.edu.sa' } });
  if (dean) {
    const PRs = [
      { desc: 'أجهزة كمبيوتر للمعمل الجديد', amount: 75000, type: 'EQUIPMENT', status: 'APPROVED' },
      { desc: 'برامج Cisco للتدريب', amount: 25000, type: 'TRAINING_NEEDS', status: 'APPROVED' },
      { desc: 'تجديد عقد الإنترنت', amount: 12000, type: 'OTHER', status: 'APPROVED' },
      { desc: 'مواد للورش الميكانيكية', amount: 8500, type: 'EQUIPMENT', status: 'APPROVED' },
      { desc: 'صيانة المكيفات', amount: 18000, type: 'MAINTENANCE', status: 'UNDER_REVIEW' },
      { desc: 'سيرفرات جديدة (يحتاج المدير العام)', amount: 250000, type: 'EQUIPMENT', status: 'UNDER_REVIEW' },
      { desc: 'احتياجات قسم الأمن السيبراني', amount: 45000, type: 'TRAINING_NEEDS', status: 'SUBMITTED' },
      { desc: 'تجهيزات معمل البنات بالسجون', amount: 92000, type: 'EQUIPMENT', status: 'APPROVED' },
    ];
    for (let i = 0; i < PRs.length; i++) {
      const pr = PRs[i];
      const number = `PR-1446-${String(100 + i).padStart(4, '0')}`;
      const exists = await prisma.purchaseRequest.findUnique({ where: { number } });
      if (exists) continue;
      await prisma.purchaseRequest.create({
        data: {
          number,
          requesterId: dean.id,
          departmentId: deptIds['FINANCE'],
          type: pr.type as any,
          description: pr.desc,
          amount: pr.amount,
          status: pr.status as any,
          vendorName: ['شركة الالف', 'مؤسسة الجودة', 'العالمية للتقنية'][i % 3],
          items: {
            create: [{ nameAr: pr.desc, qty: 1, unit: 'وحدة', unitPrice: pr.amount, total: pr.amount }],
          },
        },
      });
    }
  }

  // ── 8. Meetings + Decisions (5 اجتماعات سابقة + 2 قادمة)
  console.log('  🏛  7 meetings + decisions...');
  const council = await prisma.council.findFirst({ where: { tenantId } });
  let mainCouncil = council;
  if (!mainCouncil) {
    mainCouncil = await prisma.council.create({
      data: {
        tenantId,
        nameAr: 'مجلس كلية الاتصالات والمعلومات',
        type: 'MAIN_COUNCIL',
        termFrom: new Date('2024-09-01'),
        termUntil: new Date('2027-08-31'),
      },
    });
  }
  const meetingsData = [
    { title: 'الاجتماع الأول للفصل الدراسي', daysAgo: 90, status: 'COMPLETED', decisions: 4 },
    { title: 'مراجعة نتائج الاختبارات النصفية', daysAgo: 60, status: 'COMPLETED', decisions: 3 },
    { title: 'اعتماد الخطط التشغيلية للأقسام', daysAgo: 45, status: 'COMPLETED', decisions: 5 },
    { title: 'متابعة مؤشرات الجودة', daysAgo: 30, status: 'COMPLETED', decisions: 2 },
    { title: 'مراجعة طلبات إعادة القيد', daysAgo: 15, status: 'COMPLETED', decisions: 6 },
    { title: 'اجتماع نهاية الفصل', daysAgo: -7, status: 'SCHEDULED', decisions: 0 },
    { title: 'لقاء مع المدير العام', daysAgo: -14, status: 'SCHEDULED', decisions: 0 },
  ];
  for (let i = 0; i < meetingsData.length; i++) {
    const m = meetingsData[i];
    const date = new Date(today);
    date.setDate(today.getDate() - m.daysAgo);
    const exists = await prisma.meeting.findFirst({
      where: { councilId: mainCouncil.id, scheduledAt: date },
    });
    if (exists) continue;
    const meeting = await prisma.meeting.create({
      data: {
        councilId: mainCouncil.id,
        titleAr: m.title,
        agenda: [
          { item: 'الافتتاحية', presenter: 'العميد', durationMins: 5 },
          { item: 'البنود الرئيسية', presenter: 'المختصون', durationMins: 60 },
          { item: 'القرارات', presenter: 'الأمانة', durationMins: 15 },
        ] as any,
        scheduledAt: date,
        status: m.status as any,
        location: 'قاعة المجلس',
      },
    });
    for (let d = 0; d < m.decisions; d++) {
      await prisma.decision.create({
        data: {
          meetingId: meeting.id,
          number: `قرار ${i + 1}.${d + 1}`,
          topic: ['اعتماد الخطة', 'تعديل اللائحة', 'تشكيل لجنة', 'الموافقة على الترشيح'][d % 4],
          description: `قرار يتعلق بـ ${m.title}`,
          vote: d % 4 === 3 ? 'PENDING' : 'APPROVED' as any,
          approvedBy: 5 + (d % 3),
          rejectedBy: d % 5,
          status: 'IN_PROGRESS' as any,
        },
      });
    }
  }

  // ── 9. KPI Measurements (6 شهور لكل KPI)
  console.log('  📈 KPI measurements (6 months)...');
  const kpis = await prisma.kpi.findMany({ where: { tenantId } });
  const targets: Record<string, number[]> = {
    TRAINEE_RETENTION: [88, 89, 91, 90, 92, 93],
    GRADUATION_RATE: [82, 83, 84, 85, 84, 86],
    EMPLOYMENT_RATE: [65, 67, 68, 70, 71, 72],
    TRAINER_LOAD_AVG: [16, 17, 18, 18, 17, 18],
    COMPLAINT_SLA: [88, 91, 93, 94, 95, 96],
  };
  for (const kpi of kpis) {
    const values = targets[kpi.code] ?? [50, 55, 60, 65, 70, 75];
    for (let m = 0; m < 6; m++) {
      const period = `1446-${String(m + 1).padStart(2, '0')}`;
      await prisma.kpiMeasurement.upsert({
        where: { kpiId_period: { kpiId: kpi.id, period } },
        update: { value: values[m] },
        create: { kpiId: kpi.id, period, value: values[m] },
      });
    }
  }

  // ── 10. Quality Plans (سنوية معتمدة + فصلية مقدّمة)
  console.log('  🎯 2 quality plans...');
  const planExists = await prisma.qualityPlan.findFirst({
    where: { tenantId, fiscalYear: '1446', scope: 'YEARLY', season: null },
  });
  if (!planExists && dean) {
    await prisma.qualityPlan.create({
      data: {
        tenantId,
        fiscalYear: '1446',
        scope: 'YEARLY',
        goals: [
          { ar: 'رفع نسبة رضا المتدربين إلى 92%', target: '92', kpiCode: 'TRAINEE_RETENTION' },
          { ar: 'تحقيق اعتماد NCAAA', target: '100', kpiCode: 'GRADUATION_RATE' },
          { ar: 'تطوير مهارات 50 مدرب', target: '50', kpiCode: 'TRAINER_LOAD_AVG' },
        ] as any,
        activities: [
          { ar: 'إطلاق استبيانات شهرية للمتدربين', ownerEmpId: '', status: 'IN_PROGRESS' },
          { ar: 'مراجعة الحقائب التدريبية', ownerEmpId: '', status: 'IN_PROGRESS' },
          { ar: 'دورات تطوير للمدربين', ownerEmpId: '', status: 'PLANNED' },
        ] as any,
        status: 'APPROVED',
        approvedAt: new Date('2024-09-15'),
        createdById: dean.id,
      },
    });
  }

  // ── 11. Quality Teams (3 فرق)
  console.log('  👥 3 quality teams...');
  const teamsData = [
    { nameAr: 'فريق ضبط جودة الاختبارات', purpose: 'مراجعة الاختبارات الفصلية وضمان عدالتها', status: 'ACTIVE' },
    { nameAr: 'فريق الاعتماد الأكاديمي NCAAA', purpose: 'تحضير وثائق الاعتماد للزيارة القادمة', status: 'ACTIVE' },
    { nameAr: 'فريق رصد المخاطر التشغيلية', purpose: 'تحديد ومتابعة المخاطر', status: 'PROPOSED' },
  ];
  for (const td of teamsData) {
    const exists = await prisma.qualityTeam.findFirst({
      where: { tenantId, nameAr: td.nameAr },
    });
    if (exists) continue;
    const team = await prisma.qualityTeam.create({
      data: {
        tenantId,
        nameAr: td.nameAr,
        charter: { purposeAr: td.purpose, scopeAr: 'كل الأقسام', deliverables: ['تقرير ربعي', 'توصيات'] } as any,
        status: td.status as any,
        members: [] as any,
      },
    });
    if (td.status === 'ACTIVE') {
      await prisma.qualityTeamTask.createMany({
        data: [
          { teamId: team.id, title: 'مراجعة 100 اختبار', status: 'IN_PROGRESS', dueAt: new Date(today.getTime() + 7 * 86400000) },
          { teamId: team.id, title: 'إعداد تقرير ربعي', status: 'TODO', dueAt: new Date(today.getTime() + 30 * 86400000) },
        ],
      });
    }
  }

  // ── 12. Accreditation Standards (10 معايير)
  console.log('  🏅 10 accreditation standards...');
  const standards = [
    { code: 'NCAAA-1.1', name: 'الرسالة والأهداف', status: 'VERIFIED' },
    { code: 'NCAAA-2.1', name: 'الحوكمة والإدارة', status: 'EVIDENCE_READY' },
    { code: 'NCAAA-3.1', name: 'إدارة جودة التعليم', status: 'IN_PROGRESS' },
    { code: 'NCAAA-3.4', name: 'تقييم نواتج التعلم', status: 'IN_PROGRESS' },
    { code: 'NCAAA-4.1', name: 'التعليم والتعلم', status: 'EVIDENCE_READY' },
    { code: 'NCAAA-5.1', name: 'الطلاب', status: 'VERIFIED' },
    { code: 'NCAAA-6.1', name: 'أعضاء هيئة التدريس', status: 'IN_PROGRESS' },
    { code: 'NCAAA-7.1', name: 'مرافق التعليم والمصادر', status: 'WEAK' },
    { code: 'NCAAA-8.1', name: 'الإدارة المالية', status: 'NOT_STARTED' },
    { code: 'NCAAA-9.1', name: 'البحث والابتكار', status: 'NOT_STARTED' },
  ];
  for (const s of standards) {
    await prisma.accreditation.upsert({
      where: { tenantId_standardCode_cycle: { tenantId, standardCode: s.code, cycle: '2026' } },
      update: { status: s.status as any },
      create: {
        tenantId,
        standardCode: s.code,
        nameAr: s.name,
        cycle: '2026',
        dueDate: new Date('2026-12-01'),
        status: s.status as any,
      },
    });
  }

  // ── 13. Training Outcomes (لأهم 3 أقسام × فصلين)
  console.log('  📊 6 training outcomes...');
  const outcomeData = [
    { dept: 'DEPT_TRAINING', term: '1445-2', pass: 88, emp: 72, esf: 78, ssf: 82 },
    { dept: 'DEPT_TRAINING', term: '1446-1', pass: 91, emp: 75, esf: 81, ssf: 85 },
    { dept: 'DEPT_ELEARN', term: '1445-2', pass: 85, emp: 68, esf: 75, ssf: 79 },
    { dept: 'DEPT_ELEARN', term: '1446-1', pass: 89, emp: 73, esf: 80, ssf: 84 },
    { dept: 'GIRLS_PRISON', term: '1445-2', pass: 78, emp: 60, esf: 70, ssf: 74 },
    { dept: 'GIRLS_PRISON', term: '1446-1', pass: 82, emp: 65, esf: 73, ssf: 77 },
  ];
  if (dean) {
    for (const o of outcomeData) {
      const deptId = deptIds[o.dept];
      if (!deptId) continue;
      await prisma.trainingOutcome.upsert({
        where: { tenantId_departmentId_term: { tenantId, departmentId: deptId, term: o.term } },
        update: { passRate: o.pass, employmentRate: o.emp, employerSatisfaction: o.esf, studentSatisfaction: o.ssf },
        create: {
          tenantId, departmentId: deptId, term: o.term,
          passRate: o.pass, employmentRate: o.emp,
          employerSatisfaction: o.esf, studentSatisfaction: o.ssf,
          measuredById: dean.id,
        },
      });
    }
  }

  // ── 14. Nominations (5 ترشيحات)
  console.log('  🎓 5 nominations...');
  const nominationData = [
    { title: 'Cisco CCNA Bootcamp', provider: 'Cisco Networking Academy', cost: 8000, status: 'ATTENDED' },
    { title: 'CISSP Training', provider: 'ISC2', cost: 15000, status: 'APPROVED' },
    { title: 'AWS Solutions Architect', provider: 'Amazon Saudi', cost: 12000, status: 'PROPOSED' },
    { title: 'مؤتمر التعليم التقني العالمي', provider: 'WorldSkills', cost: 25000, status: 'APPROVED' },
    { title: 'Project Management PMP', provider: 'PMI', cost: 9500, status: 'REJECTED' },
  ];
  if (dean) {
    for (let i = 0; i < nominationData.length; i++) {
      const n = nominationData[i];
      const emp = employees[i];
      if (!emp) continue;
      const exists = await prisma.nomination.findFirst({
        where: { employeeId: emp.id, courseTitle: n.title },
      });
      if (exists) continue;
      await prisma.nomination.create({
        data: {
          tenantId,
          employeeId: emp.id,
          courseTitle: n.title,
          providerName: n.provider,
          startDate: new Date(today.getTime() + (15 + i * 10) * 86400000),
          endDate: new Date(today.getTime() + (15 + i * 10 + 5) * 86400000),
          cost: n.cost,
          justification: `تطوير مهارات ${n.title.split(' ')[0]} للموظف`,
          status: n.status as any,
          attendanceConfirmed: n.status === 'ATTENDED',
          recommendedById: dean.id,
        },
      });
    }
  }

  // ── 15. DG Reports (3 تقارير)
  console.log('  📤 3 DG reports...');
  const dgReports = [
    { period: '2025-Q4', type: 'QUARTERLY', title: 'تقرير الربع الرابع 2025', status: 'ACKNOWLEDGED', tracking: 'CCI-2025-9001', feedback: 'شكراً لكم. نلاحظ تحسناً في مؤشرات التخرج.' },
    { period: '2026-Q1', type: 'QUARTERLY', title: 'تقرير الربع الأول 2026', status: 'SUBMITTED', tracking: 'CCI-2026-0145' },
    { period: '2026-Q2', type: 'QUARTERLY', title: 'تقرير الربع الثاني 2026', status: 'DRAFT', tracking: null },
  ];
  for (const r of dgReports) {
    await prisma.dGReport.upsert({
      where: { tenantId_period_type: { tenantId, period: r.period, type: r.type as any } },
      update: { status: r.status as any, trackingNumber: r.tracking, gmFeedback: r.feedback },
      create: {
        tenantId,
        period: r.period,
        type: r.type as any,
        title: r.title,
        body: `تقرير ${r.title} يلخص أنشطة الكلية خلال الفترة. الإنجازات: تحسين 5 مؤشرات أداء، تخرج 120 متدرباً، اعتماد 3 معايير. التحديات: نقص أجهزة المعمل، تأخر بعض الترشيحات.`,
        status: r.status as any,
        trackingNumber: r.tracking,
        gmFeedback: r.feedback,
        gmFeedbackAt: r.feedback ? new Date(today.getTime() - 30 * 86400000) : null,
        submittedAt: r.status !== 'DRAFT' ? new Date(today.getTime() - 60 * 86400000) : null,
        submittedById: r.status !== 'DRAFT' ? dean?.id : null,
      },
    });
  }

  // ── 16. Quality Campaigns (3 حملات)
  console.log('  🎉 3 campaigns...');
  const campaigns = [
    { title: 'يوم الجودة 2026', type: 'EVENT', audience: 'ALL', objective: 'نشر ثقافة الجودة المؤسسية', daysAgo: -45 },
    { title: 'ورشة كتابة معايير الاعتماد', type: 'WORKSHOP', audience: 'EMPLOYEES', objective: 'تأهيل الموظفين لكتابة الشواهد', daysAgo: -10 },
    { title: 'حملة إعلامية: الجودة مسؤوليتنا', type: 'MEDIA', audience: 'ALL', objective: 'رفع وعي الجميع', daysAgo: 30 },
  ];
  for (const c of campaigns) {
    const start = new Date(today);
    start.setDate(today.getDate() - c.daysAgo);
    const end = new Date(start);
    end.setDate(start.getDate() + 5);
    const exists = await prisma.qualityCampaign.findFirst({
      where: { tenantId, title: c.title },
    });
    if (exists) continue;
    await prisma.qualityCampaign.create({
      data: {
        tenantId,
        title: c.title,
        type: c.type as any,
        startDate: start,
        endDate: end,
        targetAudience: c.audience,
        objectiveAr: c.objective,
        attendeesCount: c.daysAgo > 0 ? null : 50 + Math.floor(Math.random() * 100),
      },
    });
  }

  // ── 17. IT Tickets (8)
  console.log('  🎫 8 IT tickets...');
  const ticketData = [
    { cat: 'NETWORK', sub: 'انقطاع الإنترنت في معمل 2', prio: 'HIGH', status: 'RESOLVED' },
    { cat: 'SOFTWARE', sub: 'مشكلة في برنامج Office', prio: 'NORMAL', status: 'RESOLVED' },
    { cat: 'HARDWARE', sub: 'الطابعة لا تعمل', prio: 'NORMAL', status: 'IN_PROGRESS' },
    { cat: 'ACCESS', sub: 'طلب صلاحية للنظام', prio: 'NORMAL', status: 'OPEN' },
    { cat: 'EMAIL', sub: 'لم يستلم البريد منذ 3 أيام', prio: 'HIGH', status: 'RESOLVED' },
    { cat: 'NETWORK', sub: 'بطء في الشبكة', prio: 'NORMAL', status: 'IN_PROGRESS' },
    { cat: 'HARDWARE', sub: 'عطل في جهاز Cisco router', prio: 'URGENT', status: 'OPEN' },
    { cat: 'OTHER', sub: 'استفسار عن نظام جديد', prio: 'LOW', status: 'CLOSED' },
  ];
  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i];
    const number = `TK-2026-${String(100 + i).padStart(5, '0')}`;
    const exists = await prisma.ticket.findUnique({ where: { number } });
    if (exists) continue;
    await prisma.ticket.create({
      data: {
        tenantId,
        number,
        creatorId: employees[i % employees.length]?.userId ?? dean!.id,
        category: t.cat as any,
        priority: t.prio as any,
        subject: t.sub,
        description: `تفاصيل الطلب: ${t.sub}. تم الإبلاغ منذ عدة أيام.`,
        status: t.status as any,
      },
    });
  }

  // ── 18. Maintenance Requests (5)
  console.log('  🔧 5 maintenance requests...');
  const maintData = [
    { cat: 'HVAC', loc: 'مبنى A - الطابق 2', desc: 'تكييف لا يعمل في القاعة 201', status: 'DONE' },
    { cat: 'PLUMBING', loc: 'دورة المياه - الطابق 1', desc: 'تسرب في الحنفية', status: 'IN_PROGRESS' },
    { cat: 'ELECTRICAL', loc: 'معمل الشبكات', desc: 'انقطاع متكرر في الكهرباء', status: 'OPEN' },
    { cat: 'OTHER', loc: 'الباحة الخارجية', desc: 'تنظيف الباحة', status: 'DONE' },
    { cat: 'ELECTRICAL', loc: 'معمل البنات بالسجون', desc: 'تركيب مقابس إضافية', status: 'OPEN' },
  ];
  for (let i = 0; i < maintData.length; i++) {
    const m = maintData[i];
    const number = `MR-2026-${String(50 + i).padStart(5, '0')}`;
    const exists = await prisma.maintenanceRequest.findUnique({ where: { number } });
    if (exists) continue;
    await prisma.maintenanceRequest.create({
      data: {
        tenantId,
        number,
        requesterId: employees[i % employees.length]?.userId ?? dean!.id,
        category: m.cat,
        location: m.loc,
        description: m.desc,
        priority: 'NORMAL',
        status: m.status as any,
      },
    });
  }

  // ── 19. Risks (6 مخاطر)
  console.log('  ⚠️  6 risks...');
  const risks = [
    { title: 'تأخر تسليم أجهزة المعمل الجديد', cat: 'OPERATIONAL', l: 4, i: 4 },
    { title: 'انخفاض نسبة الالتحاق ببرنامج معيّن', cat: 'STRATEGIC', l: 3, i: 4 },
    { title: 'فقدان موظف رئيسي بدون بديل', cat: 'HR', l: 2, i: 5 },
    { title: 'اختراق أمني محتمل في النظام', cat: 'CYBER', l: 2, i: 5 },
    { title: 'تأخر اعتماد NCAAA', cat: 'COMPLIANCE', l: 3, i: 5 },
    { title: 'نقص في الميزانية للفصل القادم', cat: 'FINANCIAL', l: 3, i: 4 },
  ];
  for (const r of risks) {
    const exists = await prisma.risk.findFirst({ where: { tenantId, title: r.title } });
    if (exists) continue;
    await prisma.risk.create({
      data: {
        tenantId,
        title: r.title,
        category: r.cat,
        likelihood: r.l,
        impact: r.i,
        score: r.l * r.i,
        status: 'OPEN',
      },
    });
  }

  // ── 20. Quality Improvement Plans (4)
  console.log('  🚀 4 improvement plans...');
  const qips = [
    { scope: 'KPI_GAP', cause: 'انخفاض نسبة الاستمرار عن المستهدف', kpi: 'TRAINEE_RETENTION', status: 'IN_PROGRESS' },
    { scope: 'OPERATIONAL', cause: 'تأخر صيانة المعامل تأثر على الجودة', kpi: 'COMPLAINT_SLA', status: 'IN_PROGRESS' },
    { scope: 'STRATEGIC', cause: 'تباين في تقييم الحقائب بين الأقسام', kpi: null, status: 'COMPLETED' },
    { scope: 'KPI_GAP', cause: 'انخفاض رضا الموظفين عن الحقائب', kpi: 'COMPLAINT_SLA', status: 'DRAFT' },
  ];
  for (const q of qips) {
    const exists = await prisma.qualityImprovementPlan.findFirst({
      where: { tenantId, rootCause: q.cause },
    });
    if (exists) continue;
    await prisma.qualityImprovementPlan.create({
      data: {
        tenantId,
        fiscalYear: '1446',
        scope: q.scope,
        rootCause: q.cause,
        targetKpiCode: q.kpi,
        targetValue: 95,
        actions: [
          { ar: 'تحليل السبب الجذري' },
          { ar: 'وضع خطة تنفيذية' },
          { ar: 'متابعة شهرية' },
        ] as any,
        status: q.status as any,
        startDate: q.status !== 'DRAFT' ? new Date(today.getTime() - 60 * 86400000) : null,
        closedAt: q.status === 'COMPLETED' ? new Date(today.getTime() - 10 * 86400000) : null,
      },
    });
  }

  // ── 21. Surveys (3 استبيانات)
  console.log('  📝 3 surveys...');
  const surveysData = [
    { title: 'استبيان رضا المتدربين عن الفصل الأول', audience: 'TRAINEES' },
    { title: 'استبيان رضا الموظفين السنوي', audience: 'EMPLOYEES' },
    { title: 'استبيان رأي أصحاب العمل في الخريجين', audience: 'EMPLOYERS' },
  ];
  for (const s of surveysData) {
    const exists = await prisma.survey.findFirst({ where: { tenantId, title: s.title } });
    if (exists) continue;
    await prisma.survey.create({
      data: {
        tenantId,
        title: s.title,
        audience: s.audience,
        status: 'OPEN',
        questions: [
          { id: '1', text: 'كيف تقيّم الجودة العامة؟', type: 'rating', scale: 5 },
          { id: '2', text: 'ما المقترحات؟', type: 'text' },
        ] as any,
      },
    });
  }

  // ──────────── أنظمة جديدة (Tasks/Projects/Boards/AI/Data) ────────────
  await generateNewSystemsDemo(tenantId, dean, employees, deptIds);

  console.log('  ✅ Demo data generated successfully\n');
}

async function generateNewSystemsDemo(tenantId: string, dean: any, employees: any[], deptIds: Record<string, string>) {
  if (!dean) return;
  const today = new Date();

  // ── 1. Tasks (50 مهمة موزعة على المستخدمين)
  console.log('  ✅ 50 tasks...');
  const allUsers = await prisma.user.findMany({ where: { tenantId }, select: { id: true } });
  const taskTitles = [
    'مراجعة الخطة التشغيلية', 'إعداد تقرير شهري', 'متابعة شكوى متدرب',
    'تنظيم ورشة تدريبية', 'مراجعة فاتورة شراء', 'فحص أجهزة المعمل',
    'اعتماد طلب إجازة', 'تجهيز اجتماع المجلس', 'متابعة مشروع Cisco',
    'إعداد عرض تقديمي', 'تحديث قاعدة البيانات', 'مراجعة المخاطر',
    'إصدار شهادات', 'تحديث الموقع الإلكتروني', 'إعداد ميزانية الفصل',
    'متابعة الاعتماد الأكاديمي', 'تنظيم رحلة ميدانية', 'تدريب المنسوبين',
    'مراجعة المناهج', 'تحديث الجداول التدريبية',
  ];
  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const statuses = ['NEW', 'IN_PROGRESS', 'PENDING_APPROVAL', 'DONE'];
  for (let i = 0; i < 50; i++) {
    const exists = await prisma.task.findFirst({
      where: { tenantId, title: `${taskTitles[i % taskTitles.length]} #${i + 1}` },
    });
    if (exists) continue;
    const assignee = allUsers[i % allUsers.length].id;
    const creator = allUsers[(i + 7) % allUsers.length].id;
    const status = statuses[i % statuses.length];
    const due = new Date(today);
    due.setDate(today.getDate() + (i % 30) - 5);  // mix overdue + future
    await prisma.task.create({
      data: {
        tenantId,
        title: `${taskTitles[i % taskTitles.length]} #${i + 1}`,
        description: `وصف للمهمة رقم ${i + 1}، تحتاج متابعة وتنفيذ خلال الفترة المحددة.`,
        priority: priorities[i % 4] as any,
        status: status as any,
        assigneeId: assignee,
        createdById: creator,
        dueDate: due,
        tags: ['تشغيلي', i % 3 === 0 ? 'عاجل' : 'عادي'],
        completedAt: status === 'DONE' ? new Date() : null,
      },
    });
  }

  // ── 2. Projects (8 مشاريع)
  console.log('  📁 8 projects...');
  const projectsData = [
    { code: 'PRJ-2026-001', nameAr: 'مشروع الاعتماد الأكاديمي NCAAA', type: 'QUALITY', status: 'ACTIVE', progress: 65 },
    { code: 'PRJ-2026-002', nameAr: 'تطوير معمل الأمن السيبراني', type: 'TECHNICAL', status: 'PLANNING', progress: 15 },
    { code: 'PRJ-2026-003', nameAr: 'تحديث نظام التدريب الإلكتروني', type: 'TECHNICAL', status: 'ACTIVE', progress: 40 },
    { code: 'PRJ-2026-004', nameAr: 'برنامج تطوير المدربين 2026', type: 'TRAINING', status: 'ACTIVE', progress: 30 },
    { code: 'PRJ-2026-005', nameAr: 'حملة استقطاب متدربين جدد', type: 'OPERATIONAL', status: 'COMPLETED', progress: 100 },
    { code: 'PRJ-2026-006', nameAr: 'مراجعة الميزانية السنوية', type: 'FINANCIAL', status: 'ACTIVE', progress: 50 },
    { code: 'PRJ-2026-007', nameAr: 'مبادرة إعادة هيكلة الأقسام', type: 'STRATEGIC', status: 'ON_HOLD', progress: 20 },
    { code: 'PRJ-2026-008', nameAr: 'مشروع تحول رقمي للسجلات', type: 'TECHNICAL', status: 'PLANNING', progress: 5 },
  ];
  for (const pd of projectsData) {
    const exists = await prisma.project.findUnique({ where: { tenantId_code: { tenantId, code: pd.code } } });
    if (exists) continue;
    const project = await prisma.project.create({
      data: {
        tenantId,
        code: pd.code,
        nameAr: pd.nameAr,
        type: pd.type as any,
        status: pd.status as any,
        ownerId: dean.id,
        startDate: new Date(today.getTime() - 60 * 86400000),
        targetEndDate: new Date(today.getTime() + 90 * 86400000),
        progress: pd.progress,
        budget: 50000 + Math.random() * 200000,
        description: `وصف مشروع ${pd.nameAr}.`,
      },
    });
    // أضف 3 milestones لكل مشروع
    for (let m = 0; m < 3; m++) {
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          nameAr: `مرحلة ${m + 1}: ${['التخطيط', 'التنفيذ', 'الإغلاق'][m]}`,
          dueDate: new Date(today.getTime() + (m + 1) * 30 * 86400000),
          completedAt: m === 0 && pd.progress > 30 ? new Date() : null,
          order: m,
        },
      });
    }
    // أعضاء (4-5 من المستخدمين)
    for (let m = 0; m < 4; m++) {
      const member = allUsers[(m * 13) % allUsers.length];
      const exists2 = await prisma.projectMember.findFirst({
        where: { projectId: project.id, userId: member.id },
      });
      if (!exists2) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: member.id,
            role: m === 0 ? 'OWNER' : m === 1 ? 'MANAGER' : 'MEMBER',
          },
        });
      }
    }
  }

  // ── 3. Boards (5 لوحات)
  console.log('  📋 5 boards + cards...');
  const boardsData = [
    { nameAr: 'لوحة مهام الإدارة', type: 'TASK', scope: 'global' },
    { nameAr: 'لوحة المشاريع الجارية', type: 'PROJECT', scope: 'global' },
    { nameAr: 'لوحة الاعتمادات المعلّقة', type: 'APPROVAL', scope: 'global' },
    { nameAr: 'لوحة الجودة', type: 'QUALITY', scope: 'unit:VD_QUALITY' },
    { nameAr: 'لوحة المخاطر', type: 'RISK', scope: 'global' },
  ];
  for (const bd of boardsData) {
    const exists = await prisma.board.findFirst({ where: { tenantId, nameAr: bd.nameAr } });
    if (exists) continue;
    const board = await prisma.board.create({
      data: {
        tenantId,
        nameAr: bd.nameAr,
        type: bd.type as any,
        scope: bd.scope,
        ownerId: dean.id,
      },
    });
    const cols = [
      { nameAr: 'جديد', color: '#94a3b8' },
      { nameAr: 'قيد التنفيذ', color: '#3b82f6' },
      { nameAr: 'بانتظار الاعتماد', color: '#f59e0b' },
      { nameAr: 'مكتمل', color: '#10b981' },
    ];
    for (let i = 0; i < cols.length; i++) {
      const col = await prisma.boardColumn.create({
        data: { boardId: board.id, ...cols[i], order: i },
      });
      // 2-4 cards في كل عمود
      for (let c = 0; c < 2 + (i % 3); c++) {
        await prisma.boardCard.create({
          data: {
            columnId: col.id,
            title: `${bd.nameAr} - بطاقة ${c + 1}`,
            description: `بطاقة في عمود ${cols[i].nameAr}`,
            order: c,
            assigneeId: allUsers[c % allUsers.length].id,
            dueDate: new Date(today.getTime() + (c + 1) * 7 * 86400000),
          },
        });
      }
    }
  }

  // ── 4. AI Conversations (3 محادثات نموذجية)
  console.log('  🤖 3 AI conversations...');
  const conversationsData = [
    { title: 'سؤال عن صلاحياتي', userMsg: 'ما هي صلاحياتي في النظام؟', botReply: 'بصفتك عميد، لديك 51 صلاحية تشمل اعتماد الإجازات حتى مستوى العميد، إنشاء وإدارة الأقسام، اعتماد طلبات الشراء حتى 100,000 ر.س، والوصول لكل أنظمة الجودة والذكاء الاصطناعي والبيانات.' },
    { title: 'تلخيص مؤشرات الجودة', userMsg: 'لخّص لي مؤشرات الجودة لهذا الفصل', botReply: 'لدينا 5 مؤشرات: نسبة الاستمرار 91% (✅)، نسبة التخرج 84% (✅)، نسبة التوظيف 70% (✅)، متوسط النصاب 18 ساعة (✅)، التزام الشكاوى بالـ SLA 96% (✅). جميع المؤشرات على المسار.' },
    { title: 'كيف أنشئ مشروع جديد؟', userMsg: 'كيف أنشئ مشروع جديد؟', botReply: 'افتح "نظام المشاريع" من sidebar، اضغط "+ مشروع جديد"، اختر النوع (تشغيلي/استراتيجي/جودة/...)، أدخل الاسم والوصف وتاريخ البداية. بعدها يمكنك إضافة أعضاء ومراحل ومهام.' },
  ];
  for (const cd of conversationsData) {
    const exists = await prisma.aIConversation.findFirst({ where: { userId: dean.id, title: cd.title } });
    if (exists) continue;
    const conv = await prisma.aIConversation.create({
      data: { tenantId, userId: dean.id, title: cd.title },
    });
    await prisma.aIMessage.create({
      data: { conversationId: conv.id, role: 'USER', content: cd.userMsg },
    });
    await prisma.aIMessage.create({
      data: { conversationId: conv.id, role: 'ASSISTANT', content: cd.botReply },
    });
  }

  // ── 5. Data Lake Files (15 ملف نموذجي)
  console.log('  💧 15 data lake files...');
  const filesData = [
    { name: 'محضر مجلس 2026-Q1.pdf', source: 'upload', cat: 'PROCESSED', mime: 'application/pdf', size: 245000 },
    { name: 'خطة سنوية 1447.docx', source: 'upload', cat: 'RAW', mime: 'application/msword', size: 88000 },
    { name: 'kpi_export_2026_03.xlsx', source: 'export', cat: 'ANALYTICS', mime: 'application/vnd.ms-excel', size: 124000 },
    { name: 'حضور_متدربين_فبراير.csv', source: 'export', cat: 'RAW', mime: 'text/csv', size: 56000 },
    { name: 'NCAAA-evidence-3.4.pdf', source: 'upload', cat: 'PROCESSED', mime: 'application/pdf', size: 412000 },
    { name: 'ميزانية_1446.xlsx', source: 'upload', cat: 'PROCESSED', mime: 'application/vnd.ms-excel', size: 92000 },
    { name: 'survey_results_q1.json', source: 'export', cat: 'ANALYTICS', mime: 'application/json', size: 18000 },
    { name: 'graduates_2025.json', source: 'export', cat: 'ANALYTICS', mime: 'application/json', size: 45000 },
    { name: 'old_meetings_2024.zip', source: 'upload', cat: 'ARCHIVE', mime: 'application/zip', size: 1500000 },
    { name: 'training_dataset_v1.json', source: 'export', cat: 'AI_TRAINING', mime: 'application/json', size: 340000 },
    { name: 'grades_export_term_1.xlsx', source: 'export', cat: 'RAW', mime: 'application/vnd.ms-excel', size: 78000 },
    { name: 'audit_log_february.json', source: 'log', cat: 'RAW', mime: 'application/json', size: 22000 },
    { name: 'attendance_archive_2023.zip', source: 'upload', cat: 'ARCHIVE', mime: 'application/zip', size: 890000 },
    { name: 'kpi_trends_q1_q4.csv', source: 'export', cat: 'ANALYTICS', mime: 'text/csv', size: 34000 },
    { name: 'employees_master.csv', source: 'export', cat: 'PROCESSED', mime: 'text/csv', size: 67000 },
  ];
  for (const fd of filesData) {
    const exists = await prisma.dataLakeFile.findFirst({ where: { tenantId, name: fd.name } });
    if (exists) continue;
    await prisma.dataLakeFile.create({
      data: {
        tenantId,
        name: fd.name,
        source: fd.source,
        category: fd.cat as any,
        mimeType: fd.mime,
        size: fd.size,
        uploadedById: dean.id,
        url: `/storage/${fd.name}`,
      },
    });
  }

  // ── 6. Data Warehouse Facts (computed for current period)
  console.log('  📊 5 warehouse facts...');
  const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const factsData = [
    { factName: 'fact_tasks', measures: { total: 50, byStatus: { NEW: 13, IN_PROGRESS: 13, PENDING_APPROVAL: 12, DONE: 12 } } },
    { factName: 'fact_attendance', measures: { total: 501, byStatus: { PRESENT: 442, ABSENT: 18, LATE: 32, EXCUSED: 9 } } },
    { factName: 'fact_finance', measures: { totalSpent: 480000, totalAllocated: 1200000, utilization: 40 } },
    { factName: 'fact_quality', measures: { kpiCount: 5, measurements: 30, avgAchievement: 87 } },
    { factName: 'fact_reports', measures: { dgReports: 3, quarterlyReports: 8, annualReports: 1 } },
  ];
  for (const fd of factsData) {
    const exists = await prisma.dataWarehouseFact.findFirst({
      where: { tenantId, factName: fd.factName, period },
    });
    if (exists) continue;
    await prisma.dataWarehouseFact.create({
      data: {
        tenantId, factName: fd.factName, period,
        dimensions: {} as any,
        measures: fd.measures as any,
      },
    });
  }

  // ── 7. Data Processing Jobs (7 وظائف)
  console.log('  ⚙️ 7 data processing jobs...');
  const jobsData = [
    { nameAr: 'تجميع KPIs الشهرية', type: 'AGGREGATION', schedule: '0 0 1 * *', status: 'SUCCESS', rows: 5 },
    { nameAr: 'تحديث Data Warehouse', type: 'ETL', schedule: '0 2 * * *', status: 'SUCCESS', rows: 1245 },
    { nameAr: 'تنظيف بيانات الموظفين', type: 'CLEANING', schedule: 'manual', status: 'SUCCESS', rows: 73 },
    { nameAr: 'التحقق من سلامة الدرجات', type: 'VALIDATION', schedule: '0 4 * * 0', status: 'SUCCESS', rows: 312 },
    { nameAr: 'فهرسة AI للوثائق', type: 'AI_INDEXING', schedule: '0 3 * * *', status: 'RUNNING', rows: 0 },
    { nameAr: 'حساب مؤشرات الأداء', type: 'KPI_COMPUTE', schedule: '0 0 * * 1', status: 'SUCCESS', rows: 30 },
    { nameAr: 'تنظيف ملفات السجلات القديمة', type: 'CLEANING', schedule: '0 0 1 1 *', status: 'FAILED', rows: 0 },
  ];
  for (const jd of jobsData) {
    const exists = await prisma.dataProcessingJob.findFirst({ where: { tenantId, nameAr: jd.nameAr } });
    if (exists) continue;
    await prisma.dataProcessingJob.create({
      data: {
        tenantId,
        nameAr: jd.nameAr,
        type: jd.type as any,
        schedule: jd.schedule,
        lastStatus: jd.status as any,
        lastRunAt: jd.status === 'RUNNING' ? new Date() : new Date(today.getTime() - 86400000),
        rowsProcessed: jd.rows,
        lastError: jd.status === 'FAILED' ? 'فشل في الاتصال بالمصدر' : null,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
