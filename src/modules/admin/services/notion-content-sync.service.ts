import type { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

import { ContentSourceRepository } from '../datasources/content-source.repository';
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

const DEFAULT_CREW_GENERATION_MAPPING_DATA_SOURCE_ID = '355a7bac-f955-80da-b748-000b2233c7dd';
const DEFAULT_STUDY_DATA_SOURCE_ID = '457a7bac-f955-822a-9359-0706ae009fca';

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
}

export class NotionContentSyncService {
  constructor(
    private readonly notionClient: Client,
    private readonly dbIds: NotionContentSyncDbIds,
    private readonly contentSourceRepository: ContentSourceRepository,
  ) {}

  async syncAll(): Promise<NotionContentSyncSummary> {
    const [crew, project, blog] = await Promise.all([
      this.syncCrews(),
      this.syncProjects(),
      this.syncBlogs(),
    ]);

    return { crew, project, blog };
  }

  async syncCrews(): Promise<SyncEntitySummary> {
    const summary = this.emptySummary();
    if (!this.dbIds.crew) {
      return { ...summary, skipped: 1 };
    }

    const crewFetcher = new CrewFetcher(this.notionClient, this.dbIds.crew);
    const generationMappingFetcher = new CrewGenerationMappingFetcher(
      this.notionClient,
      DEFAULT_CREW_GENERATION_MAPPING_DATA_SOURCE_ID,
    );
    const [crewPages, generationMap] = await Promise.all([
      crewFetcher.fetchPages(),
      this.fetchActivityTermGenerationMap(generationMappingFetcher),
    ]);
    const syncedAt = new Date();

    for (const page of crewPages) {
      const profileAccountIds = extractProfileAccountIds(page);
      const generations = extractGenerationNumbers(page);
      const detailSource = await crewFetcher.fetchDetailSource(page, null);
      const result = await this.contentSourceRepository.upsertCrewSource({
        sourceKey: this.buildCrewSourceKey(page, profileAccountIds),
        primaryNotionPageId: page.id,
        profileAccountIds,
        name: extractCrewName(page),
        email: this.extractCrewEmailOrNull(page),
        profileImageUrl: detailSource.profileImageUrl,
        notionDescription: detailSource.description,
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
    }

    return summary;
  }

  async syncProjects(): Promise<SyncEntitySummary> {
    const summary = this.emptySummary();
    const projectDataSourceId = this.dbIds.project ?? this.dbIds.activity;
    if (!projectDataSourceId) {
      return { ...summary, skipped: 1 };
    }

    const projectFetcher = new ActivityFetcher(this.notionClient, projectDataSourceId);
    const studyFetcher = this.dbIds.study
      ? new ActivityFetcher(this.notionClient, this.dbIds.study)
      : new ActivityFetcher(this.notionClient, DEFAULT_STUDY_DATA_SOURCE_ID);
    const [projectPages, studyPages] = await Promise.all([
      projectFetcher.fetchPages(),
      studyFetcher.fetchPages().catch(() => []),
    ]);
    const syncedAt = new Date();

    for (const page of [...projectPages, ...studyPages]) {
      const parsed = parseActivityPage(page);
      if (parsed.activityType !== 'ACTIVITY_TYPE/PROJECT') {
        continue;
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
    }

    return summary;
  }

  async syncBlogs(): Promise<SyncEntitySummary> {
    const summary = this.emptySummary();
    if (!this.dbIds.blog) {
      return { ...summary, skipped: 1 };
    }

    const blogPostFetcher = new BlogPostFetcher(this.notionClient, this.dbIds.blog);
    const pages = await blogPostFetcher.fetchPages();
    const syncedAt = new Date();

    for (const page of pages) {
      const parsed = parseBlogPostPage(page);
      const created = await this.contentSourceRepository.upsertBlogPostSource({
        notionPageId: page.id,
        title: parsed.title,
        url: parsed.url,
        projectName: parsed.projectName,
        contentPreview: null,
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
    }

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
}
