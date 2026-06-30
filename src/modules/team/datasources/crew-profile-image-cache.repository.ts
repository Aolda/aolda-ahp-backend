import type { PrismaClient } from '@prisma/client';

export interface CrewProfileImageCacheRecord {
  notionPageId: string;
  imageUrl: string | null;
  sourceImageUrl: string | null;
  localPath: string | null;
  contentType: string | null;
  contentHash: string | null;
  fileSize: number | null;
  lastSyncedAt: Date;
}

export class CrewProfileImageCacheRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByPageIds(pageIds: string[]): Promise<Map<string, CrewProfileImageCacheRecord>> {
    if (pageIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.crewProfileImageCache.findMany({
      select: {
        notionPageId: true,
        imageUrl: true,
        lastSyncedAt: true,
      },
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
          sourceImageUrl: null,
          localPath: null,
          contentType: null,
          contentHash: null,
          fileSize: null,
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
            sourceImageUrl: record.sourceImageUrl,
            localPath: record.localPath,
            contentType: record.contentType,
            contentHash: record.contentHash,
            fileSize: record.fileSize,
            lastSyncedAt: record.lastSyncedAt,
          },
          update: {
            imageUrl: record.imageUrl,
            sourceImageUrl: record.sourceImageUrl,
            localPath: record.localPath,
            contentType: record.contentType,
            contentHash: record.contentHash,
            fileSize: record.fileSize,
            lastSyncedAt: record.lastSyncedAt,
          },
        }),
      ),
    );
  }
}
