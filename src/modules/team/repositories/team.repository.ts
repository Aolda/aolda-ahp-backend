import {
  ACTIVITY_LIST_EXAMPLE,
  CREW_DETAIL_EXAMPLE,
  CREW_LIST_EXAMPLE,
  PROJECT_DETAIL_EXAMPLE,
  PROJECT_LIST_EXAMPLE,
} from '../../../constants/team';

export type CrewListResponse = typeof CREW_LIST_EXAMPLE;
export type ActivityListResponse = typeof ACTIVITY_LIST_EXAMPLE;
export type CrewDetailResponse = typeof CREW_DETAIL_EXAMPLE;
export type ProjectListResponse = typeof PROJECT_LIST_EXAMPLE;
export type ProjectDetailResponse = typeof PROJECT_DETAIL_EXAMPLE;

export interface TeamRepository {
  // TODO: 실제 쿼리 파라미터(generation/role/page 등)를 도메인 스펙에 맞춰 확장하세요.
  getCrewList(): Promise<CrewListResponse>;
  getActivityList(): Promise<ActivityListResponse>;
  getCrewDetail(crewId: string): Promise<CrewDetailResponse>;
  getProjectList(): Promise<ProjectListResponse>;
  getProjectDetail(projectId: string): Promise<ProjectDetailResponse>;
}
