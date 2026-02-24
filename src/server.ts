import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { ALLOWED_ENV_KEYS, readAppEnv } from './common/config/env';
import { CloudMockRepository } from './modules/cloud/datasources/cloud-mock.repository';
import { CloudPrismaRepository } from './modules/cloud/datasources/cloud-prisma.repository';
import { CloudQueryService } from './modules/cloud/services/cloud-query.service';
import { InternalExampleMockRepository } from './modules/internal-example/datasources/internal-example-mock.repository';
import { InternalExamplePrismaRepository } from './modules/internal-example/datasources/internal-example-prisma.repository';
import { registerInternalExampleRoutes } from './modules/internal-example/routes/internal-example.route';
import { InternalExampleService } from './modules/internal-example/services/internal-example.service';
import { TeamMockRepository } from './modules/team/datasources/team-mock.repository';
import { TeamPrismaRepository } from './modules/team/datasources/team-prisma.repository';
import { TeamQueryService } from './modules/team/services/team-query.service';
import { registerCloudRoutes } from './routes/cloud';
import { registerHealthRoutes } from './routes/health';
import { registerTeamRoutes } from './routes/team';

const PROJECT_NAME = 'aolda-ahp-backend';
const VERSION = '0.1.0';
const DEFAULT_PORT = 8001;

function createTeamQueryService(useMockData: boolean): TeamQueryService {
  const repository = useMockData ? new TeamMockRepository() : new TeamPrismaRepository();
  return new TeamQueryService(repository);
}

function createCloudQueryService(useMockData: boolean): CloudQueryService {
  const repository = useMockData ? new CloudMockRepository() : new CloudPrismaRepository();
  return new CloudQueryService(repository);
}

function createInternalExampleService(useMockData: boolean): InternalExampleService {
  const repository = useMockData
    ? new InternalExampleMockRepository()
    : new InternalExamplePrismaRepository();

  return new InternalExampleService(repository);
}

export async function buildApp(): Promise<FastifyInstance> {
  const env = readAppEnv();
  const app = Fastify({ logger: true, disableRequestLogging: true });

  await app.register(cors, {
    origin: env.cors.origins.includes('*') ? true : env.cors.origins,
    methods: env.cors.methods,
    allowedHeaders: env.cors.headers,
    credentials: env.cors.credentials,
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

  const teamQueryService = createTeamQueryService(env.useMockData);
  const cloudQueryService = createCloudQueryService(env.useMockData);
  const internalExampleService = createInternalExampleService(env.useMockData);

  await registerHealthRoutes(app);
  await registerTeamRoutes(app, { teamQueryService });
  await registerCloudRoutes(app, { cloudQueryService });

  if (env.nodeEnv === 'development') {
    await registerInternalExampleRoutes(app, { internalExampleService });
  }

  app.get('/openapi.json', async () => app.swagger());

  app.addHook('onReady', async () => {
    app.log.info(`Allowed env keys: ${ALLOWED_ENV_KEYS.join(', ')}`);
    app.log.info(
      {
        NODE_ENV: env.nodeEnv,
        USE_MOCK_DATA: env.useMockData,
        DATABASE_URL: env.databaseUrl ? '<set>' : '<unset>',
        CORS_ALLOW_ORIGINS: env.cors.origins,
        CORS_ALLOW_METHODS: env.cors.methods,
        CORS_ALLOW_HEADERS: env.cors.headers,
        CORS_ALLOW_CREDENTIALS: env.cors.credentials,
      },
      'Applied env values',
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
