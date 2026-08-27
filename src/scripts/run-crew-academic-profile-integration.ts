import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { ContentSourceRepository } from '../modules/admin/datasources/content-source.repository';
import { AdminContentService } from '../modules/admin/services/admin-content.service';
import { NotionContentSyncService } from '../modules/admin/services/notion-content-sync.service';
import { TeamContentRepository } from '../modules/team/datasources/team-content.repository';
import { academicNotionFixture, crewPage, profilePage } from './fixtures/crew-academic-profile';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/ahp_crew_year_test') {
    throw new Error('Only the disposable local ahp_crew_year_test database is allowed');
  }
  const prisma = new PrismaClient();
  const suffix = randomUUID();
  const account = `fixture-${suffix}`;
  const sourceKey = `person:${account}`;
  const projectId = randomUUID();
  const profiles = [profilePage(`profile-${suffix}`, [account], null, '202112345')];
  const fixture = academicNotionFixture([crewPage(`crew-${suffix}`, [account])], profiles);
  const sync = new NotionContentSyncService(fixture.client,
    { crew: 'fixture-crews', crewProfile: 'fixture-profiles' }, new ContentSourceRepository(prisma));
  const admin = new AdminContentService(prisma);
  const publicRepository = new TeamContentRepository(prisma);

  try {
    await sync.syncCrews();
    const crew = await prisma.crewSource.findUniqueOrThrow({ where: { sourceKey }, include: { adminProfile: true } });
    assert.equal(crew.univJoinedYear, '2021');
    assert.equal(crew.univDepartment, '소프트웨어학과');
    assert.equal(crew.adminProfile?.isVisible, false);

    await admin.updateCrew(crew.id, { isVisible: true, description: 'keep this administrator edit',
      univJoinedYearOverride: '202012345', univDepartmentOverride: '관리자학과' });
    await prisma.projectSource.create({ data: {
      id: projectId, notionPageId: `project-${suffix}`, titleKo: 'Synthetic academic-profile test',
      lastSyncedAt: new Date(), adminProfile: { create: { isVisible: true } },
      participantOverrides: { create: { crewSourceId: crew.id, isVisible: true } },
    } });
    // Repeated collection must refresh source data without touching administrator ownership.
    fixture.state.profiles = [profilePage(`profile-${suffix}`, [account], null, '202212345', '변경학과')];
    await sync.syncCrews();
    const updated = await prisma.crewSource.findUniqueOrThrow({ where: { sourceKey }, include: { adminProfile: true } });
    assert.equal(updated.id, crew.id);
    assert.equal(updated.univJoinedYear, '2022');
    assert.equal(updated.adminProfile?.univJoinedYearOverride, '2020');
    assert.equal(updated.adminProfile?.isVisible, true);
    assert.equal(updated.adminProfile?.description, 'keep this administrator edit');
    assert.equal((await publicRepository.getCrewList()).data.find((x) => x.crewId === crew.id)?.univJoinedYear, '2020');
    assert.equal((await publicRepository.getCrewDetail(crew.id)).univDepartment, '관리자학과');
    assert.equal((await publicRepository.getProjectDetail(projectId)).participants[0].univJoinedYear, '2020');

    // Omitting fields must preserve overrides; clearing them must reveal normalized source data.
    await admin.updateCrew(crew.id, { description: 'another edit' });
    assert.equal((await publicRepository.getCrewDetail(crew.id)).univJoinedYear, '2020');
    await assert.rejects(admin.updateCrew(crew.id, { univJoinedYearOverride: '0000' }), /Invalid admission year/);
    await admin.updateCrew(crew.id, { univJoinedYearOverride: null, univDepartmentOverride: null });
    assert.equal((await publicRepository.getCrewDetail(crew.id)).univJoinedYear, '2022');
    assert.equal((await publicRepository.getProjectDetail(projectId)).participants[0].univDepartment, '변경학과');

    fixture.state.profiles = []; // A disappeared/unmatched profile must not blank previously saved values.
    await sync.syncCrews();
    assert.equal((await publicRepository.getCrewDetail(crew.id)).univJoinedYear, '2022');
    assert.equal(await prisma.crewSource.count({ where: { sourceKey } }), 1);
    console.log('crew-academic-profile-integration:ok (source sync, list/detail/participants, overrides, resync)');
  } finally {
    // Only uniquely named fixtures from this run are removed.
    await prisma.projectSource.deleteMany({ where: { id: projectId } });
    await prisma.crewSource.deleteMany({ where: { sourceKey } });
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
