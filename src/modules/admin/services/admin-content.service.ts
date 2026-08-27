import type { Prisma, PrismaClient } from '@prisma/client';
import { normalizeAdmissionYear } from '../../team/crew-academic-profile';
import { resolveCrewIdentity } from '../../team/crew-identity';

export interface UpdateCrewAdminInput {
  isVisible?: boolean;
  description?: string | null;
  univDepartmentOverride?: string | null;
  univJoinedYearOverride?: string | null;
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

export interface UpsertCloudProductParticipantInput {
  crewSourceId?: string | null;
  crewPublicId?: number | null;
  profileUrl?: string | null;
  crewName: string;
  univDepartment?: string | null;
  univJoinedYear?: string | null;
  sortOrder?: number;
}

export interface UpsertCloudProductRelatedServiceInput {
  pageTitle: string;
  thumbnailUrl?: string | null;
  serviceLink?: string | null;
  sortOrder?: number;
}

export interface UpsertCloudProductInput {
  categoryCode: string;
  categoryTitle?: string;
  categoryImageUrl?: string | null;
  projectSourceId?: string | null;
  productIconUrl?: string | null;
  productName: string;
  description: string;
  cloudLink?: string | null;
  content: string;
  isVisible?: boolean;
  sortOrder?: number;
  participants?: UpsertCloudProductParticipantInput[];
  relatedServices?: UpsertCloudProductRelatedServiceInput[];
}

export const BLOG_AI_DEFAULT_PROMPT_SETTING_KEY = 'blog.ai.defaultPrompt';
export type AdminBlogDraftJobStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export class AdminContentService {
  constructor(private readonly prisma: PrismaClient) {}

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.adminSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return setting?.value ?? null;
  }

