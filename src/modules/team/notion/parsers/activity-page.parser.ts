import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { ActivityListResponse } from '../../repositories/team.repository';

type ActivityListItem = ActivityListResponse['data'][number];

const STATUS_NAME_MAP: Record<string, ActivityListItem['status']> = {
  모집중: 'ACTIVITY_STATUS/RECRIUTING',
  진행중: 'ACTIVITY_STATUS/ONBOARDING',
  완료: 'ACTIVITY_STATUS/COMPLETED',
  recruiting: 'ACTIVITY_STATUS/RECRIUTING',
  onboarding: 'ACTIVITY_STATUS/ONBOARDING',
  completed: 'ACTIVITY_STATUS/COMPLETED',
};

const DUMMY_STATUS = 'ACTIVITY_STATUS/DUMMY_NOT_MAPPED_YET';
const DUMMY_ACTIVITY_TYPE = 'ACTIVITY_TYPE/DUMMY_NOT_FETCHED_YET';
const DUMMY_DESCRIPTION = 'DUMMY_ACTIVITY_DESCRIPTION_NOT_FETCHED_YET';
const DUMMY_BACKGROUND_URL = 'https://dummy.aolda.local/activities/background-not-fetched-yet.jpg';
const DUMMY_BACKGROUND_COLOR = '#000000';

export function parseActivityPage(page: PageObjectResponse): ActivityListItem {
  const koName = extractActivityName(page);

  return {
    status: extractActivityStatus(page),
    startedAt: extractStartedAt(page),
    activityNames: {
      ko: koName,
      // TODO(mock): 영문 activity 이름은 현재 _pages 응답만으로 확정 불가하여 mock 값입니다.
      en: `DUMMY_EN_NAME_FOR_${sanitizeForMockKey(koName)}`,
      // TODO(mock): brief 이름은 현재 _pages 응답만으로 확정 불가하여 mock 값입니다.
      brief: `DUMMY_BRIEF_FOR_${sanitizeForMockKey(koName)}`,
    },
    background: extractBackground(page),
    activityType: extractActivityType(page),
    // TODO(mock): description은 page 본문 block 미조회 상태라 mock 값입니다.
    description: DUMMY_DESCRIPTION,
  };
}

function extractActivityName(page: PageObjectResponse): string {
  const title = (page.properties.Name as { title?: Array<{ plain_text?: string }> }).title;
  return title?.[0]?.plain_text ?? 'DUMMY_ACTIVITY_NAME_NOT_FOUND';
}

function extractActivityStatus(page: PageObjectResponse): ActivityListItem['status'] {
  const property = page.properties['진행상태'] as
    | { status?: { name?: string | null }; select?: { name?: string | null } }
    | undefined;
  const rawName = property?.status?.name ?? property?.select?.name ?? '';
  const normalizedKey = rawName.trim();

  return STATUS_NAME_MAP[normalizedKey] ?? `${DUMMY_STATUS}:${sanitizeForMockKey(normalizedKey || 'UNKNOWN')}`;
}

function extractStartedAt(page: PageObjectResponse): string {
  const property = page.properties['프로젝트 생성일'] as
    | { date?: { start?: string | null }; created_time?: string | null }
    | undefined;
  const rawDate = property?.date?.start ?? page.created_time;

  return formatSemester(rawDate);
}

function extractBackground(page: PageObjectResponse): ActivityListItem['background'] {
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

  return {
    // TODO(mock): page cover가 없으면 background 이미지는 mock URL을 사용합니다.
    url: cover
      ? cover.type === 'external'
        ? cover.external.url
        : cover.file.url
      : DUMMY_BACKGROUND_URL,
    // TODO(mock): background color는 현재 _pages 응답만으로 판별 불가하여 mock 값입니다.
    color: DUMMY_BACKGROUND_COLOR,
  };
}

function extractActivityType(page: PageObjectResponse): ActivityListItem['activityType'] {
  const propertyKeys = Object.keys(page.properties);
  const hasProjectSpecificProperties =
    propertyKeys.includes('참여자') || propertyKeys.includes('기획자') || propertyKeys.includes('담당자');

  if (hasProjectSpecificProperties) {
    return 'ACTIVITY_TYPE/PROJECT';
  }

  // TODO(mock): 현재 응답만으로 PROJECT 외 activity type 판별 규칙이 없어 mock 값을 사용합니다.
  return DUMMY_ACTIVITY_TYPE;
}

function formatSemester(rawDate: string | null | undefined): string {
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

function sanitizeForMockKey(value: string): string {
  return value.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-가-힣]/g, '').slice(0, 40) || 'UNKNOWN';
}
