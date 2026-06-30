import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../common/enums';
import { ROLES_KEY } from '../guards/auth.guard';

export const Public = () => SetMetadata('isPublic', true);
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
