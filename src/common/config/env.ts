export const ALLOWED_ENV_KEYS = [
  'NODE_ENV',
  'USE_MOCK_DATA',
  'DATABASE_URL',
  'CORS_ALLOW_ORIGINS',
  'CORS_ALLOW_METHODS',
  'CORS_ALLOW_HEADERS',
  'CORS_ALLOW_CREDENTIALS',
] as const;

const DEFAULT_CORS_ALLOW_ORIGINS = [
  'http://example.com',
  'https://example.com',
  'http://localhost:3000',
  'http://localhost:8000',
];

function parseCsvEnv(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return parsed.length > 0 ? parsed : fallback;
}

function parseBoolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 't', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
}

export interface AppEnv {
  nodeEnv: string;
  useMockData: boolean;
  databaseUrl?: string;
  cors: {
    origins: string[];
    methods: string[];
    headers: string[];
    credentials: boolean;
  };
}

export function readAppEnv(): AppEnv {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    useMockData: parseBoolEnv(process.env.USE_MOCK_DATA, true),
    databaseUrl: process.env.DATABASE_URL,
    cors: {
      origins: parseCsvEnv(process.env.CORS_ALLOW_ORIGINS, DEFAULT_CORS_ALLOW_ORIGINS),
      methods: parseCsvEnv(process.env.CORS_ALLOW_METHODS, ['*']),
      headers: parseCsvEnv(process.env.CORS_ALLOW_HEADERS, ['*']),
      credentials: parseBoolEnv(process.env.CORS_ALLOW_CREDENTIALS, true),
    },
  };
}
