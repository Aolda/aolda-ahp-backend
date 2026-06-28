import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { AdminAuthService, type AdminSessionUser } from '../modules/admin/services/admin-auth.service';
import { NotionContentSyncService } from '../modules/admin/services/notion-content-sync.service';

interface AdminRouteDeps {
  adminAuthService?: AdminAuthService;
  notionContentSyncService?: NotionContentSyncService;
}

interface AdminLoginBody {
  email?: string;
  password?: string;
}

type AuthenticatedAdminRequest = FastifyRequest & {
  adminUser?: AdminSessionUser;
};

export async function registerAdminRoutes(app: FastifyInstance, deps: AdminRouteDeps): Promise<void> {
  app.post(
    '/admin/login',
    {
      schema: {
        tags: ['admin'],
        summary: '관리자 로그인',
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['email', 'password'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
      } as any,
    },
    async (request: FastifyRequest<{ Body: AdminLoginBody }>, reply) => {
      if (!deps.adminAuthService) {
        return reply.code(503).send({ message: 'Admin auth is not configured' });
      }

      const email = request.body.email?.trim();
      const password = request.body.password;
      if (!email || !password) {
        return reply.code(400).send({ message: 'email and password are required' });
      }

      const result = await deps.adminAuthService.login(email, password);
      if (!result) {
        return reply.code(401).send({ message: 'Invalid credentials' });
      }

      return result;
    },
  );

  app.get(
    '/admin/me',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: {
        tags: ['admin'],
        summary: '현재 관리자 세션 확인',
      } as any,
    },
    async (request: AuthenticatedAdminRequest) => ({
      user: request.adminUser,
    }),
  );

  app.post(
    '/admin/sync/notion',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: {
        tags: ['admin'],
        summary: 'Notion 수집 데이터 수동 동기화',
      } as any,
    },
    async (_request, reply) => {
      if (!deps.notionContentSyncService) {
        return reply.code(503).send({ message: 'Notion content sync is not configured' });
      }

      const summary = await deps.notionContentSyncService.syncAll();
      return { summary };
    },
  );
}

function createAdminAuthPreHandler(deps: AdminRouteDeps) {
  return async (request: AuthenticatedAdminRequest, reply: FastifyReply): Promise<void> => {
    if (!deps.adminAuthService) {
      reply.code(503).send({ message: 'Admin auth is not configured' });
      return;
    }

    const user = await deps.adminAuthService.authenticate(request.headers.authorization);
    if (!user) {
      reply.code(401).send({ message: 'Unauthorized' });
      return;
    }

    request.adminUser = user;
  };
}
