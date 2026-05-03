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
  extractCrewTeamName,
  extractCrewEmail,
  extractGenerationNumbers,
  extractProfileAccountIds,
  extractCrewWritingTerm,
  isCurrentActiveCrew,
} from '../notion/extractors/crew-page.extractor';
import { CrewGenerationMappingFetcher } from '../notion/fetchers/crew-generation-mapping.fetcher';
import { ActivityFetcher } from '../notion/fetchers/activity.fetcher';
import { CrewFetcher } from '../notion/fetchers/crew.fetcher';
import { CrewRoleLookupFetcher } from '../notion/fetchers/crew-role-lookup.fetcher';
import { parseActivityPage } from '../notion/parsers/activity-page.parser';
import { parseCrewGenerationMappingPage } from '../notion/parsers/crew-generation-mapping-page.parser';
import {
  parseCrewRoleLookupPage,
  type ParsedCrewRoleLookupPage,
} from '../notion/parsers/crew-role-lookup-page.parser';
import type { ActivityAggregate } from '../notion/types/activity-aggregate';
import type { ActivityPageSource } from '../notion/types/activity-source';
import type { CrewPageSource } from '../notion/types/crew-source';

const DEFAULT_CREW_ROLE_LOOKUP_DATA_SOURCE_ID = '353a7bac-f955-8048-8e4d-000bdec7a591';
const DEFAULT_CREW_GENERATION_MAPPING_DATA_SOURCE_ID = '355a7bac-f955-80da-b748-000b2233c7dd';
const GENERAL_MEMBER_ROLE = 'CREW_ROLE/CREW';
const UNKNOWN_CREW_TEAM = 'DUMMY_TEAM_NOT_FETCHED_YET';

interface TeamRealDbConfig {
  notionClient: Client;
  notionTeamDbIds: { crew?: string; activity?: string; project?: string; crewRoleLookup?: string };
}

export class TeamRealRepository implements TeamRepository {
  private readonly crewFetcher: CrewFetcher;
  private readonly activityFetcher: ActivityFetcher;
  private readonly crewRoleLookupFetcher: CrewRoleLookupFetcher;
  private readonly crewGenerationMappingFetcher: CrewGenerationMappingFetcher;

  constructor({ notionClient, notionTeamDbIds }: TeamRealDbConfig) {
    if (!notionTeamDbIds.crew) throw new Error('NOTION_TEAM_DB_IDS must include crew:<id>');
    if (!notionTeamDbIds.activity) throw new Error('NOTION_TEAM_DB_IDS must include activity:<id>');

    this.crewFetcher = new CrewFetcher(notionClient, notionTeamDbIds.crew);
    this.activityFetcher = new ActivityFetcher(notionClient, notionTeamDbIds.activity);
    this.crewRoleLookupFetcher = new CrewRoleLookupFetcher(
      notionClient,
      notionTeamDbIds.crewRoleLookup ?? DEFAULT_CREW_ROLE_LOOKUP_DATA_SOURCE_ID,
    );
    this.crewGenerationMappingFetcher = new CrewGenerationMappingFetcher(
      notionClient,
      DEFAULT_CREW_GENERATION_MAPPING_DATA_SOURCE_ID,
    );
  }

