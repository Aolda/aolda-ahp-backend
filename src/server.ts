import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { registerCloudRoutes } from './routes/cloud';
import { registerHealthRoutes } from './routes/health';
import { registerTeamRoutes } from './routes/team';

const PROJECT_NAME = 'aolda-ahp-backend';
const VERSION = '0.1.0';
const DEFAULT_PORT = 8001;

const DEFAULT_CORS_ALLOW_ORIGINS = [
  'http://example.com',
  'https://example.com',
  'http://localhost:3000',
  'http://localhost:8000',
];

function parseCsvEnv(name: string, fallback: string[]): string[] {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return parsed.length > 0 ? parsed : fallback;
}

function parseBoolEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 't', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
}

function readCorsConfig() {
  const origins = parseCsvEnv('CORS_ALLOW_ORIGINS', DEFAULT_CORS_ALLOW_ORIGINS);
  const methods = parseCsvEnv('CORS_ALLOW_METHODS', ['*']);
  const headers = parseCsvEnv('CORS_ALLOW_HEADERS', ['*']);
  const credentials = parseBoolEnv('CORS_ALLOW_CREDENTIALS', true);

  return {
    origins,
    methods,
    headers,
    credentials,
  };
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true, disableRequestLogging: true });
  const corsConfig = readCorsConfig();

  await app.register(cors, {
    origin: corsConfig.origins.includes('*') ? true : corsConfig.origins,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.headers,
    credentials: corsConfig.credentials,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: PROJECT_NAME,
        version: VERSION,
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.addHook('onRequest', async (request) => {
    app.log.info(`${request.ip} -> "${request.method} ${request.url}"`);
  });

  app.addHook('onResponse', async (request, reply) => {
    app.log.info(`${request.ip} <- "${request.method} ${request.url}" ${reply.statusCode}`);
  });

  await registerHealthRoutes(app);
  await registerTeamRoutes(app);
  await registerCloudRoutes(app);

  app.get('/openapi.json', async () => app.swagger());

  app.addHook('onReady', async () => {
    app.log.info(
      'Allowed CORS env keys: CORS_ALLOW_ORIGINS, CORS_ALLOW_METHODS, CORS_ALLOW_HEADERS, CORS_ALLOW_CREDENTIALS',
    );
    app.log.info(
      {
        CORS_ALLOW_ORIGINS: corsConfig.origins,
        CORS_ALLOW_METHODS: corsConfig.methods,
        CORS_ALLOW_HEADERS: corsConfig.headers,
        CORS_ALLOW_CREDENTIALS: corsConfig.credentials,
      },
      'Applied CORS env values',
    );
  });

  return app;
}

async function start(): Promise<void> {
  const app = await buildApp();
  await app.listen({
    host: '0.0.0.0',
    port: DEFAULT_PORT,
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
