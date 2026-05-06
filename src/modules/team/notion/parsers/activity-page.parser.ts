import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { ActivityListResponse } from '../../repositories/team.repository';

type ActivityListItem = ActivityListResponse['data'][number];

const STATUS_NAME_MAP: Record<string, ActivityListItem['status']> = {
  준비중: 'ACTIVITY_STATUS/PREPARING',
  기획중: 'ACTIVITY_STATUS/PREPARING',
  모집중: 'ACTIVITY_STATUS/RECRIUTING',
  '참여인원 모집중': 'ACTIVITY_STATUS/RECRIUTING',
  진행중: 'ACTIVITY_STATUS/ONBOARDING',
  완료: 'ACTIVITY_STATUS/COMPLETED',
  보류: 'ACTIVITY_STATUS/STANDBY',
  취소: 'ACTIVITY_STATUS/CANCELLED',
  preparing: 'ACTIVITY_STATUS/PREPARING',
  recruiting: 'ACTIVITY_STATUS/RECRIUTING',
  onboarding: 'ACTIVITY_STATUS/ONBOARDING',
  completed: 'ACTIVITY_STATUS/COMPLETED',
  standby: 'ACTIVITY_STATUS/STANDBY',
  cancelled: 'ACTIVITY_STATUS/CANCELLED',
};

const DUMMY_STATUS = 'ACTIVITY_STATUS/DUMMY_NOT_MAPPED_YET';
const DUMMY_ACTIVITY_TYPE = 'ACTIVITY_TYPE/DUMMY_NOT_FETCHED_YET';
export interface ParsedActivityPage {
  koName: string;
  status: ActivityListItem['status'];
  startedAt: string;
  activityType: ActivityListItem['activityType'];
  backgroundImageUrl: string | null;
  participantsCount: number;
}

export function parseActivityPage(page: PageObjectResponse): ParsedActivityPage {
  return {
    koName: extractActivityName(page),
    status: extractActivityStatus(page),
    startedAt: extractStartedAt(page),
    activityType: extractActivityType(page),
    backgroundImageUrl: extractBackgroundImageUrl(page),
    participantsCount: extractParticipantsCount(page),
  };
}

function extractActivityName(page: PageObjectResponse): string {
  const titleProperty = (page.properties.Name ?? page.properties['스터디 이름']) as
    | { title?: Array<{ plain_text?: string }> }
    | undefined;
  const title = titleProperty?.title;
  return title?.[0]?.plain_text ?? 'DUMMY_ACTIVITY_NAME_NOT_FOUND';
}

function extractActivityStatus(page: PageObjectResponse): ActivityListItem['status'] {
  const property = (page.properties['진행상태'] ?? page.properties['상태']) as
    | { status?: { name?: string | null }; select?: { name?: string | null } }
    | undefined;
  const rawName = property?.status?.name ?? property?.select?.name ?? '';
  const normalizedKey = rawName.trim();

  return STATUS_NAME_MAP[normalizedKey] ?? `${DUMMY_STATUS}:${sanitizeForMockKey(normalizedKey || 'UNKNOWN')}`;
}

function extractStartedAt(page: PageObjectResponse): string {
  const studyTermProperty = page.properties['개설 학기'] as
    | { select?: { name?: string | null } }
    | undefined;
  const studyTerm = studyTermProperty?.select?.name?.trim();
  if (studyTerm) {
    return normalizeStartedAtFromActivityTerm(studyTerm);
  }

  const property = page.properties['프로젝트 생성일'] as
    | { date?: { start?: string | null }; created_time?: string | null }
    | undefined;
  const rawDate = property?.date?.start ?? page.created_time;

  return formatStartedAtFromDate(rawDate);
}

function extractBackgroundImageUrl(page: PageObjectResponse): string | null {
  const cover = page.cover as
    | {
        type: 'external';
        external: { url: string };
      }
    | {
        type: 'file';
        file: { url: string };
      }
    | null;

  return cover ? (cover.type === 'external' ? cover.external.url : cover.file.url) : null;
}

function extractActivityType(page: PageObjectResponse): ActivityListItem['activityType'] {
  const propertyKeys = Object.keys(page.properties);
  const hasProjectSpecificProperties = propertyKeys.includes('기획자') || propertyKeys.includes('담당자');

  if (hasProjectSpecificProperties) {
    return 'ACTIVITY_TYPE/PROJECT';
  }

  const hasStudySpecificProperties =
    propertyKeys.includes('스터디 이름') && propertyKeys.includes('개설 학기');

  if (hasStudySpecificProperties) {
    return 'ACTIVITY_TYPE/STUDY';
  }

  // TODO(mock): 현재 응답만으로 PROJECT 외 activity type 판별 규칙이 없어 mock 값을 사용합니다.
  return DUMMY_ACTIVITY_TYPE;
}

function formatStartedAtFromDate(rawDate: string | null | undefined): string {
  if (!rawDate) {
    // TODO(mock): 시작일 정보를 찾지 못한 경우 mock semester 값을 사용합니다.
    return '0000-0';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    // TODO(mock): 날짜 파싱이 실패한 경우 mock semester 값을 사용합니다.
    return '0000-0';
  }

  const month = parsed.getUTCMonth() + 1;
  const semester = month <= 6 ? 1 : 2;
  return `${parsed.getUTCFullYear()}-${semester}`;
}

function normalizeStartedAtFromActivityTerm(rawTerm: string): string {
  const normalized = rawTerm.replace(/\s+/g, '');
  const match = normalized.match(/^(\d{2,4})-(1|2|동계|하계)학기$/);

  if (!match) {
    // TODO(mock): 학기 형식이 예상과 다르면 원본 값을 그대로 노출합니다.
    return rawTerm;
  }

  const [, yearToken, seasonToken] = match;
  const fullYear = yearToken.length === 2 ? `20${yearToken}` : yearToken;

  return `${fullYear}-${seasonToken}`;
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

  return 0;
}

function sanitizeForMockKey(value: string): string {
  return value.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-가-힣]/g, '').slice(0, 40) || 'UNKNOWN';
}
