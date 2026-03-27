import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES } from '../common/constants';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: { email: 'asc' },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getCoordinators() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [ROLES.RECEPTION_COORDINATOR, ROLES.DELIVERY_COORDINATOR, ROLES.DISTRIBUTION_COORDINATOR] },
      },
    });
  }

  async getCoordinatorsByRole(role: string) {
    return this.prisma.user.findMany({
      where: { isActive: true, role },
    });
  }

  async updateUserRole(id: string, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async deactivateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
