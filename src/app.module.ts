import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { TenancyModule } from './common/tenancy/tenancy.module';
import { TenantContextMiddleware } from './common/tenancy/tenant-context.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { AuthMiddleware } from './modules/auth/auth.middleware';
import { RolesGuard } from './modules/auth/roles.guard';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { MatchingModule } from './modules/matching/matching.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    PrismaModule,
    TenancyModule,
    AuthModule,
    NotificationsModule,
    HealthModule,
    CandidatesModule,
    JobsModule,
    ApplicationsModule,
    MatchingModule,
    AnalyticsModule,
  ],
  providers: [
    // RBAC global: só bloqueia handlers anotados com @Roles.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    // Autentica e estabelece o contexto de tenant em todas as rotas,
    // EXCETO as rotas públicas de carreira (que resolvem o tenant pelo slug).
    consumer
      .apply(AuthMiddleware, TenantContextMiddleware)
      .exclude(
        { path: 'public/(.*)', method: RequestMethod.ALL },
        { path: 'health/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
