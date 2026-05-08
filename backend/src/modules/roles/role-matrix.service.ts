import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class RoleMatrixService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  /**
   * يُرجع matrix كاملة:
   * - rows: جميع الأدوار
   * - cols: جميع الـ permissions مجموعة حسب module
   * - cells: ✓ إن كان الدور يملك الصلاحية
   * + counts لكل دور (عدد المستخدمين)
   */
  async matrix() {
    const tenantId = this.tenancy.getTenantId();
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        where: { tenantId },
        include: {
          rolePermissions: { select: { permissionId: true } },
          _count: { select: { userRoles: true } },
        },
        orderBy: { code: 'asc' },
      }),
      this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] }),
    ]);

    // group permissions by module
    const permsByModule: Record<string, typeof permissions> = {};
    for (const p of permissions) {
      if (!permsByModule[p.module]) permsByModule[p.module] = [];
      permsByModule[p.module].push(p);
    }

    // build matrix
    const matrix = roles.map((r) => {
      const permIds = new Set(r.rolePermissions.map((rp) => rp.permissionId));
      return {
        code: r.code,
        nameAr: r.nameAr,
        scope: r.scope,
        userCount: r._count.userRoles,
        permissionCount: r.rolePermissions.length,
        hasPermission: (pid: string) => permIds.has(pid),
        permissionIds: Array.from(permIds),
      };
    });

    return {
      modules: Object.keys(permsByModule).sort(),
      permissionsByModule: permsByModule,
      roles: matrix.map((m) => ({
        code: m.code,
        nameAr: m.nameAr,
        scope: m.scope,
        userCount: m.userCount,
        permissionCount: m.permissionCount,
        permissionIds: m.permissionIds,
      })),
      totals: {
        roles: roles.length,
        permissions: permissions.length,
        modules: Object.keys(permsByModule).length,
      },
    };
  }

  /**
   * تجربة وصول لمستخدم محدد:
   * يعطي قائمة الصلاحيات المخوّل بها + الـ routes/screens المسموح بها.
   */
  async accessTest(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
        employeeProfile: { include: { department: true, assignments: { include: { position: true } } } },
        traineeProfile: true,
        trainerProfile: true,
      },
    });
    if (!user) return null;

    const permissions = new Set<string>();
    const roles: { code: string; nameAr: string }[] = [];
    for (const ur of user.userRoles) {
      roles.push({ code: ur.role.code, nameAr: ur.role.nameAr });
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    // Screens الصفحات الموجودة في النظام مع الصلاحيات المطلوبة
    const SCREENS = [
      { path: '/dashboard', label: 'الرئيسية', perms: [], scope: 'public' },
      { path: '/dashboard/inbox', label: 'صندوق الاعتمادات', perms: [], scope: 'public' },
      { path: '/dashboard/notifications', label: 'الإشعارات', perms: [], scope: 'public' },
      { path: '/dashboard/me/leaves', label: 'إجازاتي', perms: [], scope: 'public' },
      { path: '/dashboard/me/tickets', label: 'تذاكري', perms: [], scope: 'public' },
      { path: '/dashboard/me/visits', label: 'تقييماتي (مدرب)', perms: [], scope: 'trainer' },
      { path: '/dashboard/me/today', label: 'يومي (مدرب)', perms: [], scope: 'trainer' },
      { path: '/dashboard/me/sections', label: 'شعبي', perms: [], scope: 'trainer' },
      { path: '/dashboard/org', label: 'الهيكل التنظيمي', perms: [], scope: 'public' },
      { path: '/dashboard/council', label: 'المجلس', perms: [], scope: 'public' },
      { path: '/dashboard/academic', label: 'البرامج والمقررات', perms: [], scope: 'public' },
      { path: '/dashboard/community', label: 'خدمة المجتمع', perms: [], scope: 'public' },
      { path: '/dashboard/research', label: 'البحث', perms: [], scope: 'public' },
      { path: '/dashboard/users', label: 'المستخدمون', perms: ['users.read'] },
      { path: '/dashboard/hr/employees', label: 'إدارة الموظفين', perms: ['hr.employee.read'] },
      { path: '/dashboard/hr/leaves', label: 'إدارة الإجازات', perms: ['hr.leave.read'] },
      { path: '/dashboard/finance', label: 'الشؤون المالية', perms: ['finance.purchase.read', 'finance.budget.read'] },
      { path: '/dashboard/trainees', label: 'شؤون المتدربين', perms: ['trainees.read'] },
      { path: '/dashboard/trainers', label: 'شؤون المدربين', perms: ['trainers.read'] },
      { path: '/dashboard/training-plans', label: 'الخطط التشغيلية', perms: ['dept.training_plan.create'] },
      { path: '/dashboard/supervision', label: 'الزيارات الإشرافية', perms: ['dept.supervision_visit.log', 'trainers.read'] },
      { path: '/dashboard/curriculum', label: 'تقييم الحقائب', perms: ['dept.curriculum_review.create', 'trainer.curriculum.feedback'] },
      { path: '/dashboard/quality', label: 'KPIs والاستبيانات', perms: ['quality.kpi.update', 'quality.kpi.measure'] },
      { path: '/dashboard/quality/dashboard', label: 'لوحة الجودة', perms: ['quality.kpi.measure'] },
      { path: '/dashboard/quality/plans', label: 'خطط الجودة', perms: ['quality.plan.create_yearly'] },
      { path: '/dashboard/quality/teams', label: 'فرق الجودة', perms: ['quality.team.charter'] },
      { path: '/dashboard/quality/accreditation', label: 'الاعتماد', perms: ['quality.accreditation.manage', 'quality.evidence.upload'] },
      { path: '/dashboard/quality/improvement', label: 'خطط التحسين', perms: ['quality.improvement_plan.execute'] },
      { path: '/dashboard/quality/outcomes', label: 'نواتج التدريب', perms: ['quality.training_outcomes.measure'] },
      { path: '/dashboard/quality/nominations', label: 'الترشيحات', perms: ['quality.nomination.recommend'] },
      { path: '/dashboard/quality/dg-reports', label: 'تقارير الإدارة', perms: ['quality.report.dg_submit'] },
      { path: '/dashboard/it', label: 'إدارة Helpdesk', perms: ['it.ticket.assign', 'it.ticket.resolve'] },
      { path: '/dashboard/services', label: 'الخدمات العامة', perms: ['services.security.read', 'services.medical.read'] },
      { path: '/dashboard/reports', label: 'التقارير', perms: ['dept.report.quarterly_submit', 'quality.kpi.measure', 'trainees.read'] },
      // مساحات متخصصة
      { path: '/dashboard/me/council-sec', label: 'مساحة أمين المجلس', perms: ['council.minutes.draft'] },
      { path: '/dashboard/me/warehouse', label: 'مساحة أمين المستودع', perms: ['warehouse.inventory'] },
      { path: '/dashboard/me/treasury', label: 'مساحة أمين الصندوق', perms: ['treasury.reconcile'] },
      { path: '/dashboard/me/clinic', label: 'مساحة الطبيب', perms: ['clinic.examine'] },
      { path: '/dashboard/me/monitoring', label: 'مساحة المراقب', perms: ['monitoring.tour'] },
      // أدمن
      { path: '/dashboard/admin/role-matrix', label: 'مصفوفة RACI', perms: ['users.read'] },
      { path: '/dashboard/admin/access-test', label: 'اختبار الوصول', perms: ['users.read'] },
      { path: '/dashboard/admin/audit', label: 'سجل العمليات', perms: ['users.read'] },
      // الأنظمة المركزية الجديدة
      { path: '/dashboard/tasks', label: 'نظام المهام', perms: [], scope: 'public' },
      { path: '/dashboard/projects', label: 'نظام المشاريع', perms: ['projects.read', 'projects.create'] },
      { path: '/dashboard/boards', label: 'لوحات Kanban', perms: ['boards.create', 'boards.manage_cards'] },
      { path: '/dashboard/ai-center', label: 'مركز الذكاء الاصطناعي', perms: ['ai.use', 'ai.summarize'] },
      { path: '/dashboard/chatbot', label: 'الدردشة الذكية', perms: ['chatbot.use'] },
      { path: '/dashboard/data-lake', label: 'Data Lake', perms: ['data_lake.read'] },
      { path: '/dashboard/data-warehouse', label: 'Data Warehouse', perms: ['data_warehouse.read'] },
      { path: '/dashboard/data-processing', label: 'Data Processing', perms: ['data_processing.manage'] },
    ];

    const isSuperAdmin = roles.some((r) => r.code === 'SUPER_ADMIN');

    const accessibleScreens = SCREENS.map((s) => {
      const allowed =
        s.perms.length === 0 ||
        isSuperAdmin ||
        s.perms.some((p) => permissions.has(p)) ||
        (s.scope === 'trainer' && !!user.trainerProfile);
      return {
        path: s.path,
        label: s.label,
        allowed,
        reason: !allowed
          ? `يحتاج إحدى: ${s.perms.join(', ')}`
          : isSuperAdmin
            ? 'SUPER_ADMIN'
            : s.perms.length === 0
              ? 'متاح للجميع'
              : `لديك: ${s.perms.filter((p) => permissions.has(p)).join(', ')}`,
      };
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullNameAr: user.fullNameAr,
        status: user.status,
      },
      roles,
      profile: {
        isEmployee: !!user.employeeProfile,
        isTrainer: !!user.trainerProfile,
        isTrainee: !!user.traineeProfile,
        department: user.employeeProfile?.department?.nameAr,
        positions: user.employeeProfile?.assignments?.map((a) => a.position.titleAr) ?? [],
      },
      permissions: {
        count: permissions.size,
        list: Array.from(permissions).sort(),
      },
      screens: {
        total: SCREENS.length,
        accessibleCount: accessibleScreens.filter((s) => s.allowed).length,
        list: accessibleScreens,
      },
    };
  }
}
