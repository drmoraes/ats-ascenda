import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/modules/auth/roles.guard';
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../src/common/errors/domain-error';

function makeContext(auth: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ auth }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

function makeReflector(required: string[] | undefined): Reflector {
  return {
    getAllAndOverride: () => required,
  } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('libera quando não há @Roles', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeContext(undefined))).toBe(true);
  });

  it('libera quando o principal possui um dos papéis exigidos', () => {
    const guard = new RolesGuard(makeReflector(['RECRUITER', 'TENANT_ADMIN']));
    const ctx = makeContext({ roles: ['RECRUITER'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('nega (403) quando o principal não tem o papel', () => {
    const guard = new RolesGuard(makeReflector(['TENANT_ADMIN']));
    const ctx = makeContext({ roles: ['CANDIDATE'] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenError);
  });

  it('rejeita (401) quando não há principal autenticado', () => {
    const guard = new RolesGuard(makeReflector(['RECRUITER']));
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      UnauthorizedError,
    );
  });
});
