import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { CrewImageRefreshService, ImageRefreshBusyError } from '../modules/admin/services/crew-image-refresh.service';
import { ContentSourceRepository } from '../modules/admin/datasources/content-source.repository';
import { TeamContentRepository } from '../modules/team/datasources/team-content.repository';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (url.hostname !== '127.0.0.1' || url.port !== '55439' || url.pathname !== '/ahp_admin_features_test' || url.searchParams.get('schema') !== 'image_test') throw new Error('Disposable local image_test schema only');
  const prisma = new PrismaClient();
  const ids = Array.from({ length: 5 }, () => randomUUID());
  const pages = ids.map(() => randomUUID());
  const jobs: string[] = [];
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const called: string[] = [];
  const source = { async getImageUrl(pageId: string) {
    called.push(pageId); await barrier;
    if (pageId === pages[1]) throw new Error('synthetic private URL must never be exposed');
    return pageId === pages[3] ? null : 'https://example.test/latest';
  } };
  const storage = { async saveFromUrl(pageId: string) { return { publicUrl: `/assets/crew-profiles/${pageId}-new.png`, localPath: `/synthetic/${pageId}.png`, contentHash: 'synthetic', contentType: 'image/png', fileSize: 20 }; } };
  const service = new CrewImageRefreshService(prisma, source, storage);
  const waitForJob = async (id: string) => {
    for (let n = 0; n < 300; n++) { const job = await service.get(id); if (job?.status !== 'RUNNING') return job!; await new Promise((resolve) => setTimeout(resolve, 20)); }
    throw new Error('test timeout');
  };
  try {
    for (let i = 0; i < ids.length; i++) await prisma.crewSource.create({ data: { id: ids[i], sourceKey: `image-test:${ids[i]}`, name: `Test ${i}`, primaryNotionPageId: i === 2 ? null : pages[i], profileImageUrl: 'old-image', lastSyncedAt: new Date(), adminProfile: { create: { isVisible: true, description: 'preserved', univJoinedYearOverride: '2021' } } } });
    const before = await prisma.crewAdminProfile.findMany({ where: { crewSourceId: { in: ids } }, orderBy: { crewSourceId: 'asc' } });
    await assert.rejects(service.start([], 'test-admin'));
    await assert.rejects(service.start([ids[0], ids[0]], 'test-admin'));
    const started = await service.start(ids.slice(0, 4), 'test-admin'); jobs.push(started.id);
    assert.equal(started.processed, 0);
    await assert.rejects(service.start([ids[4]], 'test-admin'), ImageRefreshBusyError);
    release();
    const finished = await waitForJob(started.id);
    assert.equal(finished.status, 'PARTIAL_FAILED');
    assert.deepEqual([finished.total, finished.processed, finished.succeeded, finished.failed, finished.skipped], [4, 4, 1, 1, 2]);
    assert.ok(!JSON.stringify(finished).includes('https://'));
    assert.ok(!called.includes(pages[4]));
    assert.equal(await prisma.crewProfileImageCache.count({ where: { notionPageId: { in: pages } } }), 1);
    for (const id of ids.slice(1)) assert.equal((await prisma.crewSource.findUniqueOrThrow({ where: { id } })).profileImageUrl, 'old-image');
    assert.deepEqual(await prisma.crewAdminProfile.findMany({ where: { crewSourceId: { in: ids } }, orderBy: { crewSourceId: 'asc' } }), before);
    const publicRepo = new TeamContentRepository(prisma);
    assert.equal((await publicRepo.getCrewDetail(ids[0])).profile.url, `/assets/crew-profiles/${pages[0]}-new.png`);
    // Ordinary Notion sync can change its source URL without destroying the durable cache selection.
    await new ContentSourceRepository(prisma).upsertCrewSource({ sourceKey: `image-test:${ids[0]}`, primaryNotionPageId: pages[0], name: 'Refreshed source', email: null, profileAccountIds: [], profileImageUrl: 'https://example.test/expiring', notionDescription: null, joinedGen: 1, sourcePayload: {}, lastSyncedAt: new Date() });
    assert.equal((await publicRepo.getCrewList()).data.find((x) => x.crewId === ids[0])?.profile.url, `/assets/crew-profiles/${pages[0]}-new.png`);
    const stale = await prisma.crewImageRefreshJob.create({ data: { activeKey: 'crew-profile-images', owner: 'dead-instance', requestedBy: 'test-admin', leaseUntil: new Date(0), items: { create: { crewId: ids[0], crewName: 'Test', status: 'RUNNING' } } } }); jobs.push(stale.id);
    assert.equal((await service.get(stale.id))?.status, 'INTERRUPTED');
    assert.equal((await service.get(stale.id))?.failed, 1);
    const retry = await service.start([ids[0]], 'test-admin'); jobs.push(retry.id);
    assert.equal((await waitForJob(retry.id)).status, 'SUCCEEDED');
    console.log('crew-image-integration:ok (selection, partial failure, progress, duplicate lock, stale recovery, retry, public cache, admin preservation)');
  } finally {
    release(); await service.close();
    await prisma.crewImageRefreshJob.deleteMany({ where: { id: { in: jobs } } });
    await prisma.crewProfileImageCache.deleteMany({ where: { notionPageId: { in: pages } } });
    await prisma.crewSource.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error('crew-image-integration:failed', error instanceof assert.AssertionError ? error.message : 'test execution error'); process.exitCode = 1; });
