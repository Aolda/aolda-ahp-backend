import type { PrismaClient } from '@prisma/client';

export interface CrewProfileImageCacheRecord {
  notionPageId: string;
  imageUrl: string | null;
  lastSyncedAt: Date;
}

export class CrewProfileImageCacheRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByPageIds(pageIds: string[]): Promise<Map<string, CrewProfileImageCacheRecord>> {
    if (pageIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.crewProfileImageCache.findMany({
      where: {
        notionPageId: {
          in: pageIds,
        },
      },
    });

    return new Map(
      rows.map((row) => [
        row.notionPageId,
        {
          notionPageId: row.notionPageId,
          imageUrl: row.imageUrl,
          lastSyncedAt: row.lastSyncedAt,
        },
      ]),
    );
  }

  async upsertMany(records: CrewProfileImageCacheRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      records.map((record) =>
        this.prisma.crewProfileImageCache.upsert({
          where: { notionPageId: record.notionPageId },
          create: {
            notionPageId: record.notionPageId,
            imageUrl: record.imageUrl,
            lastSyncedAt: record.lastSyncedAt,
          },
          update: {
            imageUrl: record.imageUrl,
            lastSyncedAt: record.lastSyncedAt,
          },
        }),
      ),
    );
  }
}
