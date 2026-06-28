import { createHmac, timingSafeEqual } from 'crypto';

import { type AdminUserReader, type AdminUserRecord } from '../datasources/admin-user.repository';
import { verifyPassword } from './password-hash.service';

const TOKEN_TTL_SECONDS = 60 * 60 * 12;

interface AdminTokenPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

export interface AdminSessionUser {
  id: string;
  email: string;
  role: string;
}

export class AdminAuthService {
  constructor(
    private readonly adminUserRepository: AdminUserReader,
    private readonly sessionSecret: string,
  ) {}

  async login(email: string, password: string): Promise<{ token: string; user: AdminSessionUser } | null> {
    const user = await this.adminUserRepository.findByEmail(email);
    if (!user?.isActive || !verifyPassword(password, user.passwordHash)) {
      return null;
    }

    await this.adminUserRepository.markLoginSucceeded(user.id);

    return {
      token: this.signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
      }),
      user: this.toSessionUser(user),
    };
  }

  async authenticate(authorizationHeader: string | undefined): Promise<AdminSessionUser | null> {
    const token = this.extractBearerToken(authorizationHeader);
    if (!token) {
      return null;
    }

    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }

    const user = await this.adminUserRepository.findById(payload.sub);
    if (!user?.isActive) {
      return null;
    }

    return this.toSessionUser(user);
  }

  private signToken(payload: AdminTokenPayload): string {
    const encodedPayload = this.encodeJson(payload);
    const signature = this.sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string): AdminTokenPayload | null {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature || !this.isValidSignature(encodedPayload, signature)) {
      return null;
    }

    const payload = this.decodeJson(encodedPayload);
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  }

  private sign(value: string): string {
    return createHmac('sha256', this.sessionSecret).update(value).digest('base64url');
  }

  private isValidSignature(value: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(value));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private encodeJson(payload: AdminTokenPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  private decodeJson(value: string): AdminTokenPayload | null {
    try {
      const payload = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as AdminTokenPayload;
      if (!payload.sub || !payload.email || !payload.role || typeof payload.exp !== 'number') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private extractBearerToken(authorizationHeader: string | undefined): string | null {
    const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
    return match?.[1] ?? null;
  }

  private toSessionUser(user: AdminUserRecord): AdminSessionUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
