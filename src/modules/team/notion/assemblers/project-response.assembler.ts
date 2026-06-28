import type { ProjectListResponse } from '../../repositories/team.repository';
import type { ActivityAggregate } from '../types/activity-aggregate';

type ProjectItem = ProjectListResponse['data']['projects'][number];
type StatusFilter = { key: string; value: string };
type SeasonFilter = { key: string; value: string };

export function assembleProjectListResponse(projects: ActivityAggregate[]): ProjectListResponse {
  const projectItems = projects.map((project) => buildProjectItem(project));

  return {
    total: projectItems.length,
    data: {
      statistics: buildStatistics(projectItems),
      filters: {
        status: buildStatusFilters(projectItems),
        seasons: buildSeasonFilters(projectItems),
      },
      projects: projectItems,
    },
  };
}

function buildProjectItem(activity: ActivityAggregate): ProjectItem {
  return {
    activityId: activity.activityId,
    status: activity.status,
    startedAt: activity.startedAt,
    endedAt: activity.endedAt ?? null,
    participantsCount: activity.participantsCount,
    activityNames: activity.activityNames,
    background: activity.background,
  };
}

function buildStatistics(projects: ProjectItem[]): ProjectListResponse['data']['statistics'] {
  const projectCount = projects.length;
  const participantsCount = projects.reduce((sum, project) => sum + project.participantsCount, 0);

  return {
    projects: {
      key: 'STATISTIC_VALUE/PROJECTS',
      // TODO(mock): 전체 프로젝트 모수(total)는 별도 집계 기준이 없어 현재 value와 동일한 mock 값을 사용합니다.
      total: projectCount,
      value: projectCount,
    },
    participants: {
      key: 'STATISTIC_VALUE/PARTICIPANTS',
      // TODO(mock): 전체 참여자 모수(total)는 별도 집계 기준이 없어 현재 value와 동일한 mock 값을 사용합니다.
      total: participantsCount,
      value: participantsCount,
    },
    paran_projects: {
      key: 'STATISTIC_VALUE/PARAN_PROJECTS',
      // TODO(mock): 파란 프로젝트 집계 규칙이 없어 0을 사용합니다.
      total: projectCount,
      value: 0,
    },
  };
}

function buildStatusFilters(projects: ProjectItem[]): ProjectListResponse['data']['filters']['status'] {
  const filters = projects.reduce<Record<string, StatusFilter>>((acc, project) => {
    const key = `STATUS_${sanitizeFilterKey(project.status)}`;
    if (!acc[key]) {
      acc[key] = {
        key: project.status,
        value: mapStatusLabel(project.status),
      };
    }
    return acc;
  }, {});

  return filters as ProjectListResponse['data']['filters']['status'];
}

function buildSeasonFilters(projects: ProjectItem[]): ProjectListResponse['data']['filters']['seasons'] {
  const filters = projects.reduce<Record<string, SeasonFilter>>((acc, project) => {
    const key = `SEMESTER_${project.startedAt.replace('-', '_')}`;
    if (!acc[key]) {
      acc[key] = {
        key: project.startedAt,
        value: mapSeasonLabel(project.startedAt),
      };
    }
    return acc;
  }, {});

  return filters as ProjectListResponse['data']['filters']['seasons'];
}

function mapStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVITY_STATUS/PREPARING':
      return '준비중';
    case 'ACTIVITY_STATUS/RECRIUTING':
      return '모집중';
    case 'ACTIVITY_STATUS/ONBOARDING':
      return '진행중';
    case 'ACTIVITY_STATUS/COMPLETED':
      return '완료';
    case 'ACTIVITY_STATUS/STANDBY':
      return '보류';
    case 'ACTIVITY_STATUS/CANCELLED':
      return '취소';
    default:
      // TODO(mock): 정의되지 않은 status label은 원본 코드를 그대로 노출합니다.
      return status;
  }
}

function mapSeasonLabel(startedAt: string): string {
  const normalized = startedAt.trim();
  const match = normalized.match(/^(\d{2,4})-(1|2|동계|하계)$/);

  if (!match) {
    // TODO(mock): startedAt 형식이 예상과 다르면 원본 값을 그대로 노출합니다.
    return startedAt;
  }

  const [, yearToken, seasonToken] = match;
  const fullYear = yearToken.length === 2 ? `20${yearToken}` : yearToken;

  return `${fullYear}학년도 ${seasonToken}학기`;
}

function sanitizeFilterKey(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'UNKNOWN';
}
