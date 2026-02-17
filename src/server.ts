import Fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { registerCloudRoutes } from './routes/cloud';
import { registerHealthRoutes } from './routes/health';
import { registerTeamRoutes } from './routes/team';

const PROJECT_NAME = 'aolda-ahp-backend';
const VERSION = '0.1.0';
const DEFAULT_PORT = 8001;

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

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

  await registerHealthRoutes(app);
  await registerTeamRoutes(app);
  await registerCloudRoutes(app);

  app.get('/openapi.json', async () => app.swagger());

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
