import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

const ACTIVE_GENERATION = '2026-1';

export function isCurrentActiveCrew(page: PageObjectResponse): boolean {
  const activeGeneration = (page.properties['작성기수'] as { select?: { name?: string } }).select?.name;
  return activeGeneration === ACTIVE_GENERATION;
}

export function extractCrewName(page: PageObjectResponse): string {
  const title = (page.properties.Name as { title?: Array<{ plain_text?: string }> }).title;
  return title?.[0]?.plain_text ?? 'UNKNOWN_CREW_NAME';
}

export function extractUnivDepartment(page: PageObjectResponse): string {
  const department = (page.properties['학과'] as { select?: { name?: string } }).select?.name;
  return department ?? 'DUMMY_DEPARTMENT_NOT_FETCHED_YET';
}

export function extractCrewEmail(page: PageObjectResponse): string {
  const portalIdProperty = page.properties['포털ID'] as
    | { rich_text?: Array<{ plain_text?: string }> }
    | undefined;
  const portalIdField = portalIdProperty?.rich_text?.[0];

  if (!portalIdField?.plain_text) {
    // TODO(dummy): 포털ID 필드를 찾지 못한 경우 placeholder 메일을 사용합니다.
    return 'dummy-email-not-fetched-yet@aolda.local';
  }

  const portalId = portalIdField.plain_text;
  return `${portalId}@ajou.ac.kr`;
}

export function extractUnivJoinedYear(page: PageObjectResponse): string {
  const propertyCandidates = [
    page.properties['입학년도'] as {
      rich_text?: Array<{ plain_text?: string }>;
      number?: number;
      select?: { name?: string };
    },
    page.properties['학번'] as {
      rich_text?: Array<{ plain_text?: string }>;
      number?: number;
      select?: { name?: string };
    },
  ];

  for (const property of propertyCandidates) {
    const richTextValue = property?.rich_text?.[0]?.plain_text;
    if (richTextValue) {
      return richTextValue;
    }

    if (typeof property?.number === 'number') {
      return String(property.number);
    }

    if (property?.select?.name) {
      return property.select.name;
    }
  }

  // TODO(dummy): 입학년도/학번 필드는 현재 Notion 스키마 확인 전이라 placeholder 값을 사용합니다.
  return '00';
}

export function extractGenerationNumbers(page: PageObjectResponse): number[] {
  const multiSelect = (page.properties['기수'] as { multi_select?: Array<{ name?: string }> }).multi_select;

  return (multiSelect ?? [])
    .map((value) => Number((value.name ?? '').slice(0, -1)))
    .filter((value) => !Number.isNaN(value))
    .sort((left, right) => left - right);
}
