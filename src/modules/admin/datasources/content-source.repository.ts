import type { Prisma, PrismaClient } from '@prisma/client';

export interface CrewSourceUpsertInput {
  sourceKey: string;
  primaryNotionPageId: string;
  profileAccountIds: Prisma.InputJsonValue;
  name: string;
  email: string | null;
  profileImageUrl: string | null;
  notionDescription: string | null;
  joinedGen: number | null;
  sourcePayload: Prisma.InputJsonValue;
  lastSyncedAt: Date;
}

export interface CrewTermTeamSourceUpsertInput {
  crewSourceId: string;
  notionPageId: string;
  generation: number;
  activityTerm: string;
  teamName: string | null;
  profileAccountIds: Prisma.InputJsonValue;
  sourcePayload: Prisma.InputJsonValue;
  lastSyncedAt: Date;
}

export interface ProjectSourceUpsertInput {
  notionPageId: string;
  titleKo: string;
  titleEn: string | null;
  titleBrief: string | null;
  status: string | null;
  startedAt: string | null;
  endedAt: string | null;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  participantRefs: Prisma.InputJsonValue;
  sourcePayload: Prisma.InputJsonValue;
  lastSyncedAt: Date;
}

export interface BlogPostSourceUpsertInput {
  notionPageId: string;
  title: string;
  url: string | null;
  projectName: string | null;
  contentPreview: string | null;
  recordedAt: Date | null;
  participantRefs: Prisma.InputJsonValue;
  projectRefs: Prisma.InputJsonValue;
  sourcePayload: Prisma.InputJsonValue;
  lastSyncedAt: Date;
}

export class ContentSourceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertCrewSource(input: CrewSourceUpsertInput): Promise<{ id: string; created: boolean }> {
    const existing = await this.prisma.crewSource.findUnique({
      where: { sourceKey: input.sourceKey },
      select: { id: true },
    });

    const row = await this.prisma.crewSource.upsert({
      where: { sourceKey: input.sourceKey },
      create: {
        ...input,
        sourceArchived: false,
        adminProfile: {
          create: {
            isVisible: false,
          },
        },
      },
      update: {
        primaryNotionPageId: input.primaryNotionPageId,
        profileAccountIds: input.profileAccountIds,
        name: input.name,
        email: input.email,
        profileImageUrl: input.profileImageUrl,
        notionDescription: input.notionDescription,
        joinedGen: input.joinedGen,
        sourcePayload: input.sourcePayload,
        sourceArchived: false,
        lastSyncedAt: input.lastSyncedAt,
      },
      select: { id: true },
    });

    return { id: row.id, created: !existing };
  }

  async upsertCrewTermTeamSource(input: CrewTermTeamSourceUpsertInput): Promise<void> {
    await this.prisma.crewTermTeamSource.upsert({
      where: { notionPageId: input.notionPageId },
      create: {
        ...input,
        sourceArchived: false,
      },
      update: {
        crewSourceId: input.crewSourceId,
        generation: input.generation,
        activityTerm: input.activityTerm,
        teamName: input.teamName,
        profileAccountIds: input.profileAccountIds,
        sourcePayload: input.sourcePayload,
        sourceArchived: false,
        lastSyncedAt: input.lastSyncedAt,
      },
    });
  }

  async upsertProjectSource(input: ProjectSourceUpsertInput): Promise<boolean> {
    const existing = await this.prisma.projectSource.findUnique({
      where: { notionPageId: input.notionPageId },
      select: { id: true },
    });

    await this.prisma.projectSource.upsert({
      where: { notionPageId: input.notionPageId },
      create: {
        ...input,
        sourceArchived: false,
        adminProfile: {
          create: {
            isVisible: false,
          },
        },
      },
      update: {
        titleKo: input.titleKo,
        titleEn: input.titleEn,
        titleBrief: input.titleBrief,
        status: input.status,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        backgroundImageUrl: input.backgroundImageUrl,
        backgroundColor: input.backgroundColor,
        participantRefs: input.participantRefs,
        sourcePayload: input.sourcePayload,
        sourceArchived: false,
        lastSyncedAt: input.lastSyncedAt,
      },
    });

    return !existing;
  }

  async upsertBlogPostSource(input: BlogPostSourceUpsertInput): Promise<boolean> {
    const existing = await this.prisma.blogPostSource.findUnique({
      where: { notionPageId: input.notionPageId },
      select: { id: true },
    });

    await this.prisma.blogPostSource.upsert({
      where: { notionPageId: input.notionPageId },
      create: {
        ...input,
        sourceArchived: false,
      },
      update: {
        title: input.title,
        url: input.url,
        projectName: input.projectName,
        contentPreview: input.contentPreview,
        recordedAt: input.recordedAt,
        participantRefs: input.participantRefs,
        projectRefs: input.projectRefs,
        sourcePayload: input.sourcePayload,
        sourceArchived: false,
        lastSyncedAt: input.lastSyncedAt,
      },
    });

    return !existing;
  }
}
