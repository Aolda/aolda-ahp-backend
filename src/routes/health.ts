import { FastifyInstance } from 'fastify';

import { successSchema } from '../constants/schemas';

const HEALTH_EXAMPLE = {
  success: true,
  message: 'ok',
  data: null,
};

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Health Check',
        response: {
          200: successSchema(HEALTH_EXAMPLE),
        },
      } as any,
    },
    async () => HEALTH_EXAMPLE,
  );
}
