import type { Client } from '@notionhq/client';
import type {
  ActivityListResponse,
  CrewDetailResponse,
  CrewListResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  TeamRepository,
} from '../repositories/team.repository';
import { assembleActivityListResponse } from '../notion/assemblers/activity-response.assembler';
import {
  type CrewDetailAggregate,
  type CrewListAggregate,
  assembleCrewDetailResponse,
  assembleCrewListResponse,
} from '../notion/assemblers/crew-response.assembler';
import { assembleProjectListResponse } from '../notion/assemblers/project-response.assembler';
import {
  extractCrewEmail,
  extractGenerationNumbers,
  isCurrentActiveCrew,
} from '../notion/extractors/crew-page.extractor';
import { ActivityFetcher } from '../notion/fetchers/activity.fetcher';
import { CrewFetcher } from '../notion/fetchers/crew.fetcher';
import { parseActivityPage } from '../notion/parsers/activity-page.parser';
import type { ActivityAggregate } from '../notion/types/activity-aggregate';
import type { ActivityPageSource } from '../notion/types/activity-source';
import type { CrewPageSource } from '../notion/types/crew-source';

interface TeamRealDbConfig {
  notionClient: Client;
  notionTeamDbIds: { crew?: string; activity?: string; project?: string };
}

export class TeamRealRepository implements TeamRepository {
  private readonly crewFetcher: CrewFetcher;
  private readonly activityFetcher: ActivityFetcher;

  constructor({ notionClient, notionTeamDbIds }: TeamRealDbConfig) {
    if (!notionTeamDbIds.crew) throw new Error('NOTION_TEAM_DB_IDS must include crew:<id>');
    if (!notionTeamDbIds.activity) throw new Error('NOTION_TEAM_DB_IDS must include activity:<id>');

    this.crewFetcher = new CrewFetcher(notionClient, notionTeamDbIds.crew);
    this.activityFetcher = new ActivityFetcher(notionClient, notionTeamDbIds.activity);
  }

  async getCrewList(): Promise<CrewListResponse> {
    const activePages = await this.fetchActiveCrewPages();
    const crewAggregates = await Promise.all(
      activePages.map((page, index) => this.buildCrewListAggregate(page, index + 1)),
    );

    return assembleCrewListResponse(crewAggregates);
  }

  async getActivityList(): Promise<ActivityListResponse> {
    const pages = await this.activityFetcher.fetchPages();
    const activityAggregates = await Promise.all(
      pages.map((page, index) => this.buildActivityAggregate(page, index + 1)),
    );

    return assembleActivityListResponse(activityAggregates);
  }

  async getCrewDetail(crewId: string): Promise<CrewDetailResponse> {
    const activePages = await this.fetchActiveCrewPages();
    const targetIndex = Number(crewId) - 1;
    const targetPage = activePages[targetIndex];

    if (!targetPage) {
      throw new Error(`Crew not found: ${crewId}`);
    }

    const detailAggregate = await this.buildCrewDetailAggregate(targetPage, targetIndex + 1);
    return assembleCrewDetailResponse(detailAggregate);
  }

  async getProjectList(): Promise<ProjectListResponse> {
    // 프로젝트 목록은 별도 project 데이터소스가 아니라 activity 원천 데이터에서 파생합니다.
    const pages = await this.activityFetcher.fetchPages();
    const activityAggregates = await Promise.all(
      pages.map((page, index) => this.buildActivityAggregate(page, index + 1)),
    );
    const projectAggregates = activityAggregates.filter(
      (activity) => activity.activityType === 'ACTIVITY_TYPE/PROJECT',
    );

    return assembleProjectListResponse(projectAggregates);
  }

  async getProjectDetail(_projectId: string): Promise<ProjectDetailResponse> {
    // TODO: 단건 조회 구현 시 project 전용 datasource 또는 relation 기반 fetcher를 다시 도입합니다.
    throw new Error('Not implemented: TeamRealRepository.getProjectDetail');
  }

  private async fetchActiveCrewPages() {
    const pages = await this.crewFetcher.fetchPages();
    return pages.filter(isCurrentActiveCrew);
  }

  private async buildCrewListAggregate(
    page: Awaited<ReturnType<typeof this.fetchActiveCrewPages>>[number],
    crewId: number,
  ): Promise<CrewListAggregate> {
    const source = await this.crewFetcher.fetchPageSource(page);
    return this.composeCrewListAggregate(source, crewId);
  }

