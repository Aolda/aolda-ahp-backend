import {
  type AdminUserReader,
  type AdminUserRecord,
} from '../modules/admin/datasources/admin-user.repository';
import { AdminAuthService } from '../modules/admin/services/admin-auth.service';
import { hashPassword, verifyPassword } from '../modules/admin/services/password-hash.service';

class InMemoryAdminUserRepository implements AdminUserReader {
  loginSucceededCount = 0;

  constructor(private readonly user: AdminUserRecord) {}

  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    return this.user.email === email ? this.user : null;
  }

  async findById(id: string): Promise<AdminUserRecord | null> {
    return this.user.id === id ? this.user : null;
  }

  async markLoginSucceeded(id: string): Promise<void> {
    if (id === this.user.id) {
      this.loginSucceededCount += 1;
    }
  }
}

async function main(): Promise<void> {
  const passwordHash = hashPassword('admin');
  assert(verifyPassword('admin', passwordHash), 'hashed password must verify');
  assert(!verifyPassword('wrong', passwordHash), 'wrong password must not verify');

  const baseUser: AdminUserRecord = {
    id: 'admin-user-id',
    email: 'admin',
    passwordHash,
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repository = new InMemoryAdminUserRepository(baseUser);
  const service = new AdminAuthService(repository, 'smoke-secret');

  const failedLogin = await service.login('admin', 'wrong');
  assert(failedLogin === null, 'invalid password must fail login');

  const loginResult = await service.login('admin', 'admin');
  assert(loginResult !== null, 'valid credentials must login');
  assert(repository.loginSucceededCount === 1, 'successful login must be recorded');

  const authenticated = await service.authenticate(`Bearer ${loginResult.token}`);
  assert(authenticated?.email === 'admin', 'valid token must authenticate');

  const tampered = await service.authenticate(`Bearer ${loginResult.token}x`);
  assert(tampered === null, 'tampered token must not authenticate');

  const disabledRepository = new InMemoryAdminUserRepository({ ...baseUser, isActive: false });
  const disabledService = new AdminAuthService(disabledRepository, 'smoke-secret');
  const disabledLogin = await disabledService.login('admin', 'admin');
  assert(disabledLogin === null, 'inactive admin must not login');

  // eslint-disable-next-line no-console
  console.log('admin-auth-smoke:ok');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
