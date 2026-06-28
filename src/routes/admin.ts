import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { AdminAuthService, type AdminSessionUser } from '../modules/admin/services/admin-auth.service';
import {
  AdminContentService,
  type UpdateCrewAdminInput,
  type UpdateCrewBlogVisibilityInput,
  type UpdateCrewProjectVisibilityInput,
  type UpdateCrewTermTeamInput,
  type UpdateProjectAdminInput,
  type UpdateProjectFeaturedBlogInput,
  type UpdateProjectParticipantInput,
  type UpdateProjectPeriodInput,
} from '../modules/admin/services/admin-content.service';
import { NotionContentSyncService } from '../modules/admin/services/notion-content-sync.service';

interface AdminRouteDeps {
  adminAuthService?: AdminAuthService;
  adminContentService?: AdminContentService;
  notionContentSyncService?: NotionContentSyncService;
}

interface AdminLoginBody {
  email?: string;
  password?: string;
}

type IdParams = { id: string };
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
      schema: { tags: ['admin'], summary: '현재 관리자 세션 확인' } as any,
    },
    async (request: AuthenticatedAdminRequest) => ({ user: request.adminUser }),
  );

  app.get(
    '/admin/crews',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 크루 목록 조회' } as any,
    },
    async (_request, reply) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      return { data: await contentService.listCrews() };
    },
  );

  app.get(
    '/admin/crews/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 크루 상세 조회' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams }>, reply) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      const crew = await contentService.getCrew(request.params.id);
      return crew ? { data: crew } : reply.code(404).send({ message: 'Crew source not found' });
    },
  );

  app.patch(
    '/admin/crews/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 크루 공개 프로필 수정' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams; Body: UpdateCrewAdminInput }>, reply) =>
      safeAdminWrite(reply, () => deps.adminContentService!.updateCrew(request.params.id, request.body)),
  );

  app.put(
    '/admin/crews/:id/term-teams',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 크루 기수별 팀 설정 저장' } as any,
    },
    async (
      request: FastifyRequest<{ Params: IdParams; Body: { items?: UpdateCrewTermTeamInput[] } }>,
      reply,
    ) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.replaceCrewTermTeams(request.params.id, request.body.items ?? []),
      ),
  );

  app.put(
    '/admin/crews/:id/projects',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 크루 참여 프로젝트 공개 설정 저장' } as any,
    },
    async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: { projects?: UpdateCrewProjectVisibilityInput[] };
      }>,
      reply,
    ) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.replaceCrewProjectVisibilities(
          request.params.id,
          request.body.projects ?? [],
        ),
      ),
  );

  app.put(
    '/admin/crews/:id/blogs',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 크루 공개 블로깅 설정 저장' } as any,
    },
    async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: { blogs?: UpdateCrewBlogVisibilityInput[] };
      }>,
      reply,
    ) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.replaceCrewBlogVisibilities(request.params.id, request.body.blogs ?? []),
      ),
  );

  app.get(
    '/admin/projects',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 프로젝트 목록 조회' } as any,
    },
    async (_request, reply) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      return { data: await contentService.listProjects() };
    },
  );

  app.get(
    '/admin/projects/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 프로젝트 상세 조회' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams }>, reply) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      const project = await contentService.getProject(request.params.id);
      return project ? { data: project } : reply.code(404).send({ message: 'Project source not found' });
    },
  );

  app.patch(
    '/admin/projects/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 프로젝트 공개 프로필 수정' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams; Body: UpdateProjectAdminInput }>, reply) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.updateProject(request.params.id, request.body),
      ),
  );

  app.put(
    '/admin/projects/:id/periods',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 프로젝트 진행기간 설정 저장' } as any,
    },
    async (
      request: FastifyRequest<{ Params: IdParams; Body: { periods?: UpdateProjectPeriodInput[] } }>,
      reply,
    ) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.replaceProjectPeriods(request.params.id, request.body.periods ?? []),
      ),
  );

  app.put(
    '/admin/projects/:id/participants',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 프로젝트 참여자 설정 저장' } as any,
    },
    async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: { participants?: UpdateProjectParticipantInput[] };
      }>,
      reply,
    ) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.replaceProjectParticipants(
          request.params.id,
          request.body.participants ?? [],
        ),
      ),
  );

  app.put(
    '/admin/projects/:id/featured-blogs',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 프로젝트 대표 블로깅 설정 저장' } as any,
    },
    async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: { blogs?: UpdateProjectFeaturedBlogInput[] };
      }>,
      reply,
    ) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.replaceProjectFeaturedBlogs(request.params.id, request.body.blogs ?? []),
      ),
  );

  app.get(
    '/admin/blogs',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 블로깅 원천 목록 조회' } as any,
    },
    async (_request, reply) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      return { data: await contentService.listBlogs() };
    },
  );

  app.post(
    '/admin/sync/notion',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: 'Notion 수집 데이터 수동 동기화' } as any,
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

function getContentService(
  deps: AdminRouteDeps,
  reply: FastifyReply,
): AdminContentService | undefined {
  if (!deps.adminContentService) {
    reply.code(503).send({ message: 'Admin content service is not configured' });
    return undefined;
  }

  return deps.adminContentService;
}

async function safeAdminWrite<T>(reply: FastifyReply, run: () => Promise<T>): Promise<unknown> {
  try {
    return { data: await run() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin write failed';
    if (message.includes('not found')) {
      return reply.code(404).send({ message });
    }

    return reply.code(400).send({ message });
  }
}
