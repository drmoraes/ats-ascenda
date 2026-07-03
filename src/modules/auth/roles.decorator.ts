import { SetMetadata } from '@nestjs/common';

export const ROLES_METADATA_KEY = 'ats_required_roles';

/**
 * Declara os papéis autorizados a acessar um handler/controller.
 * Ex.: @Roles('RECRUITER', 'TENANT_ADMIN')
 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_METADATA_KEY, roles);
