// Mock do @prisma/client (client não gerado no ambiente de teste unitário).
// Inclui PrismaClient para que `PrismaService extends PrismaClient` carregue.
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
}));

import { JobsService } from '../../src/modules/jobs/jobs.service';
import type { JobsRepository, JobRecord } from '../../src/modules/jobs/jobs.repository';
import { ValidationError } from '../../src/common/errors/domain-error';

function makeJob(status: string): JobRecord {
  return {
    id: 'job-1',
    title: 'Dev',
    status: status as JobRecord['status'],
    department: null,
    location: null,
    openedAt: null,
    closedAt: null,
  };
}

function buildService(job: JobRecord): {
  service: JobsService;
  repo: jest.Mocked<Pick<JobsRepository, 'getByIdOrThrow' | 'setStatus'>>;
} {
  const repo = {
    getByIdOrThrow: jest.fn().mockResolvedValue(job),
    setStatus: jest.fn().mockImplementation((_id, status) =>
      Promise.resolve({ ...job, status }),
    ),
  } as unknown as jest.Mocked<
    Pick<JobsRepository, 'getByIdOrThrow' | 'setStatus'>
  >;
  const service = new JobsService(repo as unknown as JobsRepository);
  return { service, repo };
}

describe('JobsService — transições de status', () => {
  it('abre uma vaga em DRAFT e marca openedAt (SLA)', async () => {
    const { service, repo } = buildService(makeJob('DRAFT'));
    const result = await service.open('job-1');
    expect(result.status).toBe('OPEN');
    const call = repo.setStatus.mock.calls[0];
    expect(call[1]).toBe('OPEN');
    expect(call[2].openedAt).toBeInstanceOf(Date);
  });

  it('bloqueia abrir uma vaga já CLOSED', async () => {
    const { service } = buildService(makeJob('CLOSED'));
    await expect(service.open('job-1')).rejects.toBeInstanceOf(ValidationError);
  });

  it('fecha uma vaga OPEN', async () => {
    const { service, repo } = buildService(makeJob('OPEN'));
    const result = await service.close('job-1');
    expect(result.status).toBe('CLOSED');
    expect(repo.setStatus.mock.calls[0][2].closedAt).toBeInstanceOf(Date);
  });

  it('bloqueia fechar uma vaga em DRAFT', async () => {
    const { service } = buildService(makeJob('DRAFT'));
    await expect(service.close('job-1')).rejects.toBeInstanceOf(ValidationError);
  });
});
