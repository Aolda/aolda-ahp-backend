import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';

import { ALLOWED_ENV_KEYS, AppEnv, readAppEnv } from './common/config/env';
import { ContentSourceRepository } from './modules/admin/datasources/content-source.repository';
import { AdminUserRepository } from './modules/admin/datasources/admin-user.repository';
import { AdminAuthService } from './modules/admin/services/admin-auth.service';
import { AdminBootstrapService } from './modules/admin/services/admin-bootstrap.service';
import { AdminContentService } from './modules/admin/services/admin-content.service';
import { NotionContentSyncService } from './modules/admin/services/notion-content-sync.service';
import { NotionCrewTeamWriteService } from './modules/admin/services/notion-crew-team-write.service';
import { CloudMockRepository } from './modules/cloud/datasources/cloud-mock.repository';
import { CloudPrismaRepository } from './modules/cloud/datasources/cloud-prisma.repository';
import { CloudQueryService } from './modules/cloud/services/cloud-query.service';
import { InternalExampleMockRepository } from './modules/internal-example/datasources/internal-example-mock.repository';
import { InternalExamplePrismaRepository } from './modules/internal-example/datasources/internal-example-prisma.repository';
import { registerInternalExampleRoutes } from './modules/internal-example/routes/internal-example.route';
import { InternalExampleService } from './modules/internal-example/services/internal-example.service';
import { CrewProfileImageCacheRepository } from './modules/team/datasources/crew-profile-image-cache.repository';
import { ProfileImageFileStorage } from './modules/team/datasources/profile-image-file-storage';
import { TeamActivityMetadataRepository } from './modules/team/datasources/team-activity-metadata.repository';
import { TeamContentRepository } from './modules/team/datasources/team-content.repository';
import { TeamMockRepository } from './modules/team/datasources/team-mock.repository';
import { TeamRealRepository } from './modules/team/datasources/team-real.repository';
import { CrewProfileImageSyncJob } from './modules/team/jobs/crew-profile-image-sync.job';
import { TeamRepository } from './modules/team/repositories/team.repository';
import { TeamQueryService } from './modules/team/services/team-query.service';
import { createNotionClient } from './util/notion/client';
import { getPrismaClient } from './util/prisma';
import { registerAdminRoutes } from './routes/admin';
import { registerAdminDashboardRoute } from './routes/admin-dashboard';
import { registerCloudRoutes } from './routes/cloud';
import { registerHealthRoutes } from './routes/health';
import { registerTeamRoutes } from './routes/team';

const PROJECT_NAME = 'aolda-ahp-backend';
const VERSION = '0.1.0';
const DEFAULT_PORT = 8001;
const PROFILE_IMAGE_CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

function createTeamQueryService(
  env: AppEnv,
): { teamQueryService: TeamQueryService; teamRealRepository?: TeamRealRepository } {
  let repository: TeamRepository;
  let teamRealRepository: TeamRealRepository | undefined;

  if (env.useMockData) {
    repository = new TeamMockRepository();
  } else if (env.databaseUrl) {
    repository = new TeamContentRepository(getPrismaClient());
  } else {
    if (!env.notion.apiKey) {
      throw new Error('NOTION_API_KEY must be set when USE_MOCK_DATA=false');
    }
    teamRealRepository = new TeamRealRepository({
      notionClient: createNotionClient(env.notion.apiKey),
      notionTeamDbIds: env.notion.teamDbIds,
      crewProfileImageCacheRepository: env.databaseUrl
        ? new CrewProfileImageCacheRepository(getPrismaClient())
        : undefined,
      profileImageFileStorage: new ProfileImageFileStorage(
        env.profileImage.storageDir,
        env.profileImage.publicBaseUrl,
      ),
      teamActivityMetadataRepository: env.databaseUrl
        ? new TeamActivityMetadataRepository(getPrismaClient())
        : undefined,
    });
    repository = teamRealRepository;
  }

  return {
    teamQueryService: new TeamQueryService(repository),
    teamRealRepository,
  };
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

function registerProfileImageStaticRoute(app: FastifyInstance, env: AppEnv): void {
  const publicBaseUrl = env.profileImage.publicBaseUrl.replace(/\/$/, '');
  const publicBasePath = publicBaseUrl.startsWith('/')
    ? publicBaseUrl
    : (() => {
        try {
          return new URL(publicBaseUrl).pathname.replace(/\/$/, '');
        } catch {
          return null;
        }
      })();

  if (!publicBasePath?.startsWith('/')) {
    app.log.warn(
      { PROFILE_IMAGE_PUBLIC_BASE_URL: env.profileImage.publicBaseUrl },
      'Profile image public base URL path cannot be resolved; static serving is disabled',
    );
    return;
  }

  app.get(`${publicBasePath}/:fileName`, async (request, reply) => {
    const { fileName } = request.params as { fileName: string };

    if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
      return reply.code(400).send({ message: 'Invalid profile image file name' });
    }

    const filePath = join(env.profileImage.storageDir, fileName);
    const fileStat = await stat(filePath).catch(() => null);

    if (!fileStat?.isFile()) {
      return reply.code(404).send({ message: 'Profile image not found' });
    }

    const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    reply.header('cache-control', 'public, max-age=300');
    reply.type(PROFILE_IMAGE_CONTENT_TYPES[extension] ?? 'application/octet-stream');
    return reply.send(createReadStream(filePath));
  });
}

