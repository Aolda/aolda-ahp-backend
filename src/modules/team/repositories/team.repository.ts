import {
  PROJECT_DETAIL_EXAMPLE,
  TEAM_CREW_TYPE_KEYS_EXAMPLE,
  TEAM_DEPARTMENT_KEYS_EXAMPLE,
} from '../../../constants/team';

export interface CrewLogItem {
  generation: number;
  type: string;
  department: string;
}

export interface CrewListItem {
  crewId: number | string;
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

export interface ActivityNameSet {
  ko: string;
  en: string | null;
  brief: string | null;
}

export interface ActivityListItem {
  activityId: number | string;
  status: string;
  startedAt: string;
  activityNames: ActivityNameSet;
  background: {
    url: string;
    color: string;
  };
  activityType: string;
  description: string | null;
}

export interface ActivityListResponse {
  total: number;
  data: ActivityListItem[];
}

export interface ProjectListItem {
  activityId: number | string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  participantsCount: number;
  activityNames: ActivityNameSet;
  background: {
    url: string;
    color: string;
  };
}

export interface ProjectListResponse {
  total: number;
  data: {
    statistics: {
      projects: {
        key: string;
        total: number;
        value: number;
      };
      participants: {
        key: string;
        total: number;
        value: number;
      };
      paran_projects: {
        key: string;
        total: number;
        value: number;
      };
    };
    filters: {
      status: Record<string, { key: string; value: string }>;
      seasons: Record<string, { key: string; value: string }>;
    };
    projects: ProjectListItem[];
  };
}

export interface UpdateActivityMetadataInput {
  enName?: string | null;
  briefName?: string | null;
  description?: string | null;
}

export interface ActivityMetadataResponse {
  activityId: number | string;
  activityNames: ActivityNameSet;
  description: string | null;
  isVisible: boolean;
}

export interface CrewListResponse {
  total: number;
  keys: CrewResponseKeys;
  data: CrewListItem[];
}

export type ProjectDetailResponse = typeof PROJECT_DETAIL_EXAMPLE;
export type TeamDepartmentKeysResponse = typeof TEAM_DEPARTMENT_KEYS_EXAMPLE;
export type TeamCrewTypeKeysResponse = typeof TEAM_CREW_TYPE_KEYS_EXAMPLE;

export interface CrewDetailResponse extends Omit<CrewListItem, 'totalActivities' | 'totalBloggings'> {
  crewEmail: string;
  description: string;
  activities: Array<{
    activityId: number | string;
    status: string;
    startedAt: string;
    activityNames: ActivityNameSet;
    activityType: string;
    description: string | null;
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
  updateActivityMetadata(
    activityId: string,
    input: UpdateActivityMetadataInput,
  ): Promise<ActivityMetadataResponse>;
  getCrewDetail(crewId: string): Promise<CrewDetailResponse>;
  getDepartmentKeys(): Promise<TeamDepartmentKeysResponse>;
  getCrewTypeKeys(): Promise<TeamCrewTypeKeysResponse>;
  getProjectList(): Promise<ProjectListResponse>;
  getProjectDetail(projectId: string): Promise<ProjectDetailResponse>;
}
