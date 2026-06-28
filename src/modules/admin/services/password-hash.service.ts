import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const HASH_ALGORITHM = 'sha256';
const HASH_ITERATIONS = 120_000;
const HASH_KEY_LENGTH = 32;
const HASH_PREFIX = 'pbkdf2';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    HASH_KEY_LENGTH,
    HASH_ALGORITHM,
  ).toString('hex');

  return [HASH_PREFIX, HASH_ALGORITHM, HASH_ITERATIONS, salt, digest].join('$');
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  const [prefix, algorithm, iterationsValue, salt, expectedDigest] = encodedHash.split('$');
  const iterations = Number(iterationsValue);

  if (
    prefix !== HASH_PREFIX ||
    algorithm !== HASH_ALGORITHM ||
    !Number.isInteger(iterations) ||
    !salt ||
    !expectedDigest
  ) {
    return false;
  }

  const actualDigest = pbkdf2Sync(
    password,
    salt,
    iterations,
    Buffer.from(expectedDigest, 'hex').length,
    algorithm,
  );
  const expected = Buffer.from(expectedDigest, 'hex');

  return expected.length === actualDigest.length && timingSafeEqual(expected, actualDigest);
}
