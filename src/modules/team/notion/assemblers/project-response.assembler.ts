import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { ProjectListResponse } from '../../repositories/team.repository';
import { parseActivityPage } from '../parsers/activity-page.parser';

type ProjectItem = ProjectListResponse['data']['projects'][number];
type StatusFilter = { key: string; value: string };
type SeasonFilter = { key: string; value: string };

export function assembleProjectListResponse(pages: PageObjectResponse[]): ProjectListResponse {
  const projectActivities = pages
    .map((page, index) => ({ page, index, activity: parseActivityPage(page) }))
    .filter(({ activity }) => activity.activityType === 'ACTIVITY_TYPE/PROJECT');

  const projects = projectActivities.map(({ page, index, activity }) =>
    buildProjectItem(page, index, activity),
  );

  return {
    total: projects.length,
    data: {
      statistics: buildStatistics(projects),
      filters: {
        status: buildStatusFilters(projects),
        seasons: buildSeasonFilters(projects),
      },
      projects,
    },
  };
}

function buildProjectItem(
  page: PageObjectResponse,
  index: number,
  activity: ReturnType<typeof parseActivityPage>,
): ProjectItem {
  return {
    // TODO(mock): Notion page id -> API activityId 매핑 규칙이 아직 없어 임시 순번을 사용합니다.
    activityId: index + 1,
    status: activity.status,
    startedAt: activity.startedAt,
    participantsCount: extractParticipantsCount(page),
    activityNames: activity.activityNames,
    background: activity.background,
  };
}

function extractParticipantsCount(page: PageObjectResponse): number {
  const participantsProperty = page.properties['참여자'] as
    | {
        people?: Array<unknown>;
        relation?: Array<unknown>;
      }
    | undefined;

  if (Array.isArray(participantsProperty?.people)) {
    return participantsProperty.people.length;
  }

  if (Array.isArray(participantsProperty?.relation)) {
    return participantsProperty.relation.length;
  }

  // TODO(mock): 참여자 필드 구조를 확정하지 못한 경우 mock participant count 0을 사용합니다.
  return 0;
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
    case 'ACTIVITY_STATUS/RECRIUTING':
      return '모집중';
    case 'ACTIVITY_STATUS/ONBOARDING':
      return '진행중';
    case 'ACTIVITY_STATUS/COMPLETED':
      return '완료';
    default:
      // TODO(mock): 정의되지 않은 status label은 원본 코드를 그대로 노출합니다.
      return status;
  }
}

function mapSeasonLabel(startedAt: string): string {
  const [year, semester] = startedAt.split('-');
  if (!year || !semester) {
    // TODO(mock): startedAt 형식이 예상과 다르면 원본 값을 그대로 노출합니다.
    return startedAt;
  }

  return `${year}학년도 ${semester}학기`;
}

function sanitizeFilterKey(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'UNKNOWN';
}
