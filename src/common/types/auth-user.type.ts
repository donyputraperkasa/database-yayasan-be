import { Role } from '../enums/role.enum';

export type AuthUser = {
  sub: string;
  email: string;
  role: Role;
  schoolId?: string | null;
  sessionId?: string | null;
};
