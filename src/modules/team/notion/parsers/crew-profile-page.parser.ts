import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

export interface ParsedCrewProfilePage {
  personIds: string[];
  name: string | null;
  email: string | null;
  univDepartment: string | null;
  univJoinedYear: string | null;
}

export function parseCrewProfilePage(page: PageObjectResponse): ParsedCrewProfilePage {
  return {
    personIds: extractPeopleIds(page),
    name: extractPlainText(page.properties['회원명']),
    email: extractEmail(page),
    univDepartment: extractPlainText(page.properties['학과']),
    univJoinedYear: extractPlainText(page.properties['학번']),
  };
}

function extractPeopleIds(page: PageObjectResponse): string[] {
  const people = (page.properties['사용자계정'] as
    | { people?: Array<{ id?: string }> }
    | undefined)?.people;

  return (people ?? []).map((person) => person.id).filter((id): id is string => Boolean(id));
}

function extractEmail(page: PageObjectResponse): string | null {
  const email = (page.properties['이메일'] as { email?: string } | undefined)?.email?.trim();
  return email || null;
}

function extractPlainText(property: unknown): string | null {
  const typedProperty = property as
    | {
        title?: Array<{ plain_text?: string }>;
        rich_text?: Array<{ plain_text?: string }>;
        select?: { name?: string };
        number?: number;
      }
    | undefined;

  const title = typedProperty?.title?.map((item) => item.plain_text ?? '').join('').trim();
  if (title) {
    return title;
  }

  const richText = typedProperty?.rich_text?.map((item) => item.plain_text ?? '').join('').trim();
  if (richText) {
    return richText;
  }

  const select = typedProperty?.select?.name?.trim();
  if (select) {
    return select;
  }

  if (typeof typedProperty?.number === 'number') {
    return String(typedProperty.number);
  }

  return null;
}
