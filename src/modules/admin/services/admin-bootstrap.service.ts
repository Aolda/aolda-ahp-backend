import type { FastifyBaseLogger } from 'fastify';

import { AdminUserRepository } from '../datasources/admin-user.repository';
import { hashPassword } from './password-hash.service';

export interface AdminBootstrapConfig {
  defaultEmail: string;
  defaultPassword: string;
}

export class AdminBootstrapService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly logger?: FastifyBaseLogger,
  ) {}

  async ensureDefaultAdmin(config: AdminBootstrapConfig): Promise<void> {
    let created = false;

    try {
      created = await this.adminUserRepository.ensureDefaultAdminUser({
        email: config.defaultEmail,
        passwordHash: hashPassword(config.defaultPassword),
      });
    } catch (error) {
      this.logger?.warn(
        { error },
        'Default admin user could not be ensured; run migrations and check database connectivity',
      );
      return;
    }

    if (created) {
      this.logger?.warn(
        { adminEmail: config.defaultEmail },
        'Default admin user was created; change the password after first login',
      );
    }
  }
}
