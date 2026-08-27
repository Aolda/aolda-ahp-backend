import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { CrewCsvImportService } from '../modules/admin/services/crew-csv-import.service';
import { ContentSourceRepository } from '../modules/admin/datasources/content-source.repository';
import { AdminContentService } from '../modules/admin/services/admin-content.service';
import { TeamContentRepository } from '../modules/team/datasources/team-content.repository';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (url.hostname !== '127.0.0.1' || url.port !== '55439' || url.pathname !== '/ahp_admin_features_test') throw new Error('Disposable local test database only');
  const prisma = new PrismaClient();
  const service = new CrewCsvImportService(prisma, 'local-test-only');
  const suffix = randomUUID();
  const notionId = randomUUID();
  const email = `${suffix}@example.test`;
  let crewId: string | undefined;
  const projectId = randomUUID();
  try {
    const csv = `name,email,joinedGen,univDepartment,univJoinedYear,description,notionPageId\n테스트,${email},0,테스트학과,2021,관리자소개,${notionId}`;
    const preview = await service.preview(csv, 'create', 'admin');
    assert.equal(preview.valid, true);
    await assert.rejects(service.commit(csv, 'create', 'other-admin', preview.token!));
    await assert.rejects(service.commit(csv + '\n', 'create', 'admin', preview.token!));
    assert.deepEqual(await service.commit(csv, 'create', 'admin', preview.token!), { created: 1, updated: 0 });
    const crew = await prisma.crewSource.findFirstOrThrow({ where: { email }, include: { adminProfile: true } });
    crewId = crew.id;
    assert.equal(crew.adminProfile?.isVisible, false);
    assert.equal(crew.adminProfile?.joinedGenOverride, 0);
    await assert.rejects(service.commit(csv, 'create', 'admin', preview.token!)); // Replay cannot duplicate rows.
    const update = `crewId,name,isVisible\n${crew.id},관리자수정,true`;
    const updatePreview = await service.preview(update, 'update', 'admin');
    await service.commit(update, 'update', 'admin', updatePreview.token!);
    const sourceRepo = new ContentSourceRepository(prisma);
    await sourceRepo.upsertCrewSource({ sourceKey: `person:${suffix}`, primaryNotionPageId: notionId,
      profileAccountIds: [], name: 'Notion 변경', email: 'changed@example.test', profileImageUrl: null,
      notionDescription: null, joinedGen: 5, univDepartment: 'Notion 학과', univJoinedYear: '2022',
      sourcePayload: {}, lastSyncedAt: new Date() });
    assert.equal(await prisma.crewSource.count({ where: { primaryNotionPageId: notionId } }), 1);
    const publicRepo = new TeamContentRepository(prisma);
    const detail = await publicRepo.getCrewDetail(crew.id);
    assert.equal(detail.crewName, '관리자수정');
    assert.equal(detail.crewEmail, email);
    assert.equal(detail.joinedGen, 0);
    assert.equal(detail.univJoinedYear, '2021');
    assert.equal(detail.description, '관리자소개');
    const admin = new AdminContentService(prisma);
    assert.equal((await admin.getCrew(crew.id))?.name, '관리자수정');
    await prisma.projectSource.create({ data: { id: projectId, notionPageId: randomUUID(), titleKo: 'fixture', lastSyncedAt: new Date(),
      adminProfile: { create: { isVisible: true } }, participantOverrides: { create: { crewSourceId: crew.id } } } });
    assert.equal((await publicRepo.getProjectDetail(projectId)).participants[0].crewName, '관리자수정');
    const stale = await service.preview(update, 'update', 'admin');
    await admin.updateCrew(crew.id, { description: '다른 관리자 변경' });
    await assert.rejects(service.commit(update, 'update', 'admin', stale.token!));
    const duplicate = await service.preview(`name,email\na,${email}`, 'create', 'admin');
    assert.equal(duplicate.valid, false);
    assert.equal(duplicate.token, null);
    // Fault injected after the real first write: the entire interactive transaction must roll back.
    const rollbackEmail = `rollback-${email}`;
    const twoRows = `name,email\na,${rollbackEmail}\nb,b-${email}`;
    const twoPreview = await service.preview(twoRows, 'create', 'admin');
    const failingPrisma = prisma.$extends({ query: { crewSource: { async create({ args, query }) {
      if (args.data.name === 'b') throw new Error('synthetic write failure');
      return query(args);
    } } } });
    await assert.rejects(new CrewCsvImportService(failingPrisma as unknown as PrismaClient, 'local-test-only').commit(twoRows, 'create', 'admin', twoPreview.token!));
    assert.equal(await prisma.crewSource.count({ where: { email: rollbackEmail } }), 0);
    console.log('crew-csv-integration:ok (atomicity, preview binding/replay, ownership, linking, public list/detail/participants)');
  } finally {
    await prisma.projectSource.deleteMany({ where: { id: projectId } });
    if (crewId) await prisma.crewSource.deleteMany({ where: { id: crewId } });
    await prisma.$disconnect();
  }
}
main().catch(() => { console.error('crew-csv-integration:failed'); process.exitCode = 1; });
