import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Script } from 'node:vm';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Fastify from 'fastify';
import { Client } from '@notionhq/client';
import { validateImageUrl, isPublicImageAddress, MAX_PROFILE_IMAGE_BYTES, downloadPublicImage } from '../modules/team/datasources/public-image-download';
import { ProfileImageFileStorage } from '../modules/team/datasources/profile-image-file-storage';
import { CrewImageSource } from '../modules/team/notion/crew-image-source';
import { registerAdminRoutes } from '../routes/admin';
import { registerAdminDashboardRoute } from '../routes/admin-dashboard';

test('image URLs reject private networks, metadata, credentials, unsafe schemes/ports and IPv6', () => {
  for (const ip of ['0.0.0.1', '10.16.0.228', '100.64.0.1', '127.0.0.1', '169.254.169.254', '172.16.1.1', '192.168.0.1', '198.18.0.1', '224.0.0.1', '::1', '::ffff:127.0.0.1']) assert.equal(isPublicImageAddress(ip), false);
  assert.equal(isPublicImageAddress('8.8.8.8'), true);
  for (const url of ['http://example.test/x', 'file:///x', 'https://127.1/x', 'https://2130706433/x', 'https://[::1]/x', 'https://a:b@example.test/x', 'https://example.test:8443/x']) assert.throws(() => validateImageUrl(url));
  assert.equal(validateImageUrl('https://example.test/photo.png?signature=private').hostname, 'example.test');
});
test('image storage uses content hashes, preserves previous files and rejects active/unbounded payloads', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aolda-image-storage-test-'));
  let bytes = Buffer.from('89504e470d0a1a0a00000000', 'hex');
  const storage = new ProfileImageFileStorage(dir, '/assets/crew-profiles', 1000, async () => bytes);
  try {
    const first = await storage.saveFromUrl('test-page', 'https://example.test/1');
    const again = await storage.saveFromUrl('test-page', 'https://example.test/new-signed-url');
    assert.equal(first.publicUrl, again.publicUrl);
    bytes = Buffer.concat([bytes, Buffer.from('different')]);
    const changed = await storage.saveFromUrl('test-page', 'https://example.test/2');
    assert.notEqual(first.publicUrl, changed.publicUrl);
    assert.ok((await readFile(first.localPath)).length);
    for (const invalid of [Buffer.from('<svg onload="alert(1)"/>'), Buffer.from('<html>oops</html>'), Buffer.alloc(0), Buffer.alloc(MAX_PROFILE_IMAGE_BYTES + 1)]) {
      bytes = invalid; await assert.rejects(storage.saveFromUrl('test-page', 'https://example.test/invalid'));
    }
    assert.equal((await readdir(dir)).length, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('hostname resolution cannot bypass the private-address guard', async () => {
  await assert.rejects(downloadPublicImage('https://localhost/image.png', 1000), /Private image addresses/);
});
test('fresh Notion reads enforce Crew datasource and use icon before body image', async () => {
  let calls = 0, bodyCalls = 0;
  const page: any = { id: 'page', archived: false, in_trash: false, parent: { type: 'data_source_id', data_source_id: 'crew-source' }, properties: {}, icon: { type: 'external', external: { url: 'https://example.test/new.png' } } };
  const client = { pages: { retrieve: async () => { calls++; return page; } }, blocks: { children: { list: async () => { bodyCalls++; return { results: [], has_more: false }; } } } } as unknown as Client;
  const source = new CrewImageSource(client, 'crew-source');
  assert.equal(await source.getImageUrl('page'), 'https://example.test/new.png');
  page.icon.external.url = 'https://example.test/newer.png';
  assert.equal(await source.getImageUrl('page'), 'https://example.test/newer.png');
  assert.equal(calls, 2); assert.equal(bodyCalls, 0);
  page.icon = null; assert.equal(await source.getImageUrl('page'), null); assert.equal(bodyCalls, 1);
  page.parent.data_source_id = 'other-source'; await assert.rejects(source.getImageUrl('page'));
});
test('Notion rate limiting is retried within a bounded policy', async () => {
  let calls = 0;
  const client = new Client({ auth: 'synthetic', retry: { maxRetries: 2, initialRetryDelayMs: 1, maxRetryDelayMs: 1 }, logger: () => undefined,
    fetch: async () => {
      calls++;
      if (calls === 1) return new Response(JSON.stringify({ object: 'error', status: 429, code: 'rate_limited', message: 'synthetic' }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '0' } });
      return new Response(JSON.stringify({ object: 'page', id: 'synthetic' }), { status: 200, headers: { 'content-type': 'application/json' } });
    } });
  await client.pages.retrieve({ page_id: 'synthetic' });
  assert.equal(calls, 2);
});
test('dashboard script parses and refresh/status APIs cannot be used anonymously', async () => {
  const app = Fastify(); await registerAdminDashboardRoute(app); await registerAdminRoutes(app, {});
  const html = (await app.inject('/admin')).body;
  new Script(html.match(/<script>([\s\S]*?)<\/script>/)![1]);
  assert.ok(html.includes('crewImageProgress'));
  assert.notEqual((await app.inject({ method: 'POST', url: '/admin/crews/image-refresh', payload: { crewIds: ['10000000-0000-0000-0000-000000000001'] } })).statusCode, 202);
  assert.notEqual((await app.inject('/admin/crews/image-refresh/latest')).statusCode, 200);
  await app.close();
});
