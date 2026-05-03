import {
  ACTIVITY_LIST_EXAMPLE,
  CREW_DETAIL_EXAMPLE,
  CREW_LIST_EXAMPLE,
  PROJECT_DETAIL_EXAMPLE,
  PROJECT_LIST_EXAMPLE,
  TEAM_DEPARTMENT_KEYS_EXAMPLE,
} from '../../../constants/team';
import {
  ActivityListResponse,
  CrewDetailResponse,
  CrewListResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  TeamDepartmentKeysResponse,
  TeamRepository,
} from '../repositories/team.repository';

export class TeamMockRepository implements TeamRepository {
  // TODO: 임시 더미 응답입니다. 실제 구현 시 DB/API 호출로 교체하세요.
  async getCrewList(): Promise<CrewListResponse> {
    return CREW_LIST_EXAMPLE;
  }

  async getActivityList(): Promise<ActivityListResponse> {
    return ACTIVITY_LIST_EXAMPLE;
  }

  async getCrewDetail(_crewId: string): Promise<CrewDetailResponse> {
    return CREW_DETAIL_EXAMPLE;
  }

  async getDepartmentKeys(): Promise<TeamDepartmentKeysResponse> {
    return TEAM_DEPARTMENT_KEYS_EXAMPLE;
  }

  async getProjectList(): Promise<ProjectListResponse> {
    return PROJECT_LIST_EXAMPLE;
  }

  async getProjectDetail(_projectId: string): Promise<ProjectDetailResponse> {
    return PROJECT_DETAIL_EXAMPLE;
  }
}
