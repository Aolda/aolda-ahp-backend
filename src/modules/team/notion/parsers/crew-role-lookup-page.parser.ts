import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

export interface ParsedCrewRoleLookupPage {
  personIds: string[];
  generation: number | null;
  rawRole: string | null;
}

export function parseCrewRoleLookupPage(page: PageObjectResponse): ParsedCrewRoleLookupPage {
  return {
    personIds: extractPeopleIds(page),
    generation: extractGeneration(page),
    rawRole: extractRole(page),
  };
}

function extractPeopleIds(page: PageObjectResponse): string[] {
  const people = (page.properties['이름'] as { people?: Array<{ id?: string }> } | undefined)?.people;
  return (people ?? []).map((person) => person.id).filter((id): id is string => Boolean(id));
}

function extractGeneration(page: PageObjectResponse): number | null {
  const rawGeneration = (page.properties['기수'] as { select?: { name?: string } } | undefined)?.select?.name;
  if (!rawGeneration) {
    return null;
  }

  const parsed = Number(rawGeneration.replace(/[^0-9]/g, ''));
  return Number.isNaN(parsed) ? null : parsed;
}

function extractRole(page: PageObjectResponse): string | null {
  return (page.properties['직책'] as { select?: { name?: string } } | undefined)?.select?.name ?? null;
}
