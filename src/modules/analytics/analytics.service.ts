import { Injectable } from '@nestjs/common';
import { TenantContext } from '../../common/tenancy/tenant-context';
import { AnalyticsRepository } from './analytics.repository';
import {
  computeChannelRoi,
  computeDiversity,
  computeSlaMetrics,
  type ChannelRoi,
  type DiversityBucket,
  type SlaMetrics,
} from './domain/metrics';

export interface DiversityReport {
  readonly gender: readonly DiversityBucket[];
  readonly ethnicity: readonly DiversityBucket[];
}

/**
 * People Analytics. Combina linhas cruas do repositório com as funções puras
 * de agregação. A diversidade é sempre agregada e com supressão de células
 * pequenas — nunca expõe indivíduos.
 */
@Injectable()
export class AnalyticsService {
  public constructor(private readonly repository: AnalyticsRepository) {}

  public async sla(): Promise<SlaMetrics> {
    const rows = await this.repository.jobSlaRows();
    return computeSlaMetrics(rows, new Date());
  }

  public async channelRoi(): Promise<readonly ChannelRoi[]> {
    const rows = await this.repository.sourceOutcomeRows();
    return computeChannelRoi(rows);
  }

  public async diversity(): Promise<DiversityReport> {
    const [genderLabels, ethnicityLabels] = await Promise.all([
      this.repository.genderLabels(),
      this.repository.ethnicityLabels(),
    ]);
    return {
      gender: computeDiversity(genderLabels),
      ethnicity: computeDiversity(ethnicityLabels),
    };
  }

  public async overview(): Promise<{
    tenantId: string;
    sla: SlaMetrics;
    channelRoi: readonly ChannelRoi[];
  }> {
    const [sla, channelRoi] = await Promise.all([this.sla(), this.channelRoi()]);
    return { tenantId: TenantContext.getTenantId(), sla, channelRoi };
  }
}
