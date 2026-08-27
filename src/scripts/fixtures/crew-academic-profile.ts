import type { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

// Synthetic identities only. No production Notion data or network calls.
export function crewPage(id: string, accounts: string[], portalId = ''): PageObjectResponse {
  return {
    object: 'page', id,
    icon: { type: 'external', external: { url: 'https://example.test/avatar.png' } },
    properties: {
      Name: { title: [{ plain_text: `Fixture ${id}` }] },
      '계정(프로필)': { people: accounts.map((id) => ({ id })) },
      '포털ID': { rich_text: portalId ? [{ plain_text: portalId }] : [] },
      '기수': { multi_select: [{ name: '1기' }] },
    },
  } as unknown as PageObjectResponse;
}

export function profilePage(
  id: string, accounts: string[], email: string | null, year: string | null, department = '소프트웨어학과',
): PageObjectResponse {
  return {
    object: 'page', id,
    properties: {
      '회원명': { title: [{ plain_text: '동명이인' }] },
      '사용자계정': { people: accounts.map((id) => ({ id })) },
      '이메일': { email },
      '학과': { select: { name: department } },
      '학번': { rich_text: year ? [{ plain_text: year }] : [] },
    },
  } as unknown as PageObjectResponse;
}

export function academicNotionFixture(crews: PageObjectResponse[], profiles: PageObjectResponse[]) {
  const calls: string[] = [];
  const state = { profiles, failProfiles: false };
  const client = {
    dataSources: {
      async query({ data_source_id: id, start_cursor: cursor }: { data_source_id: string; start_cursor?: string }) {
        calls.push(id);
        if (id === 'fixture-profiles' && state.failProfiles) throw new Error('profile access denied');
        const all = id === 'fixture-crews' ? crews : id === 'fixture-profiles' ? state.profiles : [];
        const offset = Number(cursor ?? 0);
        const results = all.slice(offset, offset + 2);
        const next = offset + results.length;
        return { results, next_cursor: next < all.length ? String(next) : null };
      },
    },
  } as unknown as Client;
  return { client, calls, state };
}
