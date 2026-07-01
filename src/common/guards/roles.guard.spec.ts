import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { AuthUser } from '../types/auth-user.type';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  const createContext = (user?: AuthUser): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({ user })),
      })),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('mengizinkan akses jika route tidak memiliki aturan role', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('mengizinkan user jika role sesuai', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER]);

    expect(
      guard.canActivate(
        createContext({
          sub: 'owner-1',
          email: 'owner@mail.com',
          role: Role.OWNER,
        }),
      ),
    ).toBe(true);
  });

  it('menolak user jika role tidak sesuai', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER]);

    expect(
      guard.canActivate(
        createContext({
          sub: 'school-1',
          email: 'school@mail.com',
          role: Role.SCHOOL,
          schoolId: 'school-1',
        }),
      ),
    ).toBe(false);
  });

  it('menolak akses jika route butuh role tetapi request belum punya user', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER]);

    expect(guard.canActivate(createContext())).toBe(false);
  });
});
