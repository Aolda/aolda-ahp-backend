import {
  ActivityListResponse,
  CrewDetailResponse,
  CrewListResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  TeamCrewTypeKeysResponse,
  TeamDepartmentKeysResponse,
  TeamRepository,
} from '../repositories/team.repository';

export class TeamQueryService {
  constructor(private readonly teamRepository: TeamRepository) {}

  // TODO: 비즈니스 규칙(권한/필터/정렬/예외 처리)은 이 계층에 구현하세요.
  async getCrewList(): Promise<CrewListResponse> {
    return this.teamRepository.getCrewList();
  }

  async getActivityList(): Promise<ActivityListResponse> {
    return this.teamRepository.getActivityList();
  }

  async getCrewDetail(crewId: string): Promise<CrewDetailResponse> {
    return this.teamRepository.getCrewDetail(crewId);
  }

  async getDepartmentKeys(): Promise<TeamDepartmentKeysResponse> {
    return this.teamRepository.getDepartmentKeys();
  }

  async getCrewTypeKeys(): Promise<TeamCrewTypeKeysResponse> {
    return this.teamRepository.getCrewTypeKeys();
  }

  async getProjectList(): Promise<ProjectListResponse> {
    return this.teamRepository.getProjectList();
  }

  async getProjectDetail(projectId: string): Promise<ProjectDetailResponse> {
    return this.teamRepository.getProjectDetail(projectId);
  }
}
