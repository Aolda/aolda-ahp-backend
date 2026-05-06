import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

export interface ParsedActivityMetadataSeed {
  koName: string;
  enName: string | null;
  briefName: string | null;
}

export function parseActivityMetadataSeed(
  page: PageObjectResponse,
  activityType: string,
): ParsedActivityMetadataSeed {
  const rawTitle = extractRawActivityTitle(page);

  if (activityType === 'ACTIVITY_TYPE/PROJECT') {
    return parseProjectMetadataSeed(rawTitle);
  }

  return {
    koName: rawTitle,
    enName: null,
    briefName: null,
  };
}

function extractRawActivityTitle(page: PageObjectResponse): string {
  const titleProperty = (page.properties.Name ?? page.properties['스터디 이름']) as
    | { title?: Array<{ plain_text?: string }> }
    | undefined;

  return titleProperty?.title?.map((item) => item.plain_text ?? '').join('') || 'DUMMY_ACTIVITY_NAME_NOT_FOUND';
}

function parseProjectMetadataSeed(rawTitle: string): ParsedActivityMetadataSeed {
  const normalizedTitle = rawTitle.trim();
  const match = normalizedTitle.match(/^\s*([^()]+?)\s*\(([^()]+)\)(?:\s*-\s*.*)?\s*$/);

  if (match) {
    return {
      koName: rawTitle,
      briefName: match[1]?.trim() || null,
      enName: match[2]?.trim() || null,
    };
  }

  return {
    koName: rawTitle,
    enName: isLikelyEnglishText(normalizedTitle) ? rawTitle : null,
    briefName: null,
  };
}

function isLikelyEnglishText(value: string): boolean {
  if (!/[A-Za-z]/.test(value)) {
    return false;
  }

  return !/[가-힣]/.test(value);
}
