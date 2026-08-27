import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeAdmissionYear, resolveCrewAcademicProfile } from '../modules/team/crew-academic-profile';
import { CrewProfileMatcher } from '../modules/team/notion/crew-profile-matcher';
import { parseCrewProfilePage } from '../modules/team/notion/parsers/crew-profile-page.parser';
import { NotionContentSyncService } from '../modules/admin/services/notion-content-sync.service';
import { ContentSourceRepository, type CrewSourceUpsertInput } from '../modules/admin/datasources/content-source.repository';
import { academicNotionFixture, crewPage, profilePage } from './fixtures/crew-academic-profile';

test('admission year accepts legacy years but never returns a full student number', () => {
  for (const [input, expected] of [
    ['202112345', '2021'], [202112345, '2021'], ['2021', '2021'], ['21', '21'],
    [' 2021학번 ', '2021'], ['2021년', '2021'], ['2000', '2000'],
    ['0000', null], ['00', null], ['', null], [null, null], [undefined, null],
    ['abc202112345', null], ['20211', null], ['1234', null], [0, null],
  ] as const) assert.equal(normalizeAdmissionYear(input), expected);
});

test('public response prefers valid administrator overrides and falls back without fake zeroes', () => {
  assert.deepEqual(resolveCrewAcademicProfile({ univDepartment: '원본학과', univJoinedYear: '202112345',
    adminProfile: { univDepartmentOverride: '수정학과', univJoinedYearOverride: '2022' } }),
  { univDepartment: '수정학과', univJoinedYear: '2022' });
  assert.equal(resolveCrewAcademicProfile({ univJoinedYear: '2021', adminProfile: { univJoinedYearOverride: '0000' } }).univJoinedYear, '2021');
  assert.deepEqual(resolveCrewAcademicProfile({}), { univDepartment: '', univJoinedYear: '' });
});

test('matching uses normalized account IDs before unique email, never names', () => {
  const alice = parseCrewProfilePage(profilePage('p1', ['AA-BB'], 'ALICE@example.test', '202112345'));
  const bob = parseCrewProfilePage(profilePage('p2', [], 'bob@example.test', '202212345'));
  const matcher = new CrewProfileMatcher([alice, bob]);
  assert.equal(matcher.resolve(['aabb'], 'bob@example.test'), alice);
  assert.equal(matcher.resolve([], ' ALICE@EXAMPLE.TEST '), alice);
  assert.equal(matcher.resolve(['new-account'], 'bob@example.test'), bob);
  assert.equal(matcher.resolve(['different-account'], 'alice@example.test'), undefined);
  assert.equal(matcher.resolve([], null), undefined);
});

test('duplicate accounts/emails and multiple profile matches fail closed', () => {
  const a = parseCrewProfilePage(profilePage('p1', ['one'], 'same@example.test', '202112345'));
  const b = parseCrewProfilePage(profilePage('p2', ['two'], 'same@example.test', '202212345'));
  assert.equal(new CrewProfileMatcher([a, b]).resolve([], 'same@example.test'), undefined);
  assert.equal(new CrewProfileMatcher([a, b]).resolve(['one', 'two'], null), undefined);
  assert.equal(new CrewProfileMatcher([a, { ...b, personIds: ['one'] }]).resolve(['one'], null), undefined);
});

function repositoryRecorder() {
  const writes: CrewSourceUpsertInput[] = [];
  const repository = {
    async upsertCrewSource(input: CrewSourceUpsertInput) {
      writes.push(input);
      return { id: input.sourceKey, created: true };
    },
  } as unknown as ContentSourceRepository;
  return { repository, writes };
}

test('sync fetches paginated profiles, persists only admission year and skips ambiguous identities', async () => {
  const fixture = academicNotionFixture(
    [crewPage('a', ['alice']), crewPage('b', [], 'bob'), crewPage('c', ['duplicate'])],
    [profilePage('p1', ['alice'], null, '202112345'),
      profilePage('p2', [], 'bob@ajou.ac.kr', '202212345'),
      profilePage('p3', ['duplicate'], null, '202312345'),
      profilePage('p4', ['duplicate'], null, '202412345')],
  );
  const { repository, writes } = repositoryRecorder();
  const sync = new NotionContentSyncService(fixture.client,
    { crew: 'fixture-crews', crewProfile: 'fixture-profiles' }, repository);
  await sync.syncCrews();
  assert.equal(writes.find((x) => x.primaryNotionPageId === 'a')?.univJoinedYear, '2021');
  assert.equal(writes.find((x) => x.primaryNotionPageId === 'b')?.univJoinedYear, '2022');
  assert.equal(writes.find((x) => x.primaryNotionPageId === 'c')?.univJoinedYear, undefined);
  assert.equal(writes[0].univDepartment, '소프트웨어학과');
  assert.equal(fixture.calls.filter((id) => id === 'fixture-profiles').length, 2);
  assert.ok(!JSON.stringify(writes).includes('202112345'));
});

test('missing configuration or invalid profile fields do not erase existing values', async () => {
  const fixture = academicNotionFixture([crewPage('a', ['alice'])], [profilePage('p', ['alice'], null, '0000', '')]);
  const { repository, writes } = repositoryRecorder();
  await new NotionContentSyncService(fixture.client, { crew: 'fixture-crews' }, repository).syncCrews();
  assert.equal(fixture.calls.includes('fixture-profiles'), false);
  await new NotionContentSyncService(fixture.client,
    { crew: 'fixture-crews', crewProfile: 'fixture-profiles' }, repository).syncCrews();
  assert.ok(writes.every((x) => x.univJoinedYear === undefined && x.univDepartment === undefined));
});

test('profile access failure aborts crew sync before any source writes', async () => {
  const fixture = academicNotionFixture([crewPage('a', ['alice'])], []);
  fixture.state.failProfiles = true;
  const { repository, writes } = repositoryRecorder();
  await assert.rejects(new NotionContentSyncService(fixture.client,
    { crew: 'fixture-crews', crewProfile: 'fixture-profiles' }, repository).syncCrews(), /profile access denied/);
  assert.equal(writes.length, 0);
});
