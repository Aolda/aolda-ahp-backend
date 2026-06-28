import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

export interface ParsedBlogPostPage {
  title: string;
  url: string | null;
  projectName: string | null;
  recordedAt: Date | null;
  participantRefs: string[];
}

export function parseBlogPostPage(page: PageObjectResponse): ParsedBlogPostPage {
  return {
    title: extractPlainText(page.properties['제목']) ?? 'UNTITLED_BLOG_POST',
    url: page.url ?? null,
    projectName: extractSelectName(page.properties['프로젝트명']),
    recordedAt: extractDate(page.properties['기록일자']),
    participantRefs: extractPeopleIds(page.properties['참여자']),
  };
}

function extractPlainText(property: unknown): string | null {
  const typedProperty = property as
    | {
        title?: Array<{ plain_text?: string }>;
        rich_text?: Array<{ plain_text?: string }>;
      }
    | undefined;

  const title = typedProperty?.title?.map((item) => item.plain_text ?? '').join('').trim();
  if (title) {
    return title;
  }

  const richText = typedProperty?.rich_text?.map((item) => item.plain_text ?? '').join('').trim();
  return richText || null;
}

function extractSelectName(property: unknown): string | null {
  const selectName = (property as { select?: { name?: string | null } } | undefined)?.select?.name;
  return selectName?.trim() || null;
}

function extractDate(property: unknown): Date | null {
  const rawDate = (property as { date?: { start?: string | null } } | undefined)?.date?.start;
  if (!rawDate) {
    return null;
  }

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function extractPeopleIds(property: unknown): string[] {
  const people = (property as { people?: Array<{ id?: string }> } | undefined)?.people;

  return (people ?? []).map((person) => person.id).filter((id): id is string => Boolean(id));
}
