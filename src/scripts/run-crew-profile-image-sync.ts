import { readAppEnv } from '../common/config/env';
import { CrewProfileImageCacheRepository } from '../modules/team/datasources/crew-profile-image-cache.repository';
import { TeamRealRepository } from '../modules/team/datasources/team-real.repository';
import { createNotionClient } from '../util/notion/client';
import { getPrismaClient } from '../util/prisma';

async function main(): Promise<void> {
  const env = readAppEnv();

  if (!env.notion.apiKey) {
    throw new Error('NOTION_API_KEY must be set');
  }

  if (!env.notion.teamDbIds.crew || !env.notion.teamDbIds.activity) {
    throw new Error('NOTION_TEAM_DB_IDS must include crew:<id>,activity:<id>');
  }

  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL must be set for crew profile image cache sync');
  }

  const prisma = getPrismaClient();
  const teamRealRepository = new TeamRealRepository({
    notionClient: createNotionClient(env.notion.apiKey),
    notionTeamDbIds: env.notion.teamDbIds,
    crewProfileImageCacheRepository: new CrewProfileImageCacheRepository(prisma),
  });

  const syncedCount = await teamRealRepository.syncCrewProfileImageCache();
  // eslint-disable-next-line no-console
  console.log(`Crew profile image cache synced: ${syncedCount}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
