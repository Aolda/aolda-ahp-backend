import type { PrismaClient } from '@prisma/client';

export interface TeamActivityMetadataRecord {
  id: number;
  notionPageId: string;
  sourceType: string;
  koName: string;
  enName: string | null;
  briefName: string | null;
  description: string | null;
  isVisible: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamActivityMetadataUpsertInput {
  notionPageId: string;
  sourceType: string;
  koName: string;
  enName: string | null;
  briefName: string | null;
  description: string | null;
  isVisible: boolean;
  lastSeenAt: Date | null;
}

export interface UpdateTeamActivityMetadataInput {
  enName?: string | null;
  briefName?: string | null;
  description?: string | null;
}

export class TeamActivityMetadataRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByNotionPageIds(pageIds: string[]): Promise<Map<string, TeamActivityMetadataRecord>> {
    if (pageIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.teamActivityMetadata.findMany({
      where: {
        notionPageId: { in: pageIds },
      },
    });

    return new Map(rows.map((row) => [row.notionPageId, row]));
  }

  async findByActivityId(activityId: number): Promise<TeamActivityMetadataRecord | null> {
    return this.prisma.teamActivityMetadata.findUnique({
      where: { id: activityId },
    });
  }

  async upsertMany(records: TeamActivityMetadataUpsertInput[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      records.map((record) =>
        this.prisma.teamActivityMetadata.upsert({
          where: { notionPageId: record.notionPageId },
          create: {
            notionPageId: record.notionPageId,
            sourceType: record.sourceType,
            koName: record.koName,
            enName: record.enName,
            briefName: record.briefName,
            description: record.description,
            isVisible: record.isVisible,
            lastSeenAt: record.lastSeenAt,
          },
          update: {
            sourceType: record.sourceType,
            koName: record.koName,
            enName: record.enName,
            briefName: record.briefName,
            description: record.description,
            isVisible: record.isVisible,
            lastSeenAt: record.lastSeenAt,
          },
        }),
      ),
    );
  }

  async markInvisibleByMissingNotionPageIds(notionPageIds: string[]): Promise<number> {
    const result =
      notionPageIds.length === 0
        ? await this.prisma.teamActivityMetadata.updateMany({
            where: { isVisible: true },
            data: { isVisible: false },
          })
        : await this.prisma.teamActivityMetadata.updateMany({
            where: {
              notionPageId: { notIn: notionPageIds },
              isVisible: true,
            },
            data: { isVisible: false },
          });

    return result.count;
  }

  async updateMetadataByActivityId(
    activityId: number,
    input: UpdateTeamActivityMetadataInput,
  ): Promise<TeamActivityMetadataRecord | null> {
    const data = Object.fromEntries(
      Object.entries({
        enName: input.enName,
        briefName: input.briefName,
        description: input.description,
      }).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(data).length === 0) {
      return this.findByActivityId(activityId);
    }

    try {
      return await this.prisma.teamActivityMetadata.update({
        where: { id: activityId },
        data,
      });
    } catch {
      return null;
    }
  }
}
