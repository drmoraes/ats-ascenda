import { AsyncLocalStorage } from 'node:async_hooks';
import { MissingTenantContextError } from '../errors/domain-error';
import type { SubjectType } from './authenticated-request';

interface TenantStore {
  readonly tenantId: string;
  /** subjectId do principal (userId ou candidateId); null em fluxos de sistema. */
  readonly actorId: string | null;
  readonly subjectType: SubjectType | null;
  readonly roles: readonly string[];
}

/**
 * Propaga o contexto do tenant/principal por toda a stack assíncrona da
 * requisição, sem passar tenantId manualmente entre camadas.
 * O PrismaService lê o tenantId daqui para aplicar `SET app.current_tenant`.
 */
const storage = new AsyncLocalStorage<TenantStore>();

export const TenantContext = {
  run<T>(store: TenantStore, fn: () => T): T {
    return storage.run(store, fn);
  },

  getTenantId(): string {
    const store = storage.getStore();
    if (!store) {
      throw new MissingTenantContextError();
    }
    return store.tenantId;
  },

  getActorId(): string | null {
    return storage.getStore()?.actorId ?? null;
  },

  getSubjectType(): SubjectType | null {
    return storage.getStore()?.subjectType ?? null;
  },

  getRoles(): readonly string[] {
    return storage.getStore()?.roles ?? [];
  },

  tryGetTenantId(): string | null {
    return storage.getStore()?.tenantId ?? null;
  },
};