  async getCrewList(): Promise<CrewListResponse> {
    const [crewPages, crewRoleLookupMap, activityTermGenerationMap] = await Promise.all([
      this.crewFetcher.fetchPages(),
      this.fetchCrewRoleLookupMap(),
      this.fetchActivityTermGenerationMap(),
    ]);
    const activePages = crewPages.filter(isCurrentActiveCrew);
    const crewTeamHistoryMap = this.buildCrewTeamHistoryMap(crewPages, activityTermGenerationMap);
    const crewAggregates = await Promise.all(
      activePages.map((page, index) =>
        this.buildCrewListAggregate(page, index + 1, crewRoleLookupMap, crewTeamHistoryMap),
      ),
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
    const [crewPages, crewRoleLookupMap, activityTermGenerationMap] = await Promise.all([
      this.crewFetcher.fetchPages(),
      this.fetchCrewRoleLookupMap(),
      this.fetchActivityTermGenerationMap(),
    ]);
    const activePages = crewPages.filter(isCurrentActiveCrew);
    const crewTeamHistoryMap = this.buildCrewTeamHistoryMap(crewPages, activityTermGenerationMap);
    const targetIndex = Number(crewId) - 1;
    const targetPage = activePages[targetIndex];

    if (!targetPage) {
      throw new Error(`Crew not found: ${crewId}`);
    }

    const detailAggregate = await this.buildCrewDetailAggregate(
      targetPage,
      targetIndex + 1,
      crewRoleLookupMap,
      crewTeamHistoryMap,
    );
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

  private async buildCrewListAggregate(
    page: Awaited<ReturnType<typeof this.crewFetcher.fetchPages>>[number],
    crewId: number,
    crewRoleLookupMap: Map<string, ParsedCrewRoleLookupPage[]>,
    crewTeamHistoryMap: Map<string, Map<number, string>>,
  ): Promise<CrewListAggregate> {
    const source = await this.crewFetcher.fetchPageSource(page);
    return this.composeCrewListAggregate(source, crewId, crewRoleLookupMap, crewTeamHistoryMap);
  }

  private composeCrewListAggregate(
    source: CrewPageSource,
    crewId: number,
    crewRoleLookupMap: Map<string, ParsedCrewRoleLookupPage[]>,
    crewTeamHistoryMap: Map<string, Map<number, string>>,
  ): CrewListAggregate {
    const generations = extractGenerationNumbers(source.page);
    const joinedGen = generations[0] ?? 0;
    const profileAccountIds = extractProfileAccountIds(source.page);

    return {
      // TODO(dummy): Notion 원본 ID -> API crewId 매핑 규칙이 아직 없어서 임시 순번을 사용합니다.
      crewId,
      source,
      joinedGen,
      crewLog: this.buildCrewLog(
        generations,
        joinedGen,
        profileAccountIds,
        crewRoleLookupMap,
        crewTeamHistoryMap,
      ),
      // TODO(dummy): 활동 수는 관련 데이터소스 조회 전까지 repository mock supplement 값입니다.
      totalActivities: 0,
      // TODO(dummy): 블로깅 수는 관련 데이터소스 조회 전까지 repository mock supplement 값입니다.
      totalBloggings: 0,
    };
  }

  private async buildCrewDetailAggregate(
    page: Awaited<ReturnType<typeof this.crewFetcher.fetchPages>>[number],
    crewId: number,
    crewRoleLookupMap: Map<string, ParsedCrewRoleLookupPage[]>,
    crewTeamHistoryMap: Map<string, Map<number, string>>,
  ): Promise<CrewDetailAggregate> {
    const detailSource = await this.crewFetcher.fetchDetailSource(page);
    const baseAggregate = this.composeCrewListAggregate(
      detailSource,
      crewId,
      crewRoleLookupMap,
      crewTeamHistoryMap,
    );

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

  private async fetchCrewRoleLookupMap(): Promise<Map<string, ParsedCrewRoleLookupPage[]>> {
    const pages = await this.crewRoleLookupFetcher.fetchPages();
    const lookupMap = new Map<string, ParsedCrewRoleLookupPage[]>();

    for (const page of pages) {
      const parsed = parseCrewRoleLookupPage(page);
      for (const personId of parsed.personIds) {
        const current = lookupMap.get(personId) ?? [];
        current.push(parsed);
        lookupMap.set(personId, current);
      }
    }

    return lookupMap;
  }

  private async fetchActivityTermGenerationMap(): Promise<Map<string, number>> {
    const pages = await this.crewGenerationMappingFetcher.fetchPages();
    const activityTermGenerationMap = new Map<string, number>();

    for (const page of pages) {
      const parsed = parseCrewGenerationMappingPage(page);
      if (!parsed.activityTerm || parsed.generation === null) {
        continue;
      }

      activityTermGenerationMap.set(parsed.activityTerm, parsed.generation);
    }

    return activityTermGenerationMap;
  }

  private buildCrewTeamHistoryMap(
    crewPages: Awaited<ReturnType<typeof this.crewFetcher.fetchPages>>,
    activityTermGenerationMap: Map<string, number>,
  ): Map<string, Map<number, string>> {
    const crewTeamHistoryMap = new Map<string, Map<number, string>>();

    for (const page of crewPages) {
      const activityTerm = extractCrewWritingTerm(page);
      const generation = activityTerm ? activityTermGenerationMap.get(activityTerm) : undefined;
      const teamName = extractCrewTeamName(page);

      if (generation === undefined || !teamName) {
        continue;
      }

      for (const profileAccountId of extractProfileAccountIds(page)) {
        const history = crewTeamHistoryMap.get(profileAccountId) ?? new Map<number, string>();
        history.set(generation, teamName);
        crewTeamHistoryMap.set(profileAccountId, history);
      }
    }

    return crewTeamHistoryMap;
  }

  private buildCrewLog(
    crewGenerations: number[],
    joinedGen: number,
    profileAccountIds: string[],
    crewRoleLookupMap: Map<string, ParsedCrewRoleLookupPage[]>,
    crewTeamHistoryMap: Map<string, Map<number, string>>,
  ): CrewListAggregate['crewLog'] {
    // 입회 기수 이전의 임원 이력은 현재 crew page 기준 이력으로 간주하지 않습니다.
    // 임원 lookup 매핑은 계정(프로필) people 필드의 Notion user id를 기준으로 조회합니다.
    // department는 Crew Book의 작성기수 -> 실제 기수 매핑을 거친 뒤, 명세 enum으로 변환합니다.
    // lookup에 존재하는 기수는 임원 이력으로 대체하고, 나머지 기수만 일반 활동회원 이력으로 보완합니다.
    const executiveRecordsByGeneration = new Map<number, CrewListAggregate['crewLog'][number]>();
    const crewTeamByGeneration = this.buildCrewTeamByGeneration(profileAccountIds, crewTeamHistoryMap);

    profileAccountIds
      .flatMap((profileAccountId) => crewRoleLookupMap.get(profileAccountId) ?? [])
      .filter((record) => record.generation !== null && record.generation >= joinedGen)
      .forEach((record) => {
        const generation = record.generation as number;
        executiveRecordsByGeneration.set(record.generation as number, {
          generation,
          type: this.mapExecutiveRole(record.rawRole),
          department: this.mapDepartmentType(crewTeamByGeneration.get(generation), true),
        });
      });

    const uniqueExecutiveRecords = Array.from(executiveRecordsByGeneration.values());
    const executiveGenerations = new Set(uniqueExecutiveRecords.map((record) => record.generation));
    const memberRecords = crewGenerations
      .filter((generation) => !executiveGenerations.has(generation))
      .map((generation) => ({
        generation,
        type: GENERAL_MEMBER_ROLE,
        department: this.mapDepartmentType(crewTeamByGeneration.get(generation), false),
      }));

    return [...uniqueExecutiveRecords, ...memberRecords].sort(
      (left, right) => left.generation - right.generation,
    );
  }

  private buildCrewTeamByGeneration(
    profileAccountIds: string[],
    crewTeamHistoryMap: Map<string, Map<number, string>>,
  ): Map<number, string> {
    const crewTeamByGeneration = new Map<number, string>();

    for (const profileAccountId of profileAccountIds) {
      const history = crewTeamHistoryMap.get(profileAccountId);
      if (!history) {
        continue;
      }

      for (const [generation, teamName] of history.entries()) {
        crewTeamByGeneration.set(generation, teamName);
      }
    }

    return crewTeamByGeneration;
  }

  private mapExecutiveRole(rawRole: string | null): string {
    switch (rawRole) {
      case '회장':
        return 'CREW_ROLE/P';
      case '부회장':
        return 'CREW_ROLE/VP';
      case '총무':
        return 'CREW_ROLE/EA';
      default:
        return GENERAL_MEMBER_ROLE;
    }
  }

  private mapDepartmentType(teamName: string | undefined, isExecutive: boolean): string {
    if (isExecutive) {
      return 'DEPARTMENT_TYPE/CLEVEL';
    }

    switch (teamName) {
      case '개발팀':
        return 'DEPARTMENT_TYPE/DEV';
      case '인프라개발팀':
        return 'DEPARTMENT_TYPE/INFRA_DEV';
      case '인프라팀':
        return 'DEPARTMENT_TYPE/INFRA';
      case '운영지원팀':
        return 'DEPARTMENT_TYPE/GA';
      case '디자인팀':
        return 'DEPARTMENT_TYPE/DESIGN';
      default:
        return UNKNOWN_CREW_TEAM;
    }
  }
}
