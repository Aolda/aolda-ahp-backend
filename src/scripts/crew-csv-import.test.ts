import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Script } from 'node:vm';
import Fastify from 'fastify';
import { parseCrewCsv, planCrewImport, CSV_MAX_BYTES, type ExistingCrew } from '../modules/admin/services/crew-csv-import.service';
import { registerAdminDashboardRoute } from '../routes/admin-dashboard';
import { registerAdminRoutes } from '../routes/admin';
import { CREW_CSV_SCRIPT } from '../modules/admin/crew-csv-import-ui';

test('CSV handles BOM, CRLF, quoted commas, escaped quotes and multiline cells', () => {
  const rows = parseCrewCsv('\uFEFFname,email,description\r\n"테스트, 크루",test@example.test,"첫 줄\n""둘째 줄"""\r\n');
  assert.equal(rows[0].name, '테스트, 크루');
  assert.equal(rows[0].description, '첫 줄\n"둘째 줄"');
});
test('CSV rejects ambiguous structure, unknown columns, size/count limits and invalid encoding', () => {
  for (const csv of ['name,name\na,b', 'password\na', 'name,email\n"a,b', 'name\n"a"b', 'name\na,b', 'name\n', 'name\n\uFFFD', 'name\na\0', 'name\n' + 'a'.repeat(CSV_MAX_BYTES), 'name\n' + 'a\n'.repeat(1001)]) {
    assert.throws(() => parseCrewCsv(csv));
  }
});
test('identity matching never merges by name, rejects duplicate email and requires explicit update ID', () => {
  const id = '10000000-0000-0000-0000-000000000001';
  const existing: ExistingCrew[] = [{ id, name: 'same', email: 'test@example.test', primaryNotionPageId: null,
    updatedAt: new Date(), sourceArchived: false, adminProfile: null }];
  assert.equal(planCrewImport('name,email\nsame,new@example.test', 'create', existing)[0].errors.length, 0);
  assert.ok(planCrewImport('name,email\nsame,TEST@example.test', 'create', existing)[0].errors.length);
  assert.ok(planCrewImport('name,email\nsame,test@example.test', 'update', existing)[0].errors.length);
  assert.equal(planCrewImport(`crewId,name\n${id},new`, 'update', existing)[0].targetId, id);
  assert.ok(planCrewImport(`crewId,name\n${id},new\n${id},other`, 'update', existing)[1].errors.length);
  assert.ok(planCrewImport('name,email\na,test@a.test\nb,TEST@a.test', 'create', [])[1].errors.length);
});
test('invalid profile values are rejected; full student IDs never appear in preview', () => {
  const plan = planCrewImport('name,email,joinedGen,univJoinedYear,isVisible\n테스트,test@example.test,0,202112345,true', 'create', []);
  assert.ok(plan[0].errors.length);
  assert.ok(!JSON.stringify(plan).includes('202112345'));
  assert.equal(plan[0].values.joinedGen, '0');
  assert.ok(planCrewImport('name,email,joinedGen,isVisible\na,test@a.test,-1,yes', 'create', [])[0].errors.length >= 2);
});
test('CSV prevents linking another crew through its secondary term page', () => {
  const pageId = '20000000-0000-0000-0000-000000000001';
  const existing: ExistingCrew[] = [{ id: '10000000-0000-0000-0000-000000000001', name: 'Test', email: null, primaryNotionPageId: null,
    updatedAt: new Date(), sourceArchived: false, adminProfile: null, termTeamSources: [{ notionPageId: pageId }] }];
  assert.ok(planCrewImport(`name,email,notionPageId\na,test@example.test,${pageId}`, 'create', existing)[0].errors.length);
});
test('CSV UI binds uploaded text to preview/commit, escapes preview and invalidates on file changes', async () => {
  const elements: Record<string, any> = {};
  const $ = (id: string) => elements[id] ??= { disabled: false, value: '', textContent: '', innerHTML: '', addEventListener() {}, replaceChildren() { this.innerHTML = ''; }, showModal() {}, close() {} };
  const bytes = new TextEncoder().encode('name,email\nTest,test@example.test');
  $('crewCsvFile').files = [{ size: bytes.length, arrayBuffer: async () => bytes.buffer }];
  $('crewCsvMode').value = 'create';
  const requests: Array<{ path: string; payload: any }> = [];
  const api = async (path: string, options: any) => {
    requests.push({ path, payload: JSON.parse(options.body) });
    if (path.endsWith('preview')) return { data: { valid: true, token: 'bound-token', rows: [{ row: 2, values: { name: '<img src=x onerror=alert(1)>' }, errors: [] }] } };
    return { data: { created: 1, updated: 0 } };
  };
  new Script(CREW_CSV_SCRIPT).runInNewContext({ $, api, TextDecoder, authHeaders: () => ({}), loadCrews: async () => {}, esc: (value: string) => value.replace(/</g, '&lt;') });
  await $('crewCsvPreview').onclick();
  assert.equal($('crewCsvCommit').disabled, false);
  assert.ok(!$('crewCsvRows').innerHTML.includes('<img'));
  await $('crewCsvCommit').onclick();
  assert.equal(requests[1].payload.csv, requests[0].payload.csv);
  assert.equal(requests[1].payload.token, 'bound-token');
  assert.equal($('crewCsvCommit').disabled, true);
  await $('crewCsvPreview').onclick(); $('crewCsvFile').onchange();
  assert.equal($('crewCsvCommit').disabled, true);
});
test('dashboard has valid JavaScript and import endpoints require authentication', async () => {
  const app = Fastify();
  await registerAdminDashboardRoute(app);
  await registerAdminRoutes(app, {});
  const html = (await app.inject('/admin')).body;
  new Script(html.match(/<script>([\s\S]*?)<\/script>/)![1]);
  assert.ok(html.includes('crewCsvDialog'));
  for (const action of ['preview', 'commit']) {
    const res = await app.inject({ method: 'POST', url: `/admin/crews/import/${action}`, payload: { csv: 'name\na', mode: 'create' } });
    assert.notEqual(res.statusCode, 200);
  }
  assert.notEqual((await app.inject('/admin/crews/import/template')).statusCode, 200);
  await app.close();
});
