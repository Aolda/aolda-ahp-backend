import type { PrismaClient } from '@prisma/client';

export interface DefaultAdminUserInput {
  email: string;
  passwordHash: string;
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
}
