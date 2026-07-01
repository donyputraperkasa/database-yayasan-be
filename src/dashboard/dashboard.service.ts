import { ForbiddenException, Injectable } from '@nestjs/common';
import { SchoolLevel as PrismaSchoolLevel } from '.prisma/client';
import { EmployeeType, Role, Status } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthUser) {
    // Scope sekolah dibuat sekali lalu dipakai semua query summary agar role school tidak bocor data.
    const schoolWhere = this.getSchoolWhere(user);
    const scopedSchoolId = this.getScopedSchoolId(user);
    const schoolScopedWhere = scopedSchoolId
      ? { schoolId: scopedSchoolId }
      : {};

    // Query summary dijalankan paralel karena semua hitungan berdiri sendiri.
    const [
      totalSchools,
      totalStudents,
      totalEmployees,
      totalTeachers,
      totalStaff,
      totalPermanentEmployees,
      totalNonPermanentEmployees,
      totalHonoraryEmployees,
      totalAssets,
      totalFacilities,
      totalFinances,
      totalDocuments,
      schoolsByLevel,
      studentsBySchool,
      employeesBySchool,
    ] = await Promise.all([
      this.prisma.school.count({ where: schoolWhere }),
      this.prisma.student.count({ where: schoolScopedWhere }),
      this.prisma.employee.count({ where: schoolScopedWhere }),
      this.prisma.employee.count({
        where: { ...schoolScopedWhere, type: EmployeeType.GURU },
      }),
      this.prisma.employee.count({
        where: { ...schoolScopedWhere, type: EmployeeType.PEGAWAI },
      }),
      this.prisma.employee.count({
        where: { ...schoolScopedWhere, status: Status.TETAP },
      }),
      this.prisma.employee.count({
        where: { ...schoolScopedWhere, status: Status.TIDAK_TETAP },
      }),
      this.prisma.employee.count({
        where: { ...schoolScopedWhere, status: Status.HONORER },
      }),
      this.prisma.schoolAsset.count({ where: schoolScopedWhere }),
      this.prisma.facility.count({ where: schoolScopedWhere }),
      this.prisma.finance.count({ where: schoolScopedWhere }),
      this.prisma.document.count({ where: schoolScopedWhere }),
      this.prisma.school.groupBy({
        by: ['level'],
        where: schoolWhere,
        _count: { _all: true },
      }),
      this.prisma.student.groupBy({
        by: ['schoolId'],
        where: schoolScopedWhere,
        _count: { _all: true },
      }),
      this.prisma.employee.groupBy({
        by: ['schoolId'],
        where: schoolScopedWhere,
        _count: { _all: true },
      }),
    ]);

    return {
      totals: {
        schools: totalSchools,
        students: totalStudents,
        employees: totalEmployees,
        teachers: totalTeachers,
        staff: totalStaff,
        permanentEmployees: totalPermanentEmployees,
        nonPermanentEmployees: totalNonPermanentEmployees,
        honoraryEmployees: totalHonoraryEmployees,
        assets: totalAssets,
        facilities: totalFacilities,
        finances: totalFinances,
        documents: totalDocuments,
      },
      schoolsByLevel: this.mapSchoolsByLevel(schoolsByLevel),
      studentsBySchool,
      employeesBySchool,
    };
  }

  private getScopedSchoolId(user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return undefined;
    }

    if (!user.schoolId) {
      throw new ForbiddenException('User school belum terhubung ke sekolah');
    }

    return user.schoolId;
  }

  private getSchoolWhere(user: AuthUser) {
    const schoolId = this.getScopedSchoolId(user);

    return schoolId ? { id: schoolId } : {};
  }

  private mapSchoolsByLevel(
    rows: Array<{ level: PrismaSchoolLevel; _count: { _all: number } }>,
  ) {
    // Response dashboard dibuat stabil meskipun salah satu level sekolah belum punya data.
    return {
      tkKb:
        rows.find((row) => row.level === PrismaSchoolLevel.tk_kb)?._count
          ._all ?? 0,
      sd:
        rows.find((row) => row.level === PrismaSchoolLevel.sd)?._count._all ??
        0,
      smp:
        rows.find((row) => row.level === PrismaSchoolLevel.smp)?._count._all ??
        0,
      smaSmk:
        rows.find((row) => row.level === PrismaSchoolLevel.sma_smk)?._count
          ._all ?? 0,
    };
  }
}
