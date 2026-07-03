import type { Queue } from 'bullmq';
import { ResumesService } from '../../src/modules/candidates/resumes.service';
import { ResumeStorageService } from '../../src/modules/candidates/resume-storage.service';
import { ResumesRepository } from '../../src/modules/candidates/resumes.repository';
import type { ResumeParsingJobData } from '../../src/modules/candidates/resume-parsing.queue';
import { TenantContext } from '../../src/common/tenancy/tenant-context';
import { ForbiddenError } from '../../src/common/errors/domain-error';
import type { SubjectType } from '../../src/common/tenancy/authenticated-request';

const PDF = 'application/pdf';

function buildService(): {
  service: ResumesService;
  repo: jest.Mocked<Pick<ResumesRepository, 'create'>>;
} {
  const repo = { create: jest.fn() } as unknown as jest.Mocked<
    Pick<ResumesRepository, 'create'>
  >;
  const storage = {
    buildStorageKey: jest.fn().mockReturnValue('tenants/t/candidates/c/resumes/r'),
    createPresignedUpload: jest.fn().mockResolvedValue({
      storageKey: 'k',
      uploadUrl: 'https://s3/put',
      expiresInSeconds: 300,
    }),
  } as unknown as ResumeStorageService;
  const queue = { add: jest.fn() } as unknown as Queue<ResumeParsingJobData>;

  const service = new ResumesService(
    storage,
    repo as unknown as ResumesRepository,
    queue,
  );
  return { service, repo };
}

function runAs<T>(
  subjectType: SubjectType | null,
  actorId: string | null,
  fn: () => Promise<T>,
): Promise<T> {
  return TenantContext.run(
    { tenantId: 'tenant-1', actorId, subjectType, roles: [] },
    fn,
  );
}

describe('ResumesService — ownership do candidato', () => {
  it('bloqueia candidato que tenta enviar currículo de outro candidato', async () => {
    const { service, repo } = buildService();
    await expect(
      runAs('CANDIDATE', 'candidato-A', () =>
        service.requestUpload('candidato-B', PDF),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('permite candidato operar sobre o próprio cadastro', async () => {
    const { service, repo } = buildService();
    repo.create.mockResolvedValue({
      id: 'resume-1',
      candidateId: 'candidato-A',
      storageKey: 'k',
      mimeType: PDF,
      parseStatus: 'PENDING' as never,
    });
    const ticket = await runAs('CANDIDATE', 'candidato-A', () =>
      service.requestUpload('candidato-A', PDF),
    );
    expect(ticket.resumeId).toBe('resume-1');
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('permite usuário interno (recrutador) operar sobre qualquer candidato do tenant', async () => {
    const { service, repo } = buildService();
    repo.create.mockResolvedValue({
      id: 'resume-2',
      candidateId: 'candidato-B',
      storageKey: 'k',
      mimeType: PDF,
      parseStatus: 'PENDING' as never,
    });
    const ticket = await runAs('USER', 'recrutador-1', () =>
      service.requestUpload('candidato-B', PDF),
    );
    expect(ticket.resumeId).toBe('resume-2');
  });
});
