import { readAppEnv } from '../common/config/env';
import { ContentSourceRepository } from '../modules/admin/datasources/content-source.repository';
import { NotionContentSyncService } from '../modules/admin/services/notion-content-sync.service';
import { createNotionClient } from '../util/notion/client';
import { getPrismaClient } from '../util/prisma';

async function main(): Promise<void> {
  const env = readAppEnv();

  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL must be set to sync Notion content sources');
  }

  if (!env.notion.apiKey) {
    throw new Error('NOTION_API_KEY must be set to sync Notion content sources');
  }

  const prisma = getPrismaClient();
  const syncService = new NotionContentSyncService(
    createNotionClient(env.notion.apiKey),
    env.notion.teamDbIds,
    new ContentSourceRepository(prisma),
  );

  try {
    const summary = await syncService.syncAll();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
