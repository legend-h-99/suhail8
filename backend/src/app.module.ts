import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { AuditModule } from './audit/audit.module';
import { WorkflowModule } from './workflow/workflow.module';

import { OrgModule } from './modules/org/org.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { HrModule } from './modules/hr/hr.module';
import { CouncilModule } from './modules/council/council.module';
import { FinanceModule } from './modules/finance/finance.module';
import { TraineesModule } from './modules/trainees/trainees.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { AcademicModule } from './modules/academic/academic.module';
import { LmsModule } from './modules/lms/lms.module';
import { ItModule } from './modules/it/it.module';
import { QualityModule } from './modules/quality/quality.module';
import { CommunityModule } from './modules/community/community.module';
import { ResearchModule } from './modules/research/research.module';
import { GeneralServicesModule } from './modules/services-general/general-services.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SpecializedModule } from './modules/specialized/specialized.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AiModule } from './modules/ai/ai.module';
import { DataSystemsModule } from './modules/data-systems/data-systems.module';

import { TenantInterceptor } from './tenancy/tenant.interceptor';
import { AuditInterceptor } from './audit/audit.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        autoLogging: { ignore: (req) => req.url === '/health' },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    PrismaModule,
    TenancyModule,
    AuditModule,
    NotificationsModule,
    WorkflowModule,
    AuthModule,
    OrgModule,
    UsersModule,
    RolesModule,
    HrModule,
    CouncilModule,
    FinanceModule,
    TraineesModule,
    TrainersModule,
    AcademicModule,
    LmsModule,
    ItModule,
    QualityModule,
    CommunityModule,
    ResearchModule,
    GeneralServicesModule,
    SpecializedModule,
    TasksModule,
    ProjectsModule,
    AiModule,
    DataSystemsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
