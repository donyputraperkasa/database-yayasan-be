import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

type AuditLogPayload = {
  action: string;
  description: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  schoolId?: string | null;
  user?: AuthUser;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: AuditLogPayload) {
    return this.prisma.auditLog.create({
      data: {
        action: payload.action,
        description: payload.description,
        entity: payload.entity,
        entityId: payload.entityId,
        metadata: payload.metadata,
        schoolId: payload.schoolId,
        userEmail: payload.user?.email,
        userId: payload.user?.sub,
        userRole: payload.user?.role,
      },
    });
  }

  findAll(user: AuthUser, query: AuditLogQueryDto) {
    const schoolId = this.resolveSchoolScope(user, query.schoolId);

    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: query.take ?? 50,
      where: {
        entity: query.entity,
        schoolId,
      },
    });
  }

  private resolveSchoolScope(user: AuthUser, requestedSchoolId?: string) {
    if (user.role === Role.SCHOOL) {
      if (!user.schoolId) {
        throw new ForbiddenException('User school belum terhubung ke sekolah');
      }

      return user.schoolId;
    }

    return requestedSchoolId;
  }
}
