import type { PrismaClient } from '@prisma/client';
import { resolveCrewIdentity } from '../crew-identity';
import { resolveCrewAcademicProfile, type CrewAcademicProfile } from '../crew-academic-profile';

import {
  PROJECT_DETAIL_EXAMPLE,
  TEAM_CREW_TYPE_KEYS_EXAMPLE,
  TEAM_DEPARTMENT_KEYS_EXAMPLE,
} from '../../../constants/team';
import {
  ActivityListResponse,
  ActivityMetadataResponse,
  CrewDetailResponse,
  CrewListItem,
  CrewListResponse,
  ProjectDetailResponse,
  ProjectListItem,
  ProjectListResponse,
  TeamCrewTypeKeysResponse,
  TeamDepartmentKeysResponse,
  TeamRepository,
  UpdateActivityMetadataInput,
} from '../repositories/team.repository';

const DEFAULT_CREW_DESCRIPTION =
  '아직 소개글을 준비 중이에요. 곧 멋진 이야기로 찾아올게요!';
const GENERAL_MEMBER_ROLE = 'CREW_ROLE/CREW';
const DEFAULT_PROFILE_URL = 'https://dummy.aolda.local/profiles/not-fetched-yet.jpg';

export class TeamContentRepository implements TeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getCrewList(): Promise<CrewListResponse> {
    const crews = await this.findVisibleCrews();
    const data = crews.map((crew) => this.toCrewListItem(crew));

