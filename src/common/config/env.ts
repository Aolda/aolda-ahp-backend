export const ALLOWED_ENV_KEYS = [
  'NODE_ENV',
  'USE_MOCK_DATA',
  'DATABASE_URL',
  'CORS_ALLOW_ORIGINS',
  'CORS_ALLOW_METHODS',
  'CORS_ALLOW_HEADERS',
  'CORS_ALLOW_CREDENTIALS',
  'NOTION_API_KEY',
  'NOTION_TEAM_DB_IDS',
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

function parseKVEnv(
  value: string | undefined,
  fallback: Record<string, string>,
): Record<string, string> {
  if (!value) return fallback;
  const result: Record<string, string> = {};
  for (const token of value.split(',')) {
    const colonIdx = token.trim().indexOf(':');
    if (colonIdx === -1) continue;
    const key = token.trim().slice(0, colonIdx).trim();
    const val = token.trim().slice(colonIdx + 1).trim();
    if (key && val) result[key] = val;
  }
  return Object.keys(result).length > 0 ? result : fallback;
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
  notion: {
    apiKey?: string;
    teamDbIds: {
      crew?: string;
      activity?: string;
      study?: string;
      project?: string;
      crewRoleLookup?: string;
      crewProfile?: string;
    };
  };
}

export function readAppEnv(): AppEnv {
  const rawTeamDbIds = parseKVEnv(process.env.NOTION_TEAM_DB_IDS, {});

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
    notion: {
      apiKey: process.env.NOTION_API_KEY,
      teamDbIds: {
        crew: rawTeamDbIds['crew'],
        activity: rawTeamDbIds['activity'],
        study: rawTeamDbIds['study'],
        project: rawTeamDbIds['project'],
        crewRoleLookup: rawTeamDbIds['crew_role_lookup'],
        crewProfile: rawTeamDbIds['crew_profile'],
      },
    },
  };
}
