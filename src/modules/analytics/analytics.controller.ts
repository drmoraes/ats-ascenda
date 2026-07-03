import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import {
  AnalyticsService,
  type DiversityReport,
} from './analytics.service';
import type { ChannelRoi, SlaMetrics } from './domain/metrics';

/**
 * Dashboards de People Analytics. Métricas gerais para recrutador/gestor;
 * diversidade (dado sensível, mesmo agregado) restrita a TENANT_ADMIN.
 */
@Controller('analytics')
export class AnalyticsController {
  public constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @Roles('RECRUITER', 'HIRING_MANAGER', 'TENANT_ADMIN')
  public overview(): Promise<{
    tenantId: string;
    sla: SlaMetrics;
    channelRoi: readonly ChannelRoi[];
  }> {
    return this.analytics.overview();
  }

  @Get('sla')
  @Roles('RECRUITER', 'HIRING_MANAGER', 'TENANT_ADMIN')
  public sla(): Promise<SlaMetrics> {
    return this.analytics.sla();
  }

  @Get('channel-roi')
  @Roles('RECRUITER', 'HIRING_MANAGER', 'TENANT_ADMIN')
  public channelRoi(): Promise<readonly ChannelRoi[]> {
    return this.analytics.channelRoi();
  }

  @Get('diversity')
  @Roles('TENANT_ADMIN')
  public diversity(): Promise<DiversityReport> {
    return this.analytics.diversity();
  }
}
