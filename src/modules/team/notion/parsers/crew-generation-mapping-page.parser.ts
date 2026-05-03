import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

export interface ParsedCrewGenerationMappingPage {
  activityTerm: string | null;
  generation: number | null;
}

export function parseCrewGenerationMappingPage(
  page: PageObjectResponse,
): ParsedCrewGenerationMappingPage {
  return {
    activityTerm: extractActivityTerm(page),
    generation: extractGeneration(page),
  };
}

function extractActivityTerm(page: PageObjectResponse): string | null {
  const property = page.properties['활동학기 (YYYY-S)'] as
    | {
        title?: Array<{ plain_text?: string }>;
        rich_text?: Array<{ plain_text?: string }>;
        select?: { name?: string };
      }
    | undefined;

  const title = property?.title?.map((item) => item.plain_text ?? '').join('').trim();
  if (title) {
    return title;
  }

  const richText = property?.rich_text?.map((item) => item.plain_text ?? '').join('').trim();
  if (richText) {
    return richText;
  }

  return property?.select?.name ?? null;
}

function extractGeneration(page: PageObjectResponse): number | null {
  const property = page.properties['기수'] as
    | {
        number?: number;
        select?: { name?: string };
        rich_text?: Array<{ plain_text?: string }>;
        title?: Array<{ plain_text?: string }>;
      }
    | undefined;

  if (typeof property?.number === 'number') {
    return property.number;
  }

  const candidates = [
    property?.select?.name,
    property?.rich_text?.map((item) => item.plain_text ?? '').join('').trim(),
    property?.title?.map((item) => item.plain_text ?? '').join('').trim(),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const parsed = Number(candidate.replace(/[^0-9]/g, ''));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}
