import type { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type {
  ActivityMetadataResponse,
  ActivityListResponse,
  CrewDetailResponse,
  CrewListResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  TeamCrewTypeKeysResponse,
  TeamDepartmentKeysResponse,
  TeamRepository,
  UpdateActivityMetadataInput,
} from '../repositories/team.repository';
import { TEAM_CREW_TYPE_KEYS_EXAMPLE, TEAM_DEPARTMENT_KEYS_EXAMPLE } from '../../../constants/team';
import { assembleActivityListResponse } from '../notion/assemblers/activity-response.assembler';
import {
  type CrewDetailAggregate,
  type CrewListAggregate,
  assembleCrewDetailResponse,
  assembleCrewListResponse,
} from '../notion/assemblers/crew-response.assembler';
import { assembleProjectListResponse } from '../notion/assemblers/project-response.assembler';
import {
  extractCrewName,
  extractCrewTeamName,
  extractCrewEmail,
  extractGenerationNumbers,
  extractProfileAccountIds,
  extractCrewWritingTerm,
  isCurrentActiveCrew,
} from '../notion/extractors/crew-page.extractor';
import { CrewGenerationMappingFetcher } from '../notion/fetchers/crew-generation-mapping.fetcher';
import { CrewProfileFetcher } from '../notion/fetchers/crew-profile.fetcher';
import { ActivityFetcher } from '../notion/fetchers/activity.fetcher';
import { CrewFetcher } from '../notion/fetchers/crew.fetcher';
import {
  CrewProfileImageCacheRepository,
  type CrewProfileImageCacheRecord,
} from './crew-profile-image-cache.repository';
import {
  TeamActivityMetadataRepository,
  type TeamActivityMetadataRecord,
  type TeamActivityMetadataUpsertInput,
} from './team-activity-metadata.repository';
import { CrewRoleLookupFetcher } from '../notion/fetchers/crew-role-lookup.fetcher';
import { parseActivityMetadataSeed } from '../notion/parsers/activity-metadata-seed.parser';
import { parseActivityPage } from '../notion/parsers/activity-page.parser';
import { parseCrewGenerationMappingPage } from '../notion/parsers/crew-generation-mapping-page.parser';
import {
  parseCrewProfilePage,
  type ParsedCrewProfilePage,
} from '../notion/parsers/crew-profile-page.parser';
import {
  parseCrewRoleLookupPage,
  type ParsedCrewRoleLookupPage,
} from '../notion/parsers/crew-role-lookup-page.parser';
import type { ActivityAggregate } from '../notion/types/activity-aggregate';
import type { ActivityPageSource } from '../notion/types/activity-source';
import type { CrewPageSource } from '../notion/types/crew-source';
import { CREW_DEPARTMENT_KEY_VALUES, CREW_TYPE_KEY_VALUES } from '../constants/crew-log-keys';

const DEFAULT_CREW_ROLE_LOOKUP_DATA_SOURCE_ID = '353a7bac-f955-8048-8e4d-000bdec7a591';
const DEFAULT_CREW_GENERATION_MAPPING_DATA_SOURCE_ID = '355a7bac-f955-80da-b748-000b2233c7dd';
const DEFAULT_CREW_PROFILE_DATA_SOURCE_ID = '31fa7bac-f955-807d-a7af-000b8a0ab07f';
const DEFAULT_STUDY_DATA_SOURCE_ID = '457a7bac-f955-822a-9359-0706ae009fca';
const GENERAL_MEMBER_ROLE = 'CREW_ROLE/CREW';
const UNKNOWN_CREW_TEAM = 'DUMMY_TEAM_NOT_FETCHED_YET';
const PROFILE_IMAGE_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

interface CrewProfileSupplement {
  univDepartment: string | null;
  univJoinedYear: string | null;
}

interface ActivityTermGenerationContext {
  generationMap: Map<string, number>;
  currentActivityTerm: string;
}

interface TeamRealDbConfig {
  notionClient: Client;
  notionTeamDbIds: {
    crew?: string;
    activity?: string;
    study?: string;
    project?: string;
    crewRoleLookup?: string;
    crewProfile?: string;
  };
  crewProfileImageCacheRepository?: CrewProfileImageCacheRepository;
  teamActivityMetadataRepository?: TeamActivityMetadataRepository;
}

export class TeamRealRepository implements TeamRepository {
  private readonly crewFetcher: CrewFetcher;
  private readonly activityFetcher: ActivityFetcher;
  private readonly studyFetcher: ActivityFetcher;
  private readonly crewRoleLookupFetcher: CrewRoleLookupFetcher;
  private readonly crewGenerationMappingFetcher: CrewGenerationMappingFetcher;
  private readonly crewProfileFetcher: CrewProfileFetcher;
  private readonly crewProfileImageCacheRepository?: CrewProfileImageCacheRepository;
  private readonly teamActivityMetadataRepository?: TeamActivityMetadataRepository;

  constructor({
    notionClient,
    notionTeamDbIds,
    crewProfileImageCacheRepository,
    teamActivityMetadataRepository,
  }: TeamRealDbConfig) {
    if (!notionTeamDbIds.crew) throw new Error('NOTION_TEAM_DB_IDS must include crew:<id>');
    if (!notionTeamDbIds.activity) throw new Error('NOTION_TEAM_DB_IDS must include activity:<id>');

    this.crewFetcher = new CrewFetcher(notionClient, notionTeamDbIds.crew);
    this.activityFetcher = new ActivityFetcher(notionClient, notionTeamDbIds.activity);
    this.studyFetcher = new ActivityFetcher(
      notionClient,
      notionTeamDbIds.study ?? DEFAULT_STUDY_DATA_SOURCE_ID,
    );
    this.crewRoleLookupFetcher = new CrewRoleLookupFetcher(
      notionClient,
      notionTeamDbIds.crewRoleLookup ?? DEFAULT_CREW_ROLE_LOOKUP_DATA_SOURCE_ID,
    );
    this.crewGenerationMappingFetcher = new CrewGenerationMappingFetcher(
      notionClient,
      DEFAULT_CREW_GENERATION_MAPPING_DATA_SOURCE_ID,
    );
    this.crewProfileFetcher = new CrewProfileFetcher(
      notionClient,
      notionTeamDbIds.crewProfile ?? DEFAULT_CREW_PROFILE_DATA_SOURCE_ID,
    );
    this.crewProfileImageCacheRepository = crewProfileImageCacheRepository;
    this.teamActivityMetadataRepository = teamActivityMetadataRepository;
  }

  async getCrewList(): Promise<CrewListResponse> {
    const [crewPages, crewRoleLookupMap, activityTermGenerationContext, crewProfileMap] =
      await Promise.all([
        this.crewFetcher.fetchPages(),
        this.fetchCrewRoleLookupMap(),
        this.fetchActivityTermGenerationContext(),
        this.fetchCrewProfileMap(),
      ]);
    const activePages = crewPages.filter((page) =>
      isCurrentActiveCrew(page, activityTermGenerationContext.currentActivityTerm),
    );
    const crewTeamHistoryMap = this.buildCrewTeamHistoryMap(
      crewPages,
      activityTermGenerationContext.generationMap,
    );
    const profileImageUrlMap = await this.resolveCrewProfileImageUrlMap(activePages);
    const crewAggregates = await Promise.all(
      activePages.map((page, index) =>
        this.buildCrewListAggregate(
          page,
          index + 1,
          crewRoleLookupMap,
          crewTeamHistoryMap,
          true,
          profileImageUrlMap.get(page.id),
          this.resolveCrewProfileSupplement(page, crewProfileMap),
        ),
      ),
    );

    return assembleCrewListResponse(crewAggregates);
  }

  async getActivityList(): Promise<ActivityListResponse> {
    const activityAggregates = await this.fetchMergedActivityAggregates();

    return assembleActivityListResponse(activityAggregates);
  }

  async updateActivityMetadata(
    activityId: string,
    input: UpdateActivityMetadataInput,
  ): Promise<ActivityMetadataResponse> {
    if (!this.teamActivityMetadataRepository) {
      throw new Error('DATABASE_URL must be set to update activity metadata');
    }

    const numericActivityId = Number(activityId);
    if (!Number.isInteger(numericActivityId) || numericActivityId <= 0) {
      throw new Error(`Invalid activity id: ${activityId}`);
    }

    const updated = await this.teamActivityMetadataRepository.updateMetadataByActivityId(
      numericActivityId,
      input,
    );

    if (!updated) {
      throw new Error(`Activity metadata not found: ${activityId}`);
    }

    return this.toActivityMetadataResponse(updated);
  }

  async getCrewDetail(crewId: string): Promise<CrewDetailResponse> {
    const [crewPages, crewRoleLookupMap, activityTermGenerationContext, crewProfileMap] =
      await Promise.all([
        this.crewFetcher.fetchPages(),
        this.fetchCrewRoleLookupMap(),
        this.fetchActivityTermGenerationContext(),
        this.fetchCrewProfileMap(),
      ]);
    const activePages = crewPages.filter((page) =>
      isCurrentActiveCrew(page, activityTermGenerationContext.currentActivityTerm),
    );
    const crewTeamHistoryMap = this.buildCrewTeamHistoryMap(
      crewPages,
      activityTermGenerationContext.generationMap,
    );
    const profileImageUrlMap = await this.resolveCrewProfileImageUrlMap(activePages);
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
      true,
      profileImageUrlMap.get(targetPage.id),
      this.resolveCrewProfileSupplement(targetPage, crewProfileMap),
    );
    return assembleCrewDetailResponse(detailAggregate);
  }

  async getDepartmentKeys(): Promise<TeamDepartmentKeysResponse> {
    return {
      ...TEAM_DEPARTMENT_KEYS_EXAMPLE,
      data: { ...CREW_DEPARTMENT_KEY_VALUES },
    };
  }

  async getCrewTypeKeys(): Promise<TeamCrewTypeKeysResponse> {
    return {
      ...TEAM_CREW_TYPE_KEYS_EXAMPLE,
      data: { ...CREW_TYPE_KEY_VALUES },
    };
  }

  async syncCrewProfileImageCache(): Promise<number> {
    if (!this.crewProfileImageCacheRepository) {
      return 0;
    }

    const records = await this.buildAllCrewProfileImageCacheRecords();
    await this.crewProfileImageCacheRepository.upsertMany(records);
    return records.length;
  }

  async getProjectList(): Promise<ProjectListResponse> {
    // 프로젝트 목록은 별도 project 데이터소스가 아니라 activity/study 원천 데이터 병합 결과에서 파생합니다.
    const activityAggregates = await this.fetchMergedActivityAggregates();
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
    isActive: boolean,
    profileImageUrl?: string | null,
    profileSupplement?: CrewProfileSupplement,
  ): Promise<CrewListAggregate> {
    const source = await this.crewFetcher.fetchPageSource(page, profileImageUrl);
    return this.composeCrewListAggregate(
      source,
      crewId,
      crewRoleLookupMap,
      crewTeamHistoryMap,
      isActive,
      profileSupplement,
    );
  }

  private composeCrewListAggregate(
    source: CrewPageSource,
    crewId: number,
    crewRoleLookupMap: Map<string, ParsedCrewRoleLookupPage[]>,
    crewTeamHistoryMap: Map<string, Map<number, string>>,
    isActive: boolean,
    profileSupplement?: CrewProfileSupplement,
  ): CrewListAggregate {
    const generations = extractGenerationNumbers(source.page);
    const joinedGen = generations[0] ?? 0;
    const profileAccountIds = extractProfileAccountIds(source.page);

    return {
      // TODO(dummy): Notion 원본 ID -> API crewId 매핑 규칙이 아직 없어서 임시 순번을 사용합니다.
      crewId,
      source,
      isActive,
      joinedGen,
      profileSupplement,
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
    isActive: boolean,
    profileImageUrl?: string | null,
    profileSupplement?: CrewProfileSupplement,
  ): Promise<CrewDetailAggregate> {
    const detailSource = await this.crewFetcher.fetchDetailSource(page, profileImageUrl);
    const baseAggregate = this.composeCrewListAggregate(
      detailSource,
      crewId,
      crewRoleLookupMap,
      crewTeamHistoryMap,
      isActive,
      profileSupplement,
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
    fetcher: ActivityFetcher = this.activityFetcher,
    metadata?: TeamActivityMetadataRecord,
  ): Promise<ActivityAggregate> {
    const source = await fetcher.fetchPageSource(page);
    return this.composeActivityAggregate(source, activityId, metadata);
  }

  private async fetchMergedActivityAggregates(): Promise<ActivityAggregate[]> {
    const livePages = await this.fetchLiveActivityPages();

    if (!this.teamActivityMetadataRepository) {
      return Promise.all(
        livePages.map(({ page, fetcher }, index) =>
          this.buildActivityAggregate(page, index + 1, fetcher),
        ),
      );
    }

    const metadataMap = await this.syncAndLoadActivityMetadata(livePages);
    const visibleLivePages = livePages.filter(({ page }) => metadataMap.get(page.id)?.isVisible);

    return Promise.all(
      visibleLivePages.map(({ page, fetcher }) => {
        const metadata = metadataMap.get(page.id);
        if (!metadata) {
          throw new Error(`Activity metadata not found for notion page ${page.id}`);
        }

        return this.buildActivityAggregate(page, metadata.id, fetcher, metadata);
      }),
    );
  }

  private composeActivityAggregate(
    source: ActivityPageSource,
    activityId: number,
    metadata?: TeamActivityMetadataRecord,
  ): ActivityAggregate {
    const parsed = parseActivityPage(source.page);

    return {
      // TODO(dummy): Notion page id -> API activityId 매핑 규칙이 아직 없어 임시 순번을 사용합니다.
      activityId,
      status: parsed.status,
      startedAt: parsed.startedAt,
      activityType: parsed.activityType,
      participantsCount: parsed.participantsCount,
      activityNames: {
        ko: metadata?.koName ?? parsed.koName,
        // TODO(dummy): DB 메타데이터 저장소가 없을 때만 영문 activity 이름을 임시 더미로 노출합니다.
        en: metadata
          ? metadata.enName
          : `DUMMY_EN_NAME_FOR_${this.sanitizeForMockKey(parsed.koName)}`,
        // TODO(dummy): DB 메타데이터 저장소가 없을 때만 brief 이름을 임시 더미로 노출합니다.
        brief: metadata
          ? metadata.briefName
          : `DUMMY_BRIEF_FOR_${this.sanitizeForMockKey(parsed.koName)}`,
      },
      background: {
        // TODO(dummy): page cover가 없으면 background 이미지는 repository mock supplement URL을 사용합니다.
        url: parsed.backgroundImageUrl ?? 'https://dummy.aolda.local/activities/background-not-fetched-yet.jpg',
        // TODO(dummy): background color는 현재 별도 디자인 메타데이터 미연동 상태라 repository mock supplement 값입니다.
        color: '#000000',
      },
      // TODO(dummy): DB 메타데이터 저장소가 없을 때만 description 더미를 사용합니다.
      description: metadata ? metadata.description : 'DUMMY_ACTIVITY_DESCRIPTION_NOT_FETCHED_YET',
    };
  }

  private async fetchLiveActivityPages(): Promise<Array<{ page: PageObjectResponse; fetcher: ActivityFetcher }>> {
    const [projectPages, studyPages] = await Promise.all([
      this.activityFetcher.fetchPages(),
      this.studyFetcher.fetchPages(),
    ]);

    return [
      ...projectPages.map((page) => ({ page, fetcher: this.activityFetcher })),
      ...studyPages.map((page) => ({ page, fetcher: this.studyFetcher })),
    ];
  }

  private async syncAndLoadActivityMetadata(
    livePages: Array<{ page: PageObjectResponse; fetcher: ActivityFetcher }>,
  ): Promise<Map<string, TeamActivityMetadataRecord>> {
    if (!this.teamActivityMetadataRepository) {
      return new Map();
    }

    const notionPageIds = livePages.map(({ page }) => page.id);
    const existingMap = await this.teamActivityMetadataRepository.findManyByNotionPageIds(notionPageIds);
    const lastSeenAt = new Date();
    const records = livePages.map(({ page }) =>
      this.buildActivityMetadataRecord(page, existingMap.get(page.id), lastSeenAt),
    );

    await this.teamActivityMetadataRepository.upsertMany(records);
    await this.teamActivityMetadataRepository.markInvisibleByMissingNotionPageIds(notionPageIds);

    return this.teamActivityMetadataRepository.findManyByNotionPageIds(notionPageIds);
  }

  private buildActivityMetadataRecord(
    page: PageObjectResponse,
    existing: TeamActivityMetadataRecord | undefined,
    lastSeenAt: Date,
  ): TeamActivityMetadataUpsertInput {
    const parsed = parseActivityPage(page);
    const seeded = parseActivityMetadataSeed(page, parsed.activityType);

    return {
      notionPageId: page.id,
      sourceType: parsed.activityType,
      koName: existing ? existing.koName : seeded.koName,
      enName: existing ? existing.enName : seeded.enName,
      briefName: existing ? existing.briefName : seeded.briefName,
      description: existing ? existing.description : null,
      isVisible: true,
      lastSeenAt,
    };
  }

  private toActivityMetadataResponse(
    metadata: TeamActivityMetadataRecord,
  ): ActivityMetadataResponse {
    return {
      activityId: metadata.id,
      activityNames: {
        ko: metadata.koName,
        en: metadata.enName,
        brief: metadata.briefName,
      },
      description: metadata.description,
      isVisible: metadata.isVisible,
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

  private async fetchActivityTermGenerationContext(): Promise<ActivityTermGenerationContext> {
    const pages = await this.crewGenerationMappingFetcher.fetchPages();
    const activityTermGenerationMap = new Map<string, number>();
    let currentActivityTerm: string | null = null;

    for (const page of pages) {
      const parsed = parseCrewGenerationMappingPage(page);
      if (parsed.status === '현재기수' && parsed.activityTerm) {
        currentActivityTerm = parsed.activityTerm;
      }

      if (!parsed.activityTerm || parsed.generation === null) {
        continue;
      }

      activityTermGenerationMap.set(parsed.activityTerm, parsed.generation);
    }

    if (!currentActivityTerm) {
      throw new Error('Current activity term not found in crew generation mapping datasource');
    }

    return {
      generationMap: activityTermGenerationMap,
      currentActivityTerm,
    };
  }

  private async fetchCrewProfileMap(): Promise<Map<string, CrewProfileSupplement>> {
    const pages = await this.crewProfileFetcher.fetchPages();
    const crewProfileMap = new Map<string, CrewProfileSupplement>();

    for (const page of pages) {
      const parsed = parseCrewProfilePage(page);
      const supplement = this.toCrewProfileSupplement(parsed);

      for (const key of this.buildCrewProfileKeys(parsed)) {
        crewProfileMap.set(key, supplement);
      }
    }

    return crewProfileMap;
  }

  private resolveCrewProfileSupplement(
    page: PageObjectResponse,
    crewProfileMap: Map<string, CrewProfileSupplement>,
  ): CrewProfileSupplement | undefined {
    for (const profileAccountId of extractProfileAccountIds(page)) {
      const supplement = crewProfileMap.get(this.toCrewProfileKey('person', profileAccountId));
      if (supplement) {
        return supplement;
      }
    }

    const email = extractCrewEmail(page);
    if (!email.includes('dummy-email-not-fetched-yet')) {
      const supplement = crewProfileMap.get(this.toCrewProfileKey('email', email));
      if (supplement) {
        return supplement;
      }
    }

    const name = extractCrewName(page);
    if (name !== 'UNKNOWN_CREW_NAME') {
      return crewProfileMap.get(this.toCrewProfileKey('name', name));
    }

    return undefined;
  }

  private toCrewProfileSupplement(parsed: ParsedCrewProfilePage): CrewProfileSupplement {
    return {
      univDepartment: parsed.univDepartment,
      univJoinedYear: parsed.univJoinedYear,
    };
  }

  private buildCrewProfileKeys(parsed: ParsedCrewProfilePage): string[] {
    const keys = parsed.personIds.map((personId) => this.toCrewProfileKey('person', personId));

    if (parsed.email) {
      keys.push(this.toCrewProfileKey('email', parsed.email));
    }

    if (parsed.name) {
      keys.push(this.toCrewProfileKey('name', parsed.name));
    }

    return keys;
  }

  private toCrewProfileKey(type: 'person' | 'email' | 'name', value: string): string {
    return `${type}:${value.trim().toLowerCase()}`;
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

  private async resolveCrewProfileImageUrlMap(
    pages: PageObjectResponse[],
  ): Promise<Map<string, string | null>> {
    if (!this.crewProfileImageCacheRepository || pages.length === 0) {
      return new Map();
    }

    const cachedMap = await this.crewProfileImageCacheRepository.findManyByPageIds(
      pages.map((page) => page.id),
    );
    const staleBefore = new Date(Date.now() - PROFILE_IMAGE_CACHE_TTL_MS);
    const profileImageUrlMap = new Map<string, string | null>();
    const pagesToRefresh = pages.filter((page) => {
      const cached = cachedMap.get(page.id);

      if (cached && cached.lastSyncedAt >= staleBefore) {
        profileImageUrlMap.set(page.id, cached.imageUrl);
        return false;
      }

      return true;
    });

    if (pagesToRefresh.length === 0) {
      return profileImageUrlMap;
    }

    const refreshedRecords = await this.fetchCrewProfileImageCacheRecords(pagesToRefresh);
    await this.crewProfileImageCacheRepository.upsertMany(refreshedRecords);

    for (const record of refreshedRecords) {
      profileImageUrlMap.set(record.notionPageId, record.imageUrl);
    }

    return profileImageUrlMap;
  }

  async buildAllCrewProfileImageCacheRecords(): Promise<CrewProfileImageCacheRecord[]> {
    const pages = await this.crewFetcher.fetchPages();
    return this.fetchCrewProfileImageCacheRecords(pages);
  }

  private async fetchCrewProfileImageCacheRecords(
    pages: Array<Pick<PageObjectResponse, 'id'>>,
  ): Promise<CrewProfileImageCacheRecord[]> {
    const lastSyncedAt = new Date();
    const records: CrewProfileImageCacheRecord[] = [];

    for (const page of pages) {
      const imageUrl = await this.crewFetcher.fetchProfileImageUrl(page.id);
      records.push({
        notionPageId: page.id,
        imageUrl,
        lastSyncedAt,
      });
    }

    return records;
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
