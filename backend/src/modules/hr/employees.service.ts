import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  async list(query: { search?: string; departmentId?: string; status?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.employee.findMany({
      where: {
        tenantId,
        departmentId: query.departmentId,
        status: query.status as any,
        OR: query.search
          ? [
              { fullNameAr: { contains: query.search, mode: 'insensitive' } },
              { employeeNumber: { contains: query.search } },
              { nationalId: { contains: query.search } },
            ]
          : undefined,
      },
      include: {
        department: { select: { nameAr: true, code: true } },
        user: { select: { email: true, status: true } },
      },
      orderBy: { fullNameAr: 'asc' },
      take: 200,
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const emp = await this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        contracts: { orderBy: { startDate: 'desc' } },
        leaves: { orderBy: { createdAt: 'desc' }, take: 20 },
        evaluations: { orderBy: { createdAt: 'desc' }, take: 5 },
        assignments: { include: { position: true, department: true } },
      },
    });
    if (!emp) throw new NotFoundException({ messageAr: 'الموظف غير موجود' });
    return emp;
  }

  async create(dto: CreateEmployeeDto) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.employee.create({
      data: {
        tenantId,
        employeeNumber: dto.employeeNumber,
        nationalId: dto.nationalId,
        fullNameAr: dto.fullNameAr,
        fullNameEn: dto.fullNameEn,
        gender: dto.gender as any,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        hireDate: new Date(dto.hireDate),
        contractType: dto.contractType as any,
        jobTitleAr: dto.jobTitleAr,
        departmentId: dto.departmentId,
        email: dto.email,
        phone: dto.phone,
        userId: dto.userId,
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const tenantId = this.tenancy.getTenantId();
    const emp = await this.prisma.employee.findFirst({ where: { id, tenantId } });
    if (!emp) throw new NotFoundException({ messageAr: 'الموظف غير موجود' });
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.nationalId !== undefined && { nationalId: dto.nationalId }),
        ...(dto.fullNameAr !== undefined && { fullNameAr: dto.fullNameAr }),
        ...(dto.fullNameEn !== undefined && { fullNameEn: dto.fullNameEn }),
        ...(dto.gender !== undefined && { gender: dto.gender as any }),
        ...(dto.birthDate !== undefined && { birthDate: new Date(dto.birthDate) }),
        ...(dto.hireDate !== undefined && { hireDate: new Date(dto.hireDate) }),
        ...(dto.contractType !== undefined && { contractType: dto.contractType as any }),
        ...(dto.jobTitleAr !== undefined && { jobTitleAr: dto.jobTitleAr }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.userId !== undefined && { userId: dto.userId }),
      },
    });
  }

  /**
   * دليل بسيط: id, employeeNumber, fullNameAr, departmentName.
   * متاح لكل المصادَق عليهم — يستخدم لاختيار "موظف" في النماذج.
   */
  directory() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        employeeNumber: true,
        fullNameAr: true,
        department: { select: { nameAr: true } },
      },
      orderBy: { fullNameAr: 'asc' },
    });
  }
}