    return {
      total: data.length,
      keys: this.collectCrewKeys(data),
      data,
    };
  }

  async getActivityList(): Promise<ActivityListResponse> {
    const projects = await this.findVisibleProjects();
    const data = projects.map((project) => ({
      activityId: project.id,
      status: project.status ?? 'ACTIVITY_STATUS/PREPARING',
      startedAt: project.startedAt ?? '',
      activityNames: this.resolveProjectNames(project),
      background: {
        url: project.backgroundImageUrl ?? '',
        color: project.backgroundColor ?? '#000000',
      },
      activityType: 'ACTIVITY_TYPE/PROJECT',
      description: project.adminProfile?.description ?? '',
    }));

    return {
      total: data.length,
      data,
    };
  }

  async updateActivityMetadata(
    _activityId: string,
    _input: UpdateActivityMetadataInput,
  ): Promise<ActivityMetadataResponse> {
    throw new Error('Activity metadata endpoint is deprecated; use admin project APIs instead');
  }

  async getCrewDetail(crewId: string): Promise<CrewDetailResponse> {
    const crew = await this.prisma.crewSource.findFirst({
      where: {
        id: crewId,
        adminProfile: { isVisible: true },
        sourceArchived: false,
      },
      include: {
        adminProfile: true,
        termTeamSources: { orderBy: { generation: 'asc' } },
        termTeamOverrides: { orderBy: { generation: 'asc' } },
        projectVisibilities: true,
        participantOverrides: {
          where: { isVisible: true },
          include: {
            projectSource: {
              include: {
                adminProfile: true,
                crewVisibilities: { where: { crewSourceId: crewId } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        blogVisibilities: {
          where: { isVisible: true },
          include: { blogPostSource: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!crew) {
      throw new Error(`Crew not found: ${crewId}`);
    }

    return {
      ...this.toCrewListItem(crew),
      crewEmail: resolveCrewIdentity(crew).email ?? '',
      description: crew.adminProfile?.description ?? DEFAULT_CREW_DESCRIPTION,
      activities: this.resolveCrewVisibleProjects(crew).map((project) => ({
        activityId: project.id,
        status: project.status ?? 'ACTIVITY_STATUS/PREPARING',
        startedAt: project.startedAt ?? '',
        activityNames: this.resolveProjectNames(project),
        activityType: 'ACTIVITY_TYPE/PROJECT',
        description: project.adminProfile?.description ?? '',
      })),
      bloggings: crew.blogVisibilities.map((item) => ({
        title: item.blogPostSource.title,
        postedAt: item.blogPostSource.recordedAt?.toISOString() ?? '',
        contentPreview: item.blogPostSource.contentPreview ?? '',
      })),
      connections: {
        isFollowing: false,
        followers: 0,
        followings: 0,
      },
    };
  }

  async getDepartmentKeys(): Promise<TeamDepartmentKeysResponse> {
    return TEAM_DEPARTMENT_KEYS_EXAMPLE;
  }

  async getCrewTypeKeys(): Promise<TeamCrewTypeKeysResponse> {
    return TEAM_CREW_TYPE_KEYS_EXAMPLE;
  }

  async getProjectList(): Promise<ProjectListResponse> {
    const projects = await this.findVisibleProjects();
    const projectItems = projects.map((project) => this.toProjectListItem(project));

    return {
      total: projectItems.length,
      data: {
        statistics: {
          projects: {
            key: 'STATISTIC_VALUE/PROJECTS',
            total: projectItems.length,
            value: projectItems.length,
          },
          participants: {
            key: 'STATISTIC_VALUE/PARTICIPANTS',
            total: projectItems.reduce((sum, project) => sum + project.participantsCount, 0),
            value: projectItems.reduce((sum, project) => sum + project.participantsCount, 0),
          },
          paran_projects: {
            key: 'STATISTIC_VALUE/PARAN_PROJECTS',
            total: projectItems.length,
            value: 0,
          },
        },
        filters: {
          status: {},
          seasons: {},
        },
        projects: projectItems,
      },
    };
  }

  async getProjectDetail(projectId: string): Promise<ProjectDetailResponse> {
    const project = await this.prisma.projectSource.findFirst({
      where: {
        id: projectId,
        adminProfile: { isVisible: true },
        sourceArchived: false,
      },
      include: {
        adminProfile: true,
        periodOverrides: { orderBy: { sortOrder: 'asc' } },
        participantOverrides: {
          where: { isVisible: true },
          include: { crewSource: { include: { adminProfile: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        featuredBlogs: {
          include: { blogPostSource: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    return {
      ...PROJECT_DETAIL_EXAMPLE,
      activityNames: this.resolveProjectNames(project) as ProjectDetailResponse['activityNames'],
      background: {
        url: project.backgroundImageUrl ?? '',
        color: project.backgroundColor ?? '#000000',
      },
      contents: {
        ...PROJECT_DETAIL_EXAMPLE.contents,
        ideaBackground: project.adminProfile?.description ?? '',
        activityInfo: {
          ...PROJECT_DETAIL_EXAMPLE.contents.activityInfo,
          startedAt:
            project.periodOverrides.length > 0
              ? project.periodOverrides.map((period) =>
                  period.endedAt ? `${period.startedAt}~${period.endedAt}` : period.startedAt,
                )
              : [project.startedAt ?? ''].filter((value) => value.length > 0),
          bloggingCounts: project.featuredBlogs.length,
        },
        mainBloggings: project.featuredBlogs.map((item) => ({
          title: item.blogPostSource.title,
          createdBy: { crewId: '' as never, crewName: '' },
          postedAt: item.blogPostSource.recordedAt?.toISOString() ?? '',
          contentPreview: item.blogPostSource.contentPreview ?? '',
        })),
      },
      participants: project.participantOverrides.map((item) =>
        this.toProjectParticipant(item.crewSource),
      ),
    };
  }

  private async findVisibleCrews() {
    return this.prisma.crewSource.findMany({
      where: {
        adminProfile: { isVisible: true },
        sourceArchived: false,
      },
      include: {
        adminProfile: true,
        termTeamSources: { orderBy: { generation: 'asc' } },
        termTeamOverrides: { orderBy: { generation: 'asc' } },
        projectVisibilities: true,
        participantOverrides: {
          where: { isVisible: true },
          include: {
            projectSource: {
              include: {
                adminProfile: true,
                crewVisibilities: true,
              },
            },
          },
        },
        blogVisibilities: { where: { isVisible: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  private async findVisibleProjects() {
    return this.prisma.projectSource.findMany({
      where: {
        adminProfile: { isVisible: true },
        sourceArchived: false,
      },
      include: {
        adminProfile: true,
        participantOverrides: { where: { isVisible: true } },
        periodOverrides: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { titleKo: 'asc' },
    });
  }

  private toCrewListItem(crew: Awaited<ReturnType<typeof this.findVisibleCrews>>[number]): CrewListItem {
    crew = resolveCrewIdentity(crew);
    const crewLog = this.resolveCrewLog(crew);

    return {
      crewId: crew.id,
      profile: {
        url: crew.profileImageUrl ?? DEFAULT_PROFILE_URL,
      },
      crewName: crew.name,
      crewLog,
      isActive: true,
      joinedGen: crew.joinedGen ?? crewLog[0]?.generation ?? 0,
      ...resolveCrewAcademicProfile(crew),
      totalActivities: this.resolveCrewVisibleProjects(crew).length,
      totalBloggings: crew.blogVisibilities.length,
    };
  }

  private toProjectListItem(
    project: Awaited<ReturnType<typeof this.findVisibleProjects>>[number],
  ): ProjectListItem {
    return {
      activityId: project.id,
      status: project.status ?? 'ACTIVITY_STATUS/PREPARING',
      startedAt: project.startedAt ?? '',
      endedAt: project.endedAt,
      participantsCount: project.participantOverrides.length || this.countJsonArray(project.participantRefs),
      activityNames: this.resolveProjectNames(project),
      background: {
        url: project.backgroundImageUrl ?? '',
        color: project.backgroundColor ?? '#000000',
      },
    };
  }

  private toProjectParticipant(crew: CrewAcademicProfile & {
    id: string;
    name: string;
    adminProfile?: { nameOverride?: string | null } | null;
    profileImageUrl: string | null;
  }) {
    crew = resolveCrewIdentity(crew);
    return {
      crewId: crew.id as never,
      profile: { url: crew.profileImageUrl ?? DEFAULT_PROFILE_URL },
      crewName: crew.name,
      ...resolveCrewAcademicProfile(crew),
    };
  }

  private resolveCrewLog(crew: Awaited<ReturnType<typeof this.findVisibleCrews>>[number]) {
    const records = crew.termTeamOverrides.length > 0 ? crew.termTeamOverrides : crew.termTeamSources;
    return records.map((record) => ({
      generation: record.generation,
      type: GENERAL_MEMBER_ROLE,
      department: record.teamName ?? '',
    }));
  }

  private resolveCrewVisibleProjects(crew: {
    id: string;
    participantOverrides: Array<{
      projectSource: {
        id: string;
        sourceArchived: boolean;
        crewVisibilities: Array<{ crewSourceId: string; isVisible: boolean }>;
        titleKo: string;
        titleEn: string | null;
        titleBrief: string | null;
        status: string | null;
        startedAt: string | null;
        adminProfile: {
          isVisible: boolean;
          titleKoOverride: string | null;
          titleEnOverride: string | null;
          titleBriefOverride: string | null;
          description: string | null;
        } | null;
      };
    }>;
  }) {
    return crew.participantOverrides
      .map((item) => item.projectSource)
      .filter((project) => {
        if (project.sourceArchived || !project.adminProfile?.isVisible) {
          return false;
        }

        const visibility = project.crewVisibilities.find((item) => item.crewSourceId === crew.id);
        return visibility?.isVisible ?? true;
      });
  }

  private resolveProjectNames(project: {
    titleKo: string;
    titleEn: string | null;
    titleBrief: string | null;
    adminProfile?: {
      titleKoOverride: string | null;
      titleEnOverride: string | null;
      titleBriefOverride: string | null;
    } | null;
  }) {
    return {
      ko: project.adminProfile?.titleKoOverride ?? project.titleKo,
      en: project.adminProfile?.titleEnOverride ?? project.titleEn,
      brief: project.adminProfile?.titleBriefOverride ?? project.titleBrief,
    };
  }

  private collectCrewKeys(data: CrewListResponse['data']): CrewListResponse['keys'] {
    return {
      department: Object.fromEntries(
        [...new Set(data.flatMap((crew) => crew.crewLog.map((log) => log.department)))]
          .filter((value) => value.length > 0)
          .map((value) => [value, value]),
      ),
      type: TEAM_CREW_TYPE_KEYS_EXAMPLE.data,
    };
  }

  private countJsonArray(value: unknown): number {
    return Array.isArray(value) ? value.length : 0;
  }
}
