import {
  ACTIVITY_LIST_EXAMPLE,
  CREW_DETAIL_EXAMPLE,
  CREW_LIST_EXAMPLE,
  PROJECT_DETAIL_EXAMPLE,
  PROJECT_LIST_EXAMPLE,
} from '../../../constants/team';
import {
  ActivityListResponse,
  CrewDetailResponse,
  CrewListResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  TeamRepository,
} from '../repositories/team.repository';

export class TeamPrismaRepository implements TeamRepository {
  // TODO: Prisma Client를 주입받아 실제 Team/Project 조회 쿼리를 구현하세요.
  // 현재는 잠수함 패치를 위해 기존 응답과 동일한 더미 값을 반환합니다.

  async getCrewList(): Promise<CrewListResponse> {
    return CREW_LIST_EXAMPLE;
  }

  async getActivityList(): Promise<ActivityListResponse> {
    return ACTIVITY_LIST_EXAMPLE;
  }

  async getCrewDetail(_crewId: string): Promise<CrewDetailResponse> {
    return CREW_DETAIL_EXAMPLE;
  }

  async getProjectList(): Promise<ProjectListResponse> {
    return PROJECT_LIST_EXAMPLE;
  }

  async getProjectDetail(_projectId: string): Promise<ProjectDetailResponse> {
    return PROJECT_DETAIL_EXAMPLE;
  }
}
