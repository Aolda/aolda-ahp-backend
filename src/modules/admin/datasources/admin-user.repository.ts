import type { PrismaClient } from '@prisma/client';

export interface DefaultAdminUserInput {
  email: string;
  passwordHash: string;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async ensureDefaultAdminUser(input: DefaultAdminUserInput): Promise<boolean> {
    const existingAdminCount = await this.prisma.adminUser.count({
      where: {
        role: 'ADMIN',
      },
    });

    if (existingAdminCount > 0) {
      return false;
    }

    await this.prisma.adminUser.upsert({
      where: {
        email: input.email,
      },
      create: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
      update: {
        role: 'ADMIN',
        isActive: true,
      },
    });

    return true;
  }

  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    return this.prisma.adminUser.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id: string): Promise<AdminUserRecord | null> {
    return this.prisma.adminUser.findUnique({
      where: {
        id,
      },
    });
  }

  async markLoginSucceeded(id: string): Promise<void> {
    await this.prisma.adminUser.update({
      where: {
        id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}
