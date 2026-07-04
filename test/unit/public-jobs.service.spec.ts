// Mock do @prisma/client (client não gerado no ambiente de teste unitário).
// Inclui PrismaClient para que `PrismaService extends PrismaClient` carregue,
// e os enums usados como valor no repositório de vagas.
jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Prisma: {},
  JobStatus: {
    DRAFT: 'DRAFT',
    OPEN: 'OPEN',
    ON_HOLD: 'ON_HOLD',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED',
  },
  EmploymentType: { CLT: 'CLT', PJ: 'PJ', ESTAGIO: 'ESTAGIO', TEMPORARIO: 'TEMPORARIO' },
  WorkModel: { PRESENCIAL: 'PRESENCIAL', HIBRIDO: 'HIBRIDO', REMOTO: 'REMOTO' },
}));

import { PublicJobsService } from '../../src/modules/jobs/public-jobs.service';
import type {
  JobsRepository,
  PublicJobView,
} from '../../src/modules/jobs/jobs.repository';
import type { TenantResolverService } from '../../src/common/tenancy/tenant-resolver.service';
import { TenantContext } from '../../src/common/tenancy/tenant-context';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

function makeView(id: string): PublicJobView {
  return {
    id,
    title: 'Pessoa Desenvolvedora',
    description: 'Descrição pública da vaga.',
    department: 'Engenharia',
    location: 'Rio de Janeiro',
    employmentType: 'CLT' as PublicJobView['employmentType'],
    workModel: 'REMOTO' as PublicJobView['workModel'],
    openedAt: new Date('2026-07-01T00:00:00Z'),
  };
}

function build(view: PublicJobView): {
  service: PublicJobsService;
  resolver: jest.Mocked<Pick<TenantResolverService, 'resolveActiveTenantIdBySlug'>>;
  repo: jest.Mocked<Pick<JobsRepository, 'listPublicOpen' | 'getPublicOpenByIdOrThrow'>>;
} {
  const resolver = {
    resolveActiveTenantIdBySlug: jest.fn().mockResolvedValue(TENANT_ID),
  } as unknown as jest.Mocked<
    Pick<TenantResolverService, 'resolveActiveTenantIdBySlug'>
  >;
  // O repositório verifica que roda dentro do contexto de tenant resolvido.
  const repo = {
    listPublicOpen: jest.fn().mockImplementation(() => {
      expect(TenantContext.getTenantId()).toBe(TENANT_ID);
      return Promise.resolve([view]);
    }),
    getPublicOpenByIdOrThrow: jest.fn().mockImplementation(() => {
      expect(TenantContext.getTenantId()).toBe(TENANT_ID);
      return Promise.resolve(view);
    }),
  } as unknown as jest.Mocked<
    Pick<JobsRepository, 'listPublicOpen' | 'getPublicOpenByIdOrThrow'>
  >;
  const service = new PublicJobsService(
    resolver as unknown as TenantResolverService,
    repo as unknown as JobsRepository,
  );
  return { service, resolver, repo };
}

describe('PublicJobsService — página de carreira', () => {
  it('resolve o tenant pelo slug e lista as vagas dentro do contexto', async () => {
    const view = makeView('job-1');
    const { service, resolver, repo } = build(view);

    const result = await service.listOpenByTenantSlug('empresa-demo');

    expect(resolver.resolveActiveTenantIdBySlug).toHaveBeenCalledWith(
      'empresa-demo',
    );
    expect(repo.listPublicOpen).toHaveBeenCalledTimes(1);
    expect(result).toEqual([view]);
  });

  it('não expõe contexto de tenant fora da execução da leitura', async () => {
    const { service } = build(makeView('job-1'));
    await service.listOpenByTenantSlug('empresa-demo');
    // Fora do TenantContext.run, não há tenant fixado.
    expect(TenantContext.tryGetTenantId()).toBeNull();
  });

  it('busca o detalhe da vaga por id dentro do contexto resolvido', async () => {
    const view = makeView('job-42');
    const { service, resolver, repo } = build(view);

    const result = await service.getOpenByTenantSlug('empresa-demo', 'job-42');

    expect(resolver.resolveActiveTenantIdBySlug).toHaveBeenCalledWith(
      'empresa-demo',
    );
    expect(repo.getPublicOpenByIdOrThrow).toHaveBeenCalledWith('job-42');
    expect(result).toBe(view);
  });
});
