import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { AdminAuthService, type AdminSessionUser } from '../modules/admin/services/admin-auth.service';
import {
  AdminContentService,
  type UpsertCloudProductInput,
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
import { NotionCrewTeamWriteService } from '../modules/admin/services/notion-crew-team-write.service';

interface AdminAiBackendConfig {
  baseUrl?: string;
  apiKey?: string;
  model: string;
}

interface AdminRouteDeps {
  adminAuthService?: AdminAuthService;
  adminContentService?: AdminContentService;
  notionContentSyncService?: NotionContentSyncService;
  notionCrewTeamWriteService?: NotionCrewTeamWriteService;
  aiBackend?: AdminAiBackendConfig;
}

interface AdminLoginBody {
  email?: string;
  password?: string;
}

type IdParams = { id: string };
type AuthenticatedAdminRequest = FastifyRequest & {
  adminUser?: AdminSessionUser;
};
type BlogPublishState = {
  draft: string | null;
  isPublished: boolean;
  isVisible: boolean;
  publishedAt: string | null;
};

const DEFAULT_BLOG_PROMPT =
  'Aolda 프로젝트 기록을 바탕으로 외부 공개용 블로그 초안을 작성하세요. 독자가 맥락을 쉽게 이해하도록 문제, 접근, 결과, 배운 점을 명확히 정리하세요.';
let blogPrompt = DEFAULT_BLOG_PROMPT;
const blogPublishStates = new Map<string, BlogPublishState>();

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
    '/admin/activity-terms',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 활동기수 목록 조회' } as any,
    },
    async (_request, reply) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      return { data: await contentService.listActivityTerms() };
    },
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
    ) => {
      const items = request.body.items ?? [];
      return safeAdminWrite(reply, async () => {
        const overrides = await deps.adminContentService!.replaceCrewTermTeams(request.params.id, items);
        if (!deps.notionCrewTeamWriteService) {
          return {
            overrides,
            notionWriteResults: [],
            warning: 'Notion crew team write-back is not configured',
          };
        }

        const notionWriteResults = await deps.notionCrewTeamWriteService.writeCrewTermTeams(
          request.params.id,
          items,
        );

        return { overrides, notionWriteResults };
      });
    },
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

  app.get(
    '/admin/blogs/ai-config',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '블로깅 AI 설정 조회' } as any,
    },
    async () => ({
      data: {
        defaultPrompt: blogPrompt,
        model: deps.aiBackend?.model ?? 'mock',
        isConfigured: Boolean(deps.aiBackend?.baseUrl && deps.aiBackend?.apiKey),
      },
    }),
  );

  app.put(
    '/admin/blogs/ai-config',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '블로깅 AI 기본 프롬프트 수정' } as any,
    },
    async (request: FastifyRequest<{ Body: { defaultPrompt?: string } }>, reply) => {
      const nextPrompt = request.body.defaultPrompt?.trim();
      if (!nextPrompt) {
        return reply.code(400).send({ message: 'defaultPrompt is required' });
      }
      blogPrompt = nextPrompt;
      return { data: { defaultPrompt: blogPrompt } };
    },
  );

  app.get(
    '/admin/blogs/:id/publish-state',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '블로깅 공개게시 상태 조회' } as any,
    },
    async (request) => {
      const { id } = request.params as IdParams;
      return { data: getBlogPublishState(id) };
    },
  );

  app.post(
    '/admin/blogs/:id/draft',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '블로깅 공개 초안 생성' } as any,
    },
    async (
      request: FastifyRequest<{ Params: IdParams; Body: { customPrompt?: string } }>,
      reply,
    ) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      const blog = (await contentService.listBlogs()).find((item) => item.id === request.params.id);
      if (!blog) {
        return reply.code(404).send({ message: 'Blog source not found' });
      }

      const draft = await generateBlogDraft(deps.aiBackend, {
        title: blog.title,
        projectName: blog.projectName,
        url: blog.url,
        recordedAt: blog.recordedAt?.toISOString() ?? null,
        body: blog.contentPreview,
        defaultPrompt: blogPrompt,
        customPrompt: request.body.customPrompt?.trim() ?? '',
      });
      const state = getBlogPublishState(request.params.id);
      state.draft = draft;
      blogPublishStates.set(request.params.id, state);
      return { data: state };
    },
  );

  app.post(
    '/admin/blogs/:id/publish',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '블로깅 공개게시 목업 생성' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams; Body: { draft?: string } }>, reply) => {
      const state = getBlogPublishState(request.params.id);
      const draft = request.body.draft?.trim() || state.draft;
      if (!draft) {
        return reply.code(400).send({ message: 'draft is required before publishing' });
      }
      state.draft = draft;
      state.isPublished = true;
      state.isVisible = true;
      state.publishedAt = new Date().toISOString();
      blogPublishStates.set(request.params.id, state);
      return { data: state, mocked: true };
    },
  );

  app.patch(
    '/admin/blogs/:id/publish-state',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '블로깅 공개 표시 목업 변경' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams; Body: { isVisible?: boolean } }>, reply) => {
      const state = getBlogPublishState(request.params.id);
      if (!state.isPublished) {
        return reply.code(400).send({ message: 'Blog is not published yet' });
      }
      state.isVisible = Boolean(request.body.isVisible);
      blogPublishStates.set(request.params.id, state);
      return { data: state, mocked: true };
    },
  );

  app.get(
    '/admin/cloud-products',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 클라우드 제품 목록 조회' } as any,
    },
    async (_request, reply) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      return { data: await contentService.listCloudProducts() };
    },
  );

  app.get(
    '/admin/cloud-products/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 클라우드 제품 상세 조회' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams }>, reply) => {
      const contentService = getContentService(deps, reply);
      if (!contentService) return undefined;
      const product = await contentService.getCloudProduct(request.params.id);
      return product
        ? { data: product }
        : reply.code(404).send({ message: 'Cloud product not found' });
    },
  );

  app.post(
    '/admin/cloud-products',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 클라우드 제품 등록' } as any,
    },
    async (request: FastifyRequest<{ Body: UpsertCloudProductInput }>, reply) =>
      safeAdminWrite(reply, () => deps.adminContentService!.createCloudProduct(request.body)),
  );

  app.put(
    '/admin/cloud-products/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 클라우드 제품 수정' } as any,
    },
    async (
      request: FastifyRequest<{ Params: IdParams; Body: UpsertCloudProductInput }>,
      reply,
    ) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.updateCloudProduct(request.params.id, request.body),
      ),
  );

  app.patch(
    '/admin/cloud-products/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 클라우드 제품 공개 여부 수정' } as any,
    },
    async (
      request: FastifyRequest<{ Params: IdParams; Body: { isVisible?: boolean } }>,
      reply,
    ) =>
      safeAdminWrite(reply, () =>
        deps.adminContentService!.updateCloudProductVisibility(
          request.params.id,
          Boolean(request.body.isVisible),
        ),
      ),
  );

  app.delete(
    '/admin/cloud-products/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '관리자 클라우드 제품 삭제' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams }>, reply) =>
      safeAdminWrite(reply, () => deps.adminContentService!.deleteCloudProduct(request.params.id)),
  );

  app.get(
    '/admin/sync/notion/jobs/latest',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: '최근 Notion 수집 동기화 작업 조회' } as any,
    },
    async (_request, reply) => {
      if (!deps.notionContentSyncService) {
        return reply.code(503).send({ message: 'Notion content sync is not configured' });
      }

      const job = await deps.notionContentSyncService.getLatestSyncJob();
      return { job };
    },
  );

  app.get(
    '/admin/sync/notion/jobs/:id',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: 'Notion 수집 동기화 작업 조회' } as any,
    },
    async (request: FastifyRequest<{ Params: IdParams }>, reply) => {
      if (!deps.notionContentSyncService) {
        return reply.code(503).send({ message: 'Notion content sync is not configured' });
      }

      const job = await deps.notionContentSyncService.getSyncJob(request.params.id);
      return job ? { job } : reply.code(404).send({ message: 'Sync job not found' });
    },
  );

  app.post(
    '/admin/sync/notion',
    {
      preHandler: createAdminAuthPreHandler(deps),
      schema: { tags: ['admin'], summary: 'Notion 수집 데이터 수동 동기화' } as any,
    },
    async (request: AuthenticatedAdminRequest, reply) => {
      if (!deps.notionContentSyncService) {
        return reply.code(503).send({ message: 'Notion content sync is not configured' });
      }

      const job = await deps.notionContentSyncService.startSyncAll(request.adminUser?.id);
      return reply.code(202).send({ job });
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

function getBlogPublishState(blogId: string): BlogPublishState {
  return (
    blogPublishStates.get(blogId) ?? {
      draft: null,
      isPublished: false,
      isVisible: false,
      publishedAt: null,
    }
  );
}

async function generateBlogDraft(
  aiBackend: AdminAiBackendConfig | undefined,
  input: {
    title: string;
    projectName: string | null;
    url: string | null;
    recordedAt: string | null;
    body: string | null;
    defaultPrompt: string;
    customPrompt: string;
  },
): Promise<string> {
  const prompt = [
    input.defaultPrompt,
    input.customPrompt ? `추가 요청: ${input.customPrompt}` : '',
    `제목: ${input.title}`,
    `프로젝트: ${input.projectName ?? '프로젝트 미지정'}`,
    `원문 URL: ${input.url ?? '없음'}`,
    `기록일: ${input.recordedAt ?? '없음'}`,
    '',
    '블로깅 본문:',
    input.body ?? '본문 없음',
  ]
    .filter(Boolean)
    .join('\n');

  if (!aiBackend?.baseUrl || !aiBackend.apiKey) {
    return [
      `# ${input.title}`,
      '',
      '이 초안은 AI 백엔드 설정이 없어 목업으로 생성되었습니다.',
      '',
      `프로젝트: ${input.projectName ?? '프로젝트 미지정'}`,
      '',
      '## 배경',
      '프로젝트 기록을 외부 독자가 이해할 수 있도록 정리합니다.',
      '',
      '## 핵심 내용',
      '- 문제와 목표를 간결하게 설명합니다.',
      '- 접근 과정과 결과를 정리합니다.',
      '- 다음 액션과 배운 점을 남깁니다.',
    ].join('\n');
  }

  const endpoint = `${aiBackend.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${aiBackend.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: aiBackend.model,
      messages: [
        { role: 'system', content: 'You write polished Korean public blog drafts for Aolda.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI backend request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const draft = data.choices?.[0]?.message?.content?.trim();
  if (!draft) {
    throw new Error('AI backend returned an empty draft');
  }

  return draft;
}