export async function buildApp(): Promise<FastifyInstance> {
  const env = readAppEnv();
  const app = Fastify({ logger: true, disableRequestLogging: true });
  let crewProfileImageSyncJob: CrewProfileImageSyncJob | undefined;

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

  app.addHook('onRequest', async (request) => {
    app.log.info(`${request.ip} -> "${request.method} ${request.url}"`);
  });

  app.addHook('onResponse', async (request, reply) => {
    app.log.info(`${request.ip} <- "${request.method} ${request.url}" ${reply.statusCode}`);
  });

  const { teamQueryService, teamRealRepository } = createTeamQueryService(env);
  const cloudQueryService = createCloudQueryService(env.useMockData);
  const internalExampleService = createInternalExampleService(env.useMockData);
  const adminUserRepository = env.databaseUrl
    ? new AdminUserRepository(getPrismaClient())
    : undefined;
  const adminBootstrapService = adminUserRepository
    ? new AdminBootstrapService(adminUserRepository, app.log)
    : undefined;
  const adminAuthService = adminUserRepository
    ? new AdminAuthService(adminUserRepository, env.admin.sessionSecret)
    : undefined;
  const adminContentService = env.databaseUrl
    ? new AdminContentService(getPrismaClient())
    : undefined;
  const notionContentSyncService =
    env.databaseUrl && env.notion.apiKey
      ? new NotionContentSyncService(
          createNotionClient(env.notion.apiKey),
          env.notion.teamDbIds,
          new ContentSourceRepository(getPrismaClient()),
          new ProfileImageFileStorage(
            env.profileImage.storageDir,
            env.profileImage.publicBaseUrl,
          ),
        )
      : undefined;
  const notionCrewTeamWriteService =
    env.databaseUrl && env.notion.apiKey && env.notion.teamDbIds.crew
      ? new NotionCrewTeamWriteService(
          createNotionClient(env.notion.apiKey),
          env.notion.teamDbIds.crew,
          getPrismaClient(),
        )
      : undefined;

  if (teamRealRepository && env.databaseUrl) {
    crewProfileImageSyncJob = new CrewProfileImageSyncJob(teamRealRepository, app.log);
  }

  await registerHealthRoutes(app);
  await registerAdminDashboardRoute(app);
  await registerAdminRoutes(app, {
    adminAuthService,
    adminContentService,
    notionContentSyncService,
    notionCrewTeamWriteService,
  });
  await registerTeamRoutes(app, { teamQueryService });
  await registerCloudRoutes(app, { cloudQueryService });
  registerProfileImageStaticRoute(app, env);

  if (env.nodeEnv === 'development') {
    await registerInternalExampleRoutes(app, { internalExampleService });
  }

  app.get('/openapi.json', async () => app.swagger());

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      filter: true,
    },
  });

  app.addHook('onReady', async () => {
    app.log.info(`Allowed env keys: ${ALLOWED_ENV_KEYS.join(', ')}`);
    app.log.info(
      {
        NODE_ENV: env.nodeEnv,
        USE_MOCK_DATA: env.useMockData,
        DATABASE_URL: env.databaseUrl ? '<set>' : '<unset>',
        NOTION_API_KEY: env.notion.apiKey ? '<set>' : '<unset>',
        NOTION_TEAM_DB_IDS: {
          crew: env.notion.teamDbIds.crew ?? '<unset>',
          activity: env.notion.teamDbIds.activity ?? '<unset>',
          study: env.notion.teamDbIds.study ?? '<unset>',
          project: env.notion.teamDbIds.project ?? '<unset>',
          crewRoleLookup: env.notion.teamDbIds.crewRoleLookup ?? '<unset>',
          crewProfile: env.notion.teamDbIds.crewProfile ?? '<unset>',
          blog: env.notion.teamDbIds.blog ?? '<unset>',
        },
        ADMIN_DEFAULT_EMAIL: env.admin.defaultEmail,
        CORS_ALLOW_ORIGINS: env.cors.origins,
        CORS_ALLOW_METHODS: env.cors.methods,
        CORS_ALLOW_HEADERS: env.cors.headers,
        CORS_ALLOW_CREDENTIALS: env.cors.credentials,
      },
      'Applied env values',
    );

    await adminBootstrapService?.ensureDefaultAdmin(env.admin);

    if (env.profileImage.syncOnStart) {
      crewProfileImageSyncJob?.start();
    }
  });

  app.addHook('onClose', async () => {
    crewProfileImageSyncJob?.stop();

    if (env.databaseUrl) {
      await getPrismaClient().$disconnect();
    }
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

if (require.main === module) {
  start().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}
