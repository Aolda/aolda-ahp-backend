import type { PrismaClient } from '@prisma/client';

export interface UpdateCrewAdminInput {
  isVisible?: boolean;
  description?: string | null;
}

export interface UpdateCrewTermTeamInput {
  generation: number;
  activityTerm: string;
  teamName: string;
}

export interface UpdateCrewProjectVisibilityInput {
  projectSourceId: string;
  isVisible: boolean;
}

export interface UpdateCrewBlogVisibilityInput {
  blogPostSourceId: string;
  isVisible: boolean;
  sortOrder?: number;
}

export interface UpdateProjectAdminInput {
  isVisible?: boolean;
  titleKoOverride?: string | null;
  titleEnOverride?: string | null;
  titleBriefOverride?: string | null;
  description?: string | null;
}

export interface UpdateProjectPeriodInput {
  label?: string | null;
  startedAt: string;
  endedAt?: string | null;
  sortOrder?: number;
}

export interface UpdateProjectParticipantInput {
  crewSourceId: string;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface UpdateProjectFeaturedBlogInput {
  blogPostSourceId: string;
  sortOrder?: number;
}

export class AdminContentService {
  constructor(private readonly prisma: PrismaClient) {}

  async listCrews() {
    return this.prisma.crewSource.findMany({
      orderBy: [{ sourceArchived: 'asc' }, { name: 'asc' }],
      include: {
        adminProfile: true,
        termTeamSources: { orderBy: { generation: 'asc' } },
        termTeamOverrides: { orderBy: { generation: 'asc' } },
      },
    });
  }

