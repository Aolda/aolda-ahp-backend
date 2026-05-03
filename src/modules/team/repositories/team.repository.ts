import {
  ACTIVITY_LIST_EXAMPLE,
  PROJECT_DETAIL_EXAMPLE,
  PROJECT_LIST_EXAMPLE,
  TEAM_DEPARTMENT_KEYS_EXAMPLE,
} from '../../../constants/team';

export interface CrewLogItem {
  generation: number;
  type: string;
  department: string;
}

export interface CrewListItem {
  crewId: number;
  profile: { url: string };
  crewName: string;
  crewLog: CrewLogItem[];
  isActive: boolean;
  joinedGen: number;
  univDepartment: string;
  univJoinedYear: string;
  totalActivities: number;
  totalBloggings: number;
}

export interface CrewResponseKeys {
  department: Record<string, string>;
  type: Record<string, string>;
}

export interface CrewKeyDictionaryResponse {
  data: Record<string, string>;
}

export interface CrewListResponse {
  total: number;
  keys: CrewResponseKeys;
  data: CrewListItem[];
}

export type ActivityListResponse = typeof ACTIVITY_LIST_EXAMPLE;
export type ProjectListResponse = typeof PROJECT_LIST_EXAMPLE;
export type ProjectDetailResponse = typeof PROJECT_DETAIL_EXAMPLE;
export type TeamDepartmentKeysResponse = typeof TEAM_DEPARTMENT_KEYS_EXAMPLE;

export interface CrewDetailResponse extends Omit<CrewListItem, 'totalActivities' | 'totalBloggings'> {
  crewEmail: string;
  description: string;
  activities: Array<{
    activityId: number;
    status: string;
    startedAt: string;
    activityNames: {
      ko: string;
      en: string;
      brief: string;
    };
    activityType: string;
    description: string;
  }>;
  bloggings: Array<{
    title: string;
    postedAt: string;
    contentPreview: string;
  }>;
  connections: {
    isFollowing: boolean;
    followers: number;
    followings: number;
  };
}

export interface TeamRepository {
  // TODO: 실제 쿼리 파라미터(generation/role/page 등)를 도메인 스펙에 맞춰 확장하세요.
  getCrewList(): Promise<CrewListResponse>;
  getActivityList(): Promise<ActivityListResponse>;
  getCrewDetail(crewId: string): Promise<CrewDetailResponse>;
  getDepartmentKeys(): Promise<TeamDepartmentKeysResponse>;
  getProjectList(): Promise<ProjectListResponse>;
  getProjectDetail(projectId: string): Promise<ProjectDetailResponse>;
}