  async upsertSetting(key: string, value: string): Promise<string> {
    const setting = await this.prisma.adminSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
      select: { value: true },
    });
    return setting.value;
  }

  async createBlogDraftJob(blogPostSourceId: string) {
    return this.prisma.adminBlogDraftJob.create({
      data: {
        blogPostSourceId,
        status: 'RUNNING',
      },
    });
  }

  async getBlogDraftJob(id: string) {
    return this.prisma.adminBlogDraftJob.findUnique({
      where: { id },
    });
  }

  async completeBlogDraftJob(id: string, draft: string) {
    return this.prisma.adminBlogDraftJob.update({
      where: { id },
      data: {
        status: 'SUCCEEDED',
        draft,
        errorMessage: null,
        finishedAt: new Date(),
      },
    });
  }

  async failBlogDraftJob(id: string, errorMessage: string) {
    return this.prisma.adminBlogDraftJob.update({
      where: { id },
      data: {
        status: 'FAILED',
        errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  async listActivityTerms() {
    const terms = await this.prisma.crewTermTeamSource.findMany({
      where: { sourceArchived: false },
      orderBy: [{ generation: 'asc' }, { activityTerm: 'asc' }, { teamName: 'asc' }],
      select: {
        generation: true,
        activityTerm: true,
        teamName: true,
        crewSourceId: true,
      },
    });

    const termMap = new Map<
      string,
      { generation: number; activityTerm: string; teams: Set<string>; crewSourceIds: Set<string> }
    >();

    for (const term of terms) {
      const key = `${term.generation}:${term.activityTerm}`;
      const item =
        termMap.get(key) ??
        {
          generation: term.generation,
          activityTerm: term.activityTerm,
          teams: new Set<string>(),
          crewSourceIds: new Set<string>(),
        };

      if (term.teamName) {
        item.teams.add(term.teamName);
      }
      item.crewSourceIds.add(term.crewSourceId);
      termMap.set(key, item);
    }

    return [...termMap.values()].map((term) => ({
      generation: term.generation,
      activityTerm: term.activityTerm,
      teams: [...term.teams].sort((left, right) => left.localeCompare(right, 'ko')),
      crewCount: term.crewSourceIds.size,
    }));
  }

  async listCrews() {
    const crews = await this.prisma.crewSource.findMany({
      orderBy: [{ sourceArchived: 'asc' }, { name: 'asc' }],
      include: {
        adminProfile: true,
        termTeamSources: { orderBy: { generation: 'asc' } },
        termTeamOverrides: { orderBy: { generation: 'asc' } },
      },
    });
    return crews.map(resolveCrewIdentity);
  }

  async getCrew(crewSourceId: string) {
    const crew = await this.prisma.crewSource.findUnique({
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
    return crew ? resolveCrewIdentity(crew) : null;
  }

  async updateCrew(crewSourceId: string, input: UpdateCrewAdminInput) {
    const rawYear = input.univJoinedYearOverride;
    const year = rawYear === undefined ? undefined : normalizeAdmissionYear(rawYear);
    if (rawYear != null && rawYear !== '' && !year) {
      throw new Error('Invalid admission year: use a two/four-digit year or nine-digit student ID');
    }
    if (input.univDepartmentOverride != null && typeof input.univDepartmentOverride !== 'string') {
      throw new Error('Invalid department');
    }
    const academicOverrides = {
      univDepartmentOverride: input.univDepartmentOverride === undefined
        ? undefined : input.univDepartmentOverride?.trim() || null,
      univJoinedYearOverride: year,
    };
    await this.ensureCrewExists(crewSourceId);
    return this.prisma.crewAdminProfile.upsert({
      where: { crewSourceId },
      create: {
        crewSourceId,
        isVisible: input.isVisible ?? false,
        description: input.description,
        ...academicOverrides,
      },
      update: this.omitUndefined({
        isVisible: input.isVisible,
        description: input.description,
        ...academicOverrides,
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
    await this.ensureCrewProjectVisibilityTargets(crewSourceId, items);
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
        participantOverrides: {
          include: { crewSource: true },
          orderBy: { sortOrder: 'asc' },
        },
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

  async listCloudProducts() {
    return this.prisma.cloudProduct.findMany({
      orderBy: [{ sortOrder: 'asc' }, { publicId: 'asc' }],
      include: {
        category: true,
        projectSource: true,
        participants: { orderBy: [{ sortOrder: 'asc' }, { crewName: 'asc' }] },
        relatedServices: { orderBy: [{ sortOrder: 'asc' }, { pageTitle: 'asc' }] },
      },
    });
  }

  async getCloudProduct(productId: string) {
    return this.prisma.cloudProduct.findUnique({
      where: { id: productId },
      include: {
        category: true,
        projectSource: true,
        participants: { orderBy: [{ sortOrder: 'asc' }, { crewName: 'asc' }] },
        relatedServices: { orderBy: [{ sortOrder: 'asc' }, { pageTitle: 'asc' }] },
      },
    });
  }

  async createCloudProduct(input: UpsertCloudProductInput) {
    this.validateCloudProductInput(input);
    await this.ensureCloudProductProject(input.projectSourceId);
    await this.ensureCloudProductParticipantCrews(input.participants);
    return this.prisma.$transaction(async (tx) => {
      await tx.cloudProductCategory.upsert({
        where: { code: input.categoryCode },
        create: {
          code: input.categoryCode,
          categoryTitle: input.categoryTitle?.trim() || input.categoryCode,
          categoryImageUrl: input.categoryImageUrl,
        },
        update: this.omitUndefined({
          categoryTitle: input.categoryTitle?.trim() || undefined,
          categoryImageUrl: input.categoryImageUrl,
        }),
      });

      const product = await tx.cloudProduct.create({
        data: {
          categoryCode: input.categoryCode,
          projectSourceId: input.projectSourceId || null,
          productIconUrl: input.productIconUrl,
          productName: input.productName,
          description: input.description,
          cloudLink: input.cloudLink,
          content: input.content,
          isVisible: input.isVisible ?? false,
          sortOrder: input.sortOrder ?? 0,
        },
      });

      await this.replaceCloudProductChildren(tx, product.id, input);
      return tx.cloudProduct.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          projectSource: true,
          participants: { orderBy: [{ sortOrder: 'asc' }, { crewName: 'asc' }] },
          relatedServices: { orderBy: [{ sortOrder: 'asc' }, { pageTitle: 'asc' }] },
        },
      });
    });
  }

  async updateCloudProduct(productId: string, input: UpsertCloudProductInput) {
    this.validateCloudProductInput(input);
    await this.ensureCloudProductExists(productId);
    await this.ensureCloudProductProject(input.projectSourceId);
    await this.ensureCloudProductParticipantCrews(input.participants);
    return this.prisma.$transaction(async (tx) => {
      await tx.cloudProductCategory.upsert({
        where: { code: input.categoryCode },
        create: {
          code: input.categoryCode,
          categoryTitle: input.categoryTitle?.trim() || input.categoryCode,
          categoryImageUrl: input.categoryImageUrl,
        },
        update: this.omitUndefined({
          categoryTitle: input.categoryTitle?.trim() || undefined,
          categoryImageUrl: input.categoryImageUrl,
        }),
      });

      await tx.cloudProduct.update({
        where: { id: productId },
        data: {
          categoryCode: input.categoryCode,
          projectSourceId: input.projectSourceId || null,
          productIconUrl: input.productIconUrl,
          productName: input.productName,
          description: input.description,
          cloudLink: input.cloudLink,
          content: input.content,
          isVisible: input.isVisible ?? false,
          sortOrder: input.sortOrder ?? 0,
        },
      });

      await this.replaceCloudProductChildren(tx, productId, input);
      return tx.cloudProduct.findUnique({
        where: { id: productId },
        include: {
          category: true,
          projectSource: true,
          participants: { orderBy: [{ sortOrder: 'asc' }, { crewName: 'asc' }] },
          relatedServices: { orderBy: [{ sortOrder: 'asc' }, { pageTitle: 'asc' }] },
        },
      });
    });
  }

  async updateCloudProductVisibility(productId: string, isVisible: boolean) {
    await this.ensureCloudProductExists(productId);
    return this.prisma.cloudProduct.update({
      where: { id: productId },
      data: { isVisible },
      include: { category: true, projectSource: true },
    });
  }

  async deleteCloudProduct(productId: string) {
    await this.ensureCloudProductExists(productId);
    return this.prisma.cloudProduct.delete({ where: { id: productId } });
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

  private async ensureCloudProductExists(productId: string): Promise<void> {
    const product = await this.prisma.cloudProduct.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new Error(`Cloud product not found: ${productId}`);
    }
  }

  private async ensureCloudProductProject(projectSourceId: string | null | undefined): Promise<void> {
    if (!projectSourceId) return;
    await this.ensureProjectExists(projectSourceId);
  }

  private async ensureCloudProductParticipantCrews(
    participants: UpsertCloudProductParticipantInput[] | undefined,
  ): Promise<void> {
    const crewSourceIds = [
      ...new Set((participants ?? []).map((participant) => participant.crewSourceId).filter(Boolean)),
    ] as string[];
    if (crewSourceIds.length === 0) return;

    const existingCount = await this.prisma.crewSource.count({
      where: { id: { in: crewSourceIds } },
    });
    if (existingCount !== crewSourceIds.length) {
      throw new Error('Cloud product participant crew source not found');
    }
  }

  private validateCloudProductInput(input: UpsertCloudProductInput): void {
    if (!input.categoryCode?.trim()) {
      throw new Error('categoryCode is required');
    }
    if (!input.productName?.trim()) {
      throw new Error('productName is required');
    }
    if (!input.description?.trim()) {
      throw new Error('description is required');
    }
    if (!input.content?.trim()) {
      throw new Error('content is required');
    }
  }

  private async replaceCloudProductChildren(
    tx: Prisma.TransactionClient,
    productId: string,
    input: UpsertCloudProductInput,
  ): Promise<void> {
    await tx.cloudProductParticipant.deleteMany({ where: { cloudProductId: productId } });
    await tx.cloudProductRelatedService.deleteMany({ where: { cloudProductId: productId } });

    const participants = (input.participants ?? [])
      .filter((participant) => participant.crewName?.trim())
      .map((participant, index) => ({
        cloudProductId: productId,
        crewSourceId: participant.crewSourceId || null,
        crewPublicId: participant.crewPublicId ?? null,
        profileUrl: participant.profileUrl ?? null,
        crewName: participant.crewName.trim(),
        univDepartment: participant.univDepartment ?? null,
        univJoinedYear: participant.univJoinedYear ?? null,
        sortOrder: participant.sortOrder ?? index,
      }));
    if (participants.length > 0) {
      await tx.cloudProductParticipant.createMany({ data: participants });
    }

    const relatedServices = (input.relatedServices ?? [])
      .filter((service) => service.pageTitle?.trim())
      .map((service, index) => ({
        cloudProductId: productId,
        pageTitle: service.pageTitle.trim(),
        thumbnailUrl: service.thumbnailUrl ?? null,
        serviceLink: service.serviceLink ?? null,
        sortOrder: service.sortOrder ?? index,
      }));
    if (relatedServices.length > 0) {
      await tx.cloudProductRelatedService.createMany({ data: relatedServices });
    }
  }

  private async ensureCrewProjectVisibilityTargets(
    crewSourceId: string,
    items: UpdateCrewProjectVisibilityInput[],
  ): Promise<void> {
    const projectSourceIds = [...new Set(items.map((item) => item.projectSourceId))];
    if (projectSourceIds.length === 0) {
      return;
    }

    const eligibleProjectCount = await this.prisma.projectParticipantOverride.count({
      where: {
        crewSourceId,
        isVisible: true,
        projectSourceId: { in: projectSourceIds },
      },
    });

    if (eligibleProjectCount !== projectSourceIds.length) {
      throw new Error('Crew project visibility can only be managed for project participants');
    }
  }

  private omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
    ) as Partial<T>;
  }
}