  async getCrew(crewSourceId: string) {
    return this.prisma.crewSource.findUnique({
      where: { id: crewSourceId },
      include: {
        adminProfile: true,
        termTeamSources: { orderBy: { generation: 'asc' } },
        termTeamOverrides: { orderBy: { generation: 'asc' } },
        projectVisibilities: {
          include: { projectSource: true },
          orderBy: { projectSource: { titleKo: 'asc' } },
        },
        blogVisibilities: {
          include: { blogPostSource: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async updateCrew(crewSourceId: string, input: UpdateCrewAdminInput) {
    await this.ensureCrewExists(crewSourceId);
    return this.prisma.crewAdminProfile.upsert({
      where: { crewSourceId },
      create: {
        crewSourceId,
        isVisible: input.isVisible ?? false,
        description: input.description,
      },
      update: this.omitUndefined({
        isVisible: input.isVisible,
        description: input.description,
      }),
    });
  }

  async replaceCrewTermTeams(crewSourceId: string, items: UpdateCrewTermTeamInput[]) {
    await this.ensureCrewExists(crewSourceId);
    return this.prisma.$transaction(async (tx) => {
      await tx.crewTermTeamOverride.deleteMany({ where: { crewSourceId } });
      if (items.length > 0) {
        await tx.crewTermTeamOverride.createMany({
          data: items.map((item) => ({
            crewSourceId,
            generation: item.generation,
            activityTerm: item.activityTerm,
            teamName: item.teamName,
          })),
        });
      }

      return tx.crewTermTeamOverride.findMany({
        where: { crewSourceId },
        orderBy: { generation: 'asc' },
      });
    });
  }

  async replaceCrewProjectVisibilities(
    crewSourceId: string,
    items: UpdateCrewProjectVisibilityInput[],
  ) {
    await this.ensureCrewExists(crewSourceId);
    return this.prisma.$transaction(async (tx) => {
      await tx.crewProjectVisibility.deleteMany({ where: { crewSourceId } });
      if (items.length > 0) {
        await tx.crewProjectVisibility.createMany({
          data: items.map((item) => ({
            crewSourceId,
            projectSourceId: item.projectSourceId,
            isVisible: item.isVisible,
          })),
        });
      }

      return tx.crewProjectVisibility.findMany({
        where: { crewSourceId },
        include: { projectSource: true },
      });
    });
  }

  async replaceCrewBlogVisibilities(crewSourceId: string, items: UpdateCrewBlogVisibilityInput[]) {
    await this.ensureCrewExists(crewSourceId);
    return this.prisma.$transaction(async (tx) => {
      await tx.crewBlogVisibility.deleteMany({ where: { crewSourceId } });
      if (items.length > 0) {
        await tx.crewBlogVisibility.createMany({
          data: items.map((item, index) => ({
            crewSourceId,
            blogPostSourceId: item.blogPostSourceId,
            isVisible: item.isVisible,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }

      return tx.crewBlogVisibility.findMany({
        where: { crewSourceId },
        include: { blogPostSource: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async listProjects() {
    return this.prisma.projectSource.findMany({
      orderBy: [{ sourceArchived: 'asc' }, { titleKo: 'asc' }],
      include: {
        adminProfile: true,
        periodOverrides: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getProject(projectSourceId: string) {
    return this.prisma.projectSource.findUnique({
      where: { id: projectSourceId },
      include: {
        adminProfile: true,
        periodOverrides: { orderBy: { sortOrder: 'asc' } },
        participantOverrides: {
          include: { crewSource: true },
          orderBy: { sortOrder: 'asc' },
        },
        featuredBlogs: {
          include: { blogPostSource: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async updateProject(projectSourceId: string, input: UpdateProjectAdminInput) {
    await this.ensureProjectExists(projectSourceId);
    return this.prisma.projectAdminProfile.upsert({
      where: { projectSourceId },
      create: {
        projectSourceId,
        isVisible: input.isVisible ?? false,
        titleKoOverride: input.titleKoOverride,
        titleEnOverride: input.titleEnOverride,
        titleBriefOverride: input.titleBriefOverride,
        description: input.description,
      },
      update: this.omitUndefined({
        isVisible: input.isVisible,
        titleKoOverride: input.titleKoOverride,
        titleEnOverride: input.titleEnOverride,
        titleBriefOverride: input.titleBriefOverride,
        description: input.description,
      }),
    });
  }

  async replaceProjectPeriods(projectSourceId: string, items: UpdateProjectPeriodInput[]) {
    await this.ensureProjectExists(projectSourceId);
    return this.prisma.$transaction(async (tx) => {
      await tx.projectPeriodOverride.deleteMany({ where: { projectSourceId } });
      if (items.length > 0) {
        await tx.projectPeriodOverride.createMany({
          data: items.map((item, index) => ({
            projectSourceId,
            label: item.label,
            startedAt: item.startedAt,
            endedAt: item.endedAt,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }

      return tx.projectPeriodOverride.findMany({
        where: { projectSourceId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async replaceProjectParticipants(
    projectSourceId: string,
    items: UpdateProjectParticipantInput[],
  ) {
    await this.ensureProjectExists(projectSourceId);
    return this.prisma.$transaction(async (tx) => {
      await tx.projectParticipantOverride.deleteMany({ where: { projectSourceId } });
      if (items.length > 0) {
        await tx.projectParticipantOverride.createMany({
          data: items.map((item, index) => ({
            projectSourceId,
            crewSourceId: item.crewSourceId,
            isVisible: item.isVisible ?? true,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }

      return tx.projectParticipantOverride.findMany({
        where: { projectSourceId },
        include: { crewSource: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async replaceProjectFeaturedBlogs(
    projectSourceId: string,
    items: UpdateProjectFeaturedBlogInput[],
  ) {
    await this.ensureProjectExists(projectSourceId);
    return this.prisma.$transaction(async (tx) => {
      await tx.projectFeaturedBlog.deleteMany({ where: { projectSourceId } });
      if (items.length > 0) {
        await tx.projectFeaturedBlog.createMany({
          data: items.map((item, index) => ({
            projectSourceId,
            blogPostSourceId: item.blogPostSourceId,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }

      return tx.projectFeaturedBlog.findMany({
        where: { projectSourceId },
        include: { blogPostSource: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async listBlogs() {
    return this.prisma.blogPostSource.findMany({
      orderBy: [{ sourceArchived: 'asc' }, { recordedAt: 'desc' }, { title: 'asc' }],
    });
  }

  private async ensureCrewExists(crewSourceId: string): Promise<void> {
    const crew = await this.prisma.crewSource.findUnique({
      where: { id: crewSourceId },
      select: { id: true },
    });
    if (!crew) {
      throw new Error(`Crew source not found: ${crewSourceId}`);
    }
  }

  private async ensureProjectExists(projectSourceId: string): Promise<void> {
    const project = await this.prisma.projectSource.findUnique({
      where: { id: projectSourceId },
      select: { id: true },
    });
    if (!project) {
      throw new Error(`Project source not found: ${projectSourceId}`);
    }
  }

  private omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
    ) as Partial<T>;
  }
}
