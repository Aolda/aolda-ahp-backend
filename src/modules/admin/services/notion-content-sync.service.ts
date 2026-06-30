import type { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

import { ContentSourceRepository, type SyncJobRecord } from '../datasources/content-source.repository';
import {
  extractCrewEmail,
  extractCrewName,
  extractCrewTeamName,
  extractCrewWritingTerm,
  extractGenerationNumbers,
  extractProfileAccountIds,
} from '../../team/notion/extractors/crew-page.extractor';
import { ActivityFetcher } from '../../team/notion/fetchers/activity.fetcher';
import { BlogPostFetcher } from '../../team/notion/fetchers/blog-post.fetcher';
import { CrewFetcher } from '../../team/notion/fetchers/crew.fetcher';
import { CrewGenerationMappingFetcher } from '../../team/notion/fetchers/crew-generation-mapping.fetcher';
import { parseActivityMetadataSeed } from '../../team/notion/parsers/activity-metadata-seed.parser';
import { parseActivityPage } from '../../team/notion/parsers/activity-page.parser';
import { parseBlogPostPage } from '../../team/notion/parsers/blog-post-page.parser';
import { parseCrewGenerationMappingPage } from '../../team/notion/parsers/crew-generation-mapping-page.parser';
import { ProfileImageFileStorage } from '../../team/datasources/profile-image-file-storage';

const DEFAULT_CREW_GENERATION_MAPPING_DATA_SOURCE_ID = '355a7bac-f955-80da-b748-000b2233c7dd';
const DEFAULT_STUDY_DATA_SOURCE_ID = '457a7bac-f955-822a-9359-0706ae009fca';
const DEFAULT_SYNC_CONCURRENCY = 6;

export interface NotionContentSyncDbIds {
  crew?: string;
  activity?: string;
  study?: string;
  project?: string;
  blog?: string;
}

export interface NotionContentSyncSummary {
  crew: SyncEntitySummary;
  project: SyncEntitySummary;
  blog: SyncEntitySummary;
}

export interface SyncEntitySummary {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  profileImages?: ProfileImageSyncSummary;
}

export interface ProfileImageSyncSummary {
  found: number;
  downloaded: number;
  failed: number;
}

export interface NotionContentSyncOptions {
  syncCrewDetails?: boolean;
  concurrency?: number;
}

type SyncProgressReporter = (event: {
  stage: string;
  message: string;
  processed?: number;
  total?: number;
  summary?: NotionContentSyncSummary;
}) => Promise<void>;

export interface NotionContentSyncJob {
  id: string;
  source: string;
  status: string;
  requestedBy: string | null;
  startedAt: string;
  finishedAt: string | null;
  totalCount: number;
  createdCount: number;
  updatedCount: number;
  archivedCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  logs: Array<{
    id: string;
    level: string;
    message: string;
    metadata: unknown;
    createdAt: string;
  }>;
}

export class NotionContentSyncService {
  constructor(
    private readonly notionClient: Client,
    private readonly dbIds: NotionContentSyncDbIds,
    private readonly contentSourceRepository: ContentSourceRepository,
    private readonly profileImageFileStorage?: ProfileImageFileStorage,
    private readonly options: NotionContentSyncOptions = {},
  ) {}

  async syncAll(reportProgress?: SyncProgressReporter): Promise<NotionContentSyncSummary> {
    await reportProgress?.({ stage: 'all', message: 'Starting Notion content sync' });
    const [crew, project, blog] = await Promise.all([
      this.syncCrews(reportProgress),
      this.syncProjects(reportProgress),
      this.syncBlogs(reportProgress),
    ]);

    const summary = { crew, project, blog };
    await reportProgress?.({ stage: 'all', message: 'Finished Notion content sync', summary });
    return summary;
  }

  async startSyncAll(requestedBy?: string | null): Promise<NotionContentSyncJob> {
    const job = await this.contentSourceRepository.createSyncJob({
      source: 'notion',
      requestedBy,
    });

    setImmediate(() => {
      void this.runSyncAllJob(job.id);
    });

    return this.toJob(job);
  }

  async getSyncJob(id: string): Promise<NotionContentSyncJob | null> {
    const job = await this.contentSourceRepository.getSyncJob(id);
    return job ? this.toJob(job) : null;
  }

  async getLatestSyncJob(): Promise<NotionContentSyncJob | null> {
    const job = await this.contentSourceRepository.getLatestSyncJob('notion');
    return job ? this.toJob(job) : null;
  }

  private async runSyncAllJob(jobId: string): Promise<void> {
    try {
      const summary = await this.syncAll(async (event) => {
        const totals = event.summary ? this.totalSummary(event.summary) : undefined;
        await this.contentSourceRepository.updateSyncJobProgress(jobId, {
          ...totals,
          logMessage: event.message,
          metadata: this.progressMetadata(event),
        });
      });
      const totals = this.totalSummary(summary);
      await this.contentSourceRepository.finishSyncJob(jobId, {
        status: 'SUCCEEDED',
        ...totals,
        logMessage: 'Sync job succeeded',
        metadata: summary as never,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Notion content sync failed';
      await this.contentSourceRepository.finishSyncJob(jobId, {
        status: 'FAILED',
        errorMessage: message,
        logMessage: message,
      });
    }
  }

  async syncCrews(reportProgress?: SyncProgressReporter): Promise<SyncEntitySummary> {
    const summary = this.emptySummary();
    if (!this.dbIds.crew) {
      await reportProgress?.({ stage: 'crew', message: 'Crew sync skipped: data source is not configured' });
      return { ...summary, skipped: 1 };
    }

    await reportProgress?.({ stage: 'crew', message: 'Fetching crew pages from Notion' });
    const crewFetcher = new CrewFetcher(this.notionClient, this.dbIds.crew);
    const generationMappingFetcher = new CrewGenerationMappingFetcher(
      this.notionClient,
      DEFAULT_CREW_GENERATION_MAPPING_DATA_SOURCE_ID,
    );
    const [crewPages, generationMap] = await Promise.all([
      crewFetcher.fetchPages(),
      this.fetchActivityTermGenerationMap(generationMappingFetcher),
    ]);
    await reportProgress?.({
      stage: 'crew',
      message: `Processing ${crewPages.length} crew pages`,
      processed: 0,
      total: crewPages.length,
    });
    const syncedAt = new Date();
    const profileImages: ProfileImageSyncSummary = {
      found: 0,
      downloaded: 0,
      failed: 0,
    };

    let processed = 0;
    await this.mapWithConcurrency(crewPages, this.syncConcurrency(), async (page) => {
      const profileAccountIds = extractProfileAccountIds(page);
      const generations = extractGenerationNumbers(page);
      const pageSource = await crewFetcher.fetchPageSource(page);
      const notionDescription = this.options.syncCrewDetails
        ? (await crewFetcher.fetchDetailSource(page, pageSource.profileImageUrl)).description
        : null;
      const profileImage = await this.resolveProfileImageUrl(
        page.id,
        pageSource.profileImageUrl,
      );
      if (pageSource.profileImageUrl) {
        profileImages.found += 1;
      }
      if (profileImage.downloaded) {
        profileImages.downloaded += 1;
      }
      if (profileImage.failed) {
        profileImages.failed += 1;
      }
      const result = await this.contentSourceRepository.upsertCrewSource({
        sourceKey: this.buildCrewSourceKey(page, profileAccountIds),
        primaryNotionPageId: page.id,
        profileAccountIds,
        name: extractCrewName(page),
        email: this.extractCrewEmailOrNull(page),
        profileImageUrl: profileImage.url,
        notionDescription,
        joinedGen: generations[0] ?? null,
        sourcePayload: page as never,
        lastSyncedAt: syncedAt,
      });

      summary.total += 1;
      if (result.created) {
        summary.created += 1;
      } else {
        summary.updated += 1;
      }

      const activityTerm = extractCrewWritingTerm(page);
      const generation = activityTerm ? generationMap.get(activityTerm) : undefined;
      if (activityTerm && generation !== undefined) {
        await this.contentSourceRepository.upsertCrewTermTeamSource({
          crewSourceId: result.id,
          notionPageId: page.id,
          generation,
          activityTerm,
          teamName: extractCrewTeamName(page),
          profileAccountIds,
          sourcePayload: page as never,
          lastSyncedAt: syncedAt,
        });
      }

      processed += 1;
      if (processed % 10 === 0 || processed === crewPages.length) {
        await reportProgress?.({
          stage: 'crew',
          message: `Processed ${processed}/${crewPages.length} crew pages`,
          processed,
          total: crewPages.length,
        });
      }
    });

    summary.profileImages = profileImages;
    await reportProgress?.({
      stage: 'crew',
      message: `Crew sync completed: ${summary.total} total, ${summary.created} created, ${summary.updated} updated`,
      processed: summary.total,
      total: crewPages.length,
    });
    return summary;
  }

  private async resolveProfileImageUrl(
    notionPageId: string,
    sourceImageUrl: string | null,
  ): Promise<{ url: string | null; downloaded: boolean; failed: boolean }> {
    if (!sourceImageUrl || !this.profileImageFileStorage) {
      return { url: sourceImageUrl, downloaded: false, failed: false };
    }

    try {
      const storedImage = await this.profileImageFileStorage.saveFromUrl(
        notionPageId,
        sourceImageUrl,
      );
      return { url: storedImage.publicUrl, downloaded: true, failed: false };
    } catch {
      return { url: sourceImageUrl, downloaded: false, failed: true };
    }
  }

  async syncProjects(reportProgress?: SyncProgressReporter): Promise<SyncEntitySummary> {
    const summary = this.emptySummary();
    const projectDataSourceId = this.dbIds.project ?? this.dbIds.activity;
    if (!projectDataSourceId) {
      await reportProgress?.({ stage: 'project', message: 'Project sync skipped: data source is not configured' });
      return { ...summary, skipped: 1 };
    }

    await reportProgress?.({ stage: 'project', message: 'Fetching project pages from Notion' });
    const projectFetcher = new ActivityFetcher(this.notionClient, projectDataSourceId);
    const studyFetcher = this.dbIds.study
      ? new ActivityFetcher(this.notionClient, this.dbIds.study)
      : new ActivityFetcher(this.notionClient, DEFAULT_STUDY_DATA_SOURCE_ID);
    const [projectPages, studyPages] = await Promise.all([
      projectFetcher.fetchPages(),
      studyFetcher.fetchPages().catch(() => []),
    ]);
    const pages = [...projectPages, ...studyPages];
    await reportProgress?.({
      stage: 'project',
      message: `Processing ${pages.length} project/study pages`,
      processed: 0,
      total: pages.length,
    });
    const syncedAt = new Date();

    let processed = 0;
    await this.mapWithConcurrency(pages, this.syncConcurrency(), async (page) => {
      const parsed = parseActivityPage(page);
      if (parsed.activityType !== 'ACTIVITY_TYPE/PROJECT') {
        processed += 1;
        if (processed % 10 === 0 || processed === pages.length) {
          await reportProgress?.({
            stage: 'project',
            message: `Processed ${processed}/${pages.length} project/study pages`,
            processed,
            total: pages.length,
          });
        }
        return;
      }

      const seeded = parseActivityMetadataSeed(page, parsed.activityType);
      const created = await this.contentSourceRepository.upsertProjectSource({
        notionPageId: page.id,
        titleKo: seeded.koName,
        titleEn: seeded.enName,
        titleBrief: seeded.briefName,
        status: parsed.status,
        startedAt: parsed.startedAt,
        endedAt: null,
        backgroundImageUrl: parsed.backgroundImageUrl,
        backgroundColor: null,
        participantRefs: this.extractParticipantRefs(page),
        sourcePayload: page as never,
        lastSyncedAt: syncedAt,
      });

      summary.total += 1;
      if (created) {
        summary.created += 1;
      } else {
        summary.updated += 1;
      }

      processed += 1;
      if (processed % 10 === 0 || processed === pages.length) {
        await reportProgress?.({
          stage: 'project',
          message: `Processed ${processed}/${pages.length} project/study pages`,
          processed,
          total: pages.length,
        });
      }
    });

    await reportProgress?.({
      stage: 'project',
      message: `Project sync completed: ${summary.total} total, ${summary.created} created, ${summary.updated} updated`,
      processed: processed,
      total: pages.length,
    });
    return summary;
  }

  async syncBlogs(reportProgress?: SyncProgressReporter): Promise<SyncEntitySummary> {
    const summary = this.emptySummary();
    if (!this.dbIds.blog) {
      await reportProgress?.({ stage: 'blog', message: 'Blog sync skipped: data source is not configured' });
      return { ...summary, skipped: 1 };
    }

    await reportProgress?.({ stage: 'blog', message: 'Fetching blog pages from Notion' });
    const blogPostFetcher = new BlogPostFetcher(this.notionClient, this.dbIds.blog);
    const pages = await blogPostFetcher.fetchPages();
    await reportProgress?.({
      stage: 'blog',
      message: `Processing ${pages.length} blog pages`,
      processed: 0,
      total: pages.length,
    });
    const syncedAt = new Date();

    let processed = 0;
    await this.mapWithConcurrency(pages, this.syncConcurrency(), async (page) => {
      const parsed = parseBlogPostPage(page);
      const contentPreview = await blogPostFetcher.fetchMarkdownContent(page.id);
      const created = await this.contentSourceRepository.upsertBlogPostSource({
        notionPageId: page.id,
        title: parsed.title,
        url: parsed.url,
        projectName: parsed.projectName,
        contentPreview,
        recordedAt: parsed.recordedAt,
        participantRefs: parsed.participantRefs,
        projectRefs: parsed.projectName ? [parsed.projectName] : [],
        sourcePayload: page as never,
        lastSyncedAt: syncedAt,
      });

      summary.total += 1;
      if (created) {
        summary.created += 1;
      } else {
        summary.updated += 1;
      }

      processed += 1;
      if (processed % 25 === 0 || processed === pages.length) {
        await reportProgress?.({
          stage: 'blog',
          message: `Processed ${processed}/${pages.length} blog pages`,
          processed,
          total: pages.length,
        });
      }
    });

    await reportProgress?.({
      stage: 'blog',
      message: `Blog sync completed: ${summary.total} total, ${summary.created} created, ${summary.updated} updated`,
      processed: summary.total,
      total: pages.length,
    });
    return summary;
  }

  private async fetchActivityTermGenerationMap(
    fetcher: CrewGenerationMappingFetcher,
  ): Promise<Map<string, number>> {
    const pages = await fetcher.fetchPages();
    const map = new Map<string, number>();

    for (const page of pages) {
      const parsed = parseCrewGenerationMappingPage(page);
      if (parsed.activityTerm && parsed.generation !== null) {
        map.set(parsed.activityTerm, parsed.generation);
      }
    }

    return map;
  }

  private buildCrewSourceKey(page: PageObjectResponse, profileAccountIds: string[]): string {
    if (profileAccountIds.length > 0) {
      return `person:${[...profileAccountIds].sort().join('|')}`;
    }

    return `page:${page.id}`;
  }

  private extractCrewEmailOrNull(page: PageObjectResponse): string | null {
    const email = extractCrewEmail(page);
    return email.includes('dummy-email-not-fetched-yet') ? null : email;
  }

  private extractParticipantRefs(page: PageObjectResponse): string[] {
    const participantsProperty = page.properties['참여자'] as
      | {
          people?: Array<{ id?: string }>;
          relation?: Array<{ id?: string }>;
        }
      | undefined;

    if (Array.isArray(participantsProperty?.people)) {
      return participantsProperty.people.map((person) => person.id).filter(Boolean) as string[];
    }

    if (Array.isArray(participantsProperty?.relation)) {
      return participantsProperty.relation.map((relation) => relation.id).filter(Boolean) as string[];
    }

    return [];
  }

  private emptySummary(): SyncEntitySummary {
    return {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
    };
  }

  private syncConcurrency(): number {
    return Math.max(1, this.options.concurrency ?? DEFAULT_SYNC_CONCURRENCY);
  }

  private async mapWithConcurrency<T>(
    items: T[],
    concurrency: number,
    run: (item: T, index: number) => Promise<void>,
  ): Promise<void> {
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        await run(items[index], index);
      }
    });

    await Promise.all(workers);
  }

  private totalSummary(summary: NotionContentSyncSummary): {
    totalCount: number;
    createdCount: number;
    updatedCount: number;
    archivedCount: number;
  } {
    const entities = [summary.crew, summary.project, summary.blog];
    return {
      totalCount: entities.reduce((total, item) => total + item.total, 0),
      createdCount: entities.reduce((total, item) => total + item.created, 0),
      updatedCount: entities.reduce((total, item) => total + item.updated, 0),
      archivedCount: 0,
    };
  }

  private toJob(job: SyncJobRecord): NotionContentSyncJob {
    return {
      id: job.id,
      source: job.source,
      status: job.status,
      requestedBy: job.requestedBy,
      startedAt: job.startedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString() ?? null,
      totalCount: job.totalCount,
      createdCount: job.createdCount,
      updatedCount: job.updatedCount,
      archivedCount: job.archivedCount,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      logs: job.logs.map((log) => ({
        id: log.id,
        level: log.level,
        message: log.message,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  private progressMetadata(event: {
    stage: string;
    processed?: number;
    total?: number;
  }): Record<string, string | number> {
    return {
      stage: event.stage,
      ...(event.processed === undefined ? {} : { processed: event.processed }),
      ...(event.total === undefined ? {} : { total: event.total }),
    };
  }
}