  private composeCrewListAggregate(source: CrewPageSource, crewId: number): CrewListAggregate {
    const generations = extractGenerationNumbers(source.page);

    return {
      // TODO(dummy): Notion 원본 ID -> API crewId 매핑 규칙이 아직 없어서 임시 순번을 사용합니다.
      crewId,
      source,
      joinedGen: generations[0] ?? 0,
      // TODO(dummy): 역할/부서 이력은 아직 별도 원천 데이터 미연동 상태라 repository에서 mock supplement로 채웁니다.
      crewLog: generations.map((generation) => ({
        generation,
        type: 'CREW_ROLE/DUMMY_NOT_FETCHED_YET',
        department: 'DEPARTMENT_TYPE/DUMMY_NOT_FETCHED_YET',
      })),
      // TODO(dummy): 활동 수는 관련 데이터소스 조회 전까지 repository mock supplement 값입니다.
      totalActivities: 0,
      // TODO(dummy): 블로깅 수는 관련 데이터소스 조회 전까지 repository mock supplement 값입니다.
      totalBloggings: 0,
    };
  }

  private async buildCrewDetailAggregate(
    page: Awaited<ReturnType<typeof this.fetchActiveCrewPages>>[number],
    crewId: number,
  ): Promise<CrewDetailAggregate> {
    const detailSource = await this.crewFetcher.fetchDetailSource(page);
    const baseAggregate = this.composeCrewListAggregate(detailSource, crewId);

    return {
      ...baseAggregate,
      crewEmail: extractCrewEmail(page),
      description: detailSource.description,
      // TODO(dummy): 활동 데이터는 아직 별도 activity 데이터소스 연동 전이라 repository mock 값입니다.
      activities: [],
      // TODO(dummy): 블로깅 데이터는 아직 별도 블로그/콘텐츠 연동 전이라 repository mock 값입니다.
      bloggings: [],
      // TODO(dummy): 팔로우 관계 데이터는 아직 별도 소셜/관계 데이터 미연동 상태라 repository mock 값입니다.
      connections: {
        isFollowing: false,
        followers: 0,
        followings: 0,
      },
    };
  }

  private async buildActivityAggregate(
    page: Awaited<ReturnType<typeof this.activityFetcher.fetchPages>>[number],
    activityId: number,
  ): Promise<ActivityAggregate> {
    const source = await this.activityFetcher.fetchPageSource(page);
    return this.composeActivityAggregate(source, activityId);
  }

  private composeActivityAggregate(source: ActivityPageSource, activityId: number): ActivityAggregate {
    const parsed = parseActivityPage(source.page);

    return {
      // TODO(dummy): Notion page id -> API activityId 매핑 규칙이 아직 없어 임시 순번을 사용합니다.
      activityId,
      status: parsed.status,
      startedAt: parsed.startedAt,
      activityType: parsed.activityType,
      participantsCount: parsed.participantsCount,
      activityNames: {
        ko: parsed.koName,
        // TODO(dummy): 영문 activity 이름은 아직 별도 번역/명명 원천 데이터 미연동 상태라 repository mock supplement 값입니다.
        en: `DUMMY_EN_NAME_FOR_${this.sanitizeForMockKey(parsed.koName)}`,
        // TODO(dummy): brief 이름은 아직 별도 약칭 원천 데이터 미연동 상태라 repository mock supplement 값입니다.
        brief: `DUMMY_BRIEF_FOR_${this.sanitizeForMockKey(parsed.koName)}`,
      },
      background: {
        // TODO(dummy): page cover가 없으면 background 이미지는 repository mock supplement URL을 사용합니다.
        url: parsed.backgroundImageUrl ?? 'https://dummy.aolda.local/activities/background-not-fetched-yet.jpg',
        // TODO(dummy): background color는 현재 별도 디자인 메타데이터 미연동 상태라 repository mock supplement 값입니다.
        color: '#000000',
      },
      // TODO(dummy): description은 page 본문 block 미조회 상태라 repository mock supplement 값입니다.
      description: 'DUMMY_ACTIVITY_DESCRIPTION_NOT_FETCHED_YET',
    };
  }

  private sanitizeForMockKey(value: string): string {
    return value.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-가-힣]/g, '').slice(0, 40) || 'UNKNOWN';
  }
}
