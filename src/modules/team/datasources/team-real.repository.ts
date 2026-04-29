import type { Client } from '@notionhq/client';
import type {
  ActivityListResponse,
  CrewDetailResponse,
  CrewListResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  TeamRepository,
} from '../repositories/team.repository';
import { ActivityFetcher } from '../notion/fetchers/activity.fetcher';
import { CrewFetcher } from '../notion/fetchers/crew.fetcher';
import { ProjectFetcher } from '../notion/fetchers/project.fetcher';
import { mapActivityPages } from '../notion/mappers/activity.mapper';
import { mapCrewDetail, mapCrewPages } from '../notion/mappers/crew.mapper';
import { mapProjectPages } from '../notion/mappers/project.mapper';

interface TeamRealDbConfig {
  notionClient: Client;
  notionTeamDbIds: { crew?: string; activity?: string; project?: string };
}

export class TeamRealRepository implements TeamRepository {
  private readonly crewFetcher: CrewFetcher;
  private readonly activityFetcher: ActivityFetcher;
  private readonly projectFetcher: ProjectFetcher;

  constructor({ notionClient, notionTeamDbIds }: TeamRealDbConfig) {
    if (!notionTeamDbIds.crew) throw new Error('NOTION_TEAM_DB_IDS must include crew:<id>');
    if (!notionTeamDbIds.activity) throw new Error('NOTION_TEAM_DB_IDS must include activity:<id>');
    if (!notionTeamDbIds.project) throw new Error('NOTION_TEAM_DB_IDS must include project:<id>');

    this.crewFetcher = new CrewFetcher(notionClient, notionTeamDbIds.crew);
    this.activityFetcher = new ActivityFetcher(notionClient, notionTeamDbIds.activity);
    this.projectFetcher = new ProjectFetcher(notionClient, notionTeamDbIds.project);
  }

  async getCrewList(): Promise<CrewListResponse> {
    const pages = await this.crewFetcher.fetchAll();
    return mapCrewPages(pages);
  }

  async getActivityList(): Promise<ActivityListResponse> {
    const pages = await this.activityFetcher.fetchAll();
    return mapActivityPages(pages);
  }

  async getCrewDetail(crewId: string): Promise<CrewDetailResponse> {
    const detail = await this.crewFetcher.fetchDetail(crewId);
    return mapCrewDetail(detail);
  }

  async getProjectList(): Promise<ProjectListResponse> {
    // 프로젝트 목록은 activity 원천 데이터 중 ACTIVITY_TYPE/PROJECT만 필터링해 구성합니다.
    const pages = await this.activityFetcher.fetchAll();
    return mapProjectPages(pages);
  }

  async getProjectDetail(_projectId: string): Promise<ProjectDetailResponse> {
    // TODO: 단건 조회 — Notion DB filter 또는 Prisma 쿼리로 구현 예정
    throw new Error('Not implemented: TeamRealRepository.getProjectDetail');
  }
}
