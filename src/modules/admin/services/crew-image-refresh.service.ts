import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient, type CrewImageRefreshItem } from '@prisma/client';
import type { ProfileImageFileStorage } from '../../team/datasources/profile-image-file-storage';

const ACTIVE_KEY = 'crew-profile-images';
const LEASE_MS = 90_000;
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
export class ImageRefreshBusyError extends Error {
  constructor(readonly jobId: string) { super('이미지 갱신 작업이 이미 진행 중입니다.'); }
}
export class CrewImageRefreshService {
  private readonly owner = randomUUID();
  private stopping = false;
  private readonly running = new Set<Promise<void>>();
  constructor(private readonly prisma: PrismaClient,
    private readonly source: { getImageUrl(pageId: string): Promise<string | null> },
    private readonly storage: Pick<ProfileImageFileStorage, 'saveFromUrl'>) {}

  async recoverExpired() {
    await this.prisma.$transaction(async (tx) => {
      const expired = await tx.crewImageRefreshJob.findMany({ where: { activeKey: ACTIVE_KEY, leaseUntil: { lt: new Date() } }, select: { id: true } });
      for (const { id } of expired) {
        const result = await tx.crewImageRefreshJob.updateMany({ where: { id, activeKey: ACTIVE_KEY, leaseUntil: { lt: new Date() } },
          data: { status: 'INTERRUPTED', activeKey: null, finishedAt: new Date() } });
        if (result.count) await tx.crewImageRefreshItem.updateMany({ where: { jobId: id, status: { in: ['PENDING', 'RUNNING'] } },
          data: { status: 'FAILED', message: '서버 작업이 중단되었습니다. 다시 선택해 갱신해 주세요.', finishedAt: new Date() } });
      }
    });
  }

  async start(crewIds: string[], requestedBy: string) {
    if (this.stopping) throw new Error('서버가 종료 중입니다. 잠시 후 다시 시도해 주세요.');
    if (!Array.isArray(crewIds) || !crewIds.length || crewIds.length > 1000 || crewIds.some((id) => typeof id !== 'string' || !UUID.test(id)) || new Set(crewIds).size !== crewIds.length) throw new Error('1~1000명의 크루를 중복 없이 선택해 주세요.');
    await this.recoverExpired();
    const crews = await this.prisma.crewSource.findMany({ where: { id: { in: crewIds }, sourceArchived: false }, select: { id: true, name: true, primaryNotionPageId: true } });
    if (crews.length !== crewIds.length) throw new Error('선택한 크루가 변경되었습니다. 목록을 새로고침해 주세요.');
    let job;
    try {
      job = await this.prisma.crewImageRefreshJob.create({ data: {
        activeKey: ACTIVE_KEY, owner: this.owner, requestedBy, leaseUntil: new Date(Date.now() + LEASE_MS),
        items: { create: crews.map((crew) => ({ crewId: crew.id, crewName: crew.name, notionPageId: crew.primaryNotionPageId })) },
      }, include: { items: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const active = await this.prisma.crewImageRefreshJob.findUnique({ where: { activeKey: ACTIVE_KEY } });
        if (active) throw new ImageRefreshBusyError(active.id);
      }
      throw error;
    }
    const work = this.run(job.id, job.items).catch(async () => {
      await this.interrupt(job.id).catch(() => undefined);
    });
    this.running.add(work);
    void work.finally(() => this.running.delete(work));
    return this.toView(job);
  }

  async get(id?: string) {
    await this.recoverExpired();
    const job = id
      ? await this.prisma.crewImageRefreshJob.findUnique({ where: { id }, include: { items: { orderBy: { crewName: 'asc' } } } })
      : await this.prisma.crewImageRefreshJob.findFirst({ orderBy: { createdAt: 'desc' }, include: { items: { orderBy: { crewName: 'asc' } } } });
    return job ? this.toView(job) : null;
  }

  private toView(job: { id: string; status: string; createdAt: Date; finishedAt: Date | null; items: CrewImageRefreshItem[] }) {
    const count = (status: string) => job.items.filter((x) => x.status === status).length;
    const succeeded = count('SUCCEEDED'), failed = count('FAILED'), skipped = count('SKIPPED');
    return { id: job.id, status: job.status, total: job.items.length, processed: succeeded + failed + skipped,
      succeeded, failed, skipped, createdAt: job.createdAt, finishedAt: job.finishedAt,
      items: job.items.map(({ crewId, crewName, status, message }) => ({ crewId, crewName, status, message })) };
  }

  private async assertLease(tx: Prisma.TransactionClient, id: string) {
    const result = await tx.crewImageRefreshJob.updateMany({ where: { id, owner: this.owner, activeKey: ACTIVE_KEY, leaseUntil: { gt: new Date() } },
      data: { leaseUntil: new Date(Date.now() + LEASE_MS) } });
    if (!result.count) throw new Error('Job lease was lost');
  }

  private async finishItem(jobId: string, itemId: string, status: string, message: string) {
    await this.prisma.$transaction(async (tx) => {
      await this.assertLease(tx, jobId);
      await tx.crewImageRefreshItem.update({ where: { id: itemId }, data: { status, message, finishedAt: new Date() } });
    });
  }

  private async processItem(jobId: string, item: CrewImageRefreshItem) {
    if (!item.notionPageId) return this.finishItem(jobId, item.id, 'SKIPPED', 'Notion 페이지가 연결되지 않았습니다. 기존 이미지를 유지합니다.');
    await this.prisma.$transaction(async (tx) => {
      await this.assertLease(tx, jobId);
      await tx.crewImageRefreshItem.update({ where: { id: item.id }, data: { status: 'RUNNING' } });
    });
    try {
      const sourceUrl = await this.source.getImageUrl(item.notionPageId);
      if (!sourceUrl) return await this.finishItem(jobId, item.id, 'SKIPPED', 'Notion 이미지가 없습니다. 기존 이미지를 유지합니다.');
      const stored = await this.storage.saveFromUrl(item.notionPageId, sourceUrl);
      await this.prisma.$transaction(async (tx) => {
        await this.assertLease(tx, jobId);
        const changed = await tx.crewSource.updateMany({ where: { id: item.crewId, primaryNotionPageId: item.notionPageId, sourceArchived: false },
          data: { profileImageUrl: stored.publicUrl, profileImageCacheUrl: stored.publicUrl } });
        if (!changed.count) throw new Error('Crew linkage changed');
        const cache = { imageUrl: stored.publicUrl, sourceImageUrl: sourceUrl, localPath: stored.localPath,
          contentType: stored.contentType, contentHash: stored.contentHash, fileSize: stored.fileSize, lastSyncedAt: new Date() };
        await tx.crewProfileImageCache.upsert({ where: { notionPageId: item.notionPageId! }, create: { notionPageId: item.notionPageId!, ...cache }, update: cache });
        await tx.crewImageRefreshItem.update({ where: { id: item.id }, data: { status: 'SUCCEEDED', message: '최신 이미지를 저장했습니다.', finishedAt: new Date() } });
      });
    } catch {
      await this.finishItem(jobId, item.id, 'FAILED', '이미지를 갱신하지 못했습니다. Notion 권한·이미지 형식·네트워크를 확인하세요. 기존 이미지는 유지됩니다.');
    }
  }

  private async run(id: string, items: CrewImageRefreshItem[]) {
    const heartbeat = setInterval(() => {
      void this.prisma.crewImageRefreshJob.updateMany({ where: { id, owner: this.owner, activeKey: ACTIVE_KEY, leaseUntil: { gt: new Date() } },
        data: { leaseUntil: new Date(Date.now() + LEASE_MS) } }).catch(() => undefined);
    }, 15_000);
    heartbeat.unref();
    try {
      let next = 0;
      const workers = await Promise.allSettled([0, 1].map(async () => {
        while (!this.stopping && next < items.length) await this.processItem(id, items[next++]);
      }));
      if (workers.some((x) => x.status === 'rejected')) throw new Error('Image worker interrupted');
      if (this.stopping) return await this.interrupt(id);
      await this.prisma.$transaction(async (tx) => {
        await this.assertLease(tx, id);
        const failed = await tx.crewImageRefreshItem.count({ where: { jobId: id, status: 'FAILED' } });
        await tx.crewImageRefreshJob.update({ where: { id }, data: { status: failed ? 'PARTIAL_FAILED' : 'SUCCEEDED', activeKey: null, finishedAt: new Date() } });
      });
    } finally { clearInterval(heartbeat); }
  }

  private async interrupt(id: string) {
    await this.prisma.$transaction(async (tx) => {
      const result = await tx.crewImageRefreshJob.updateMany({ where: { id, owner: this.owner, activeKey: ACTIVE_KEY }, data: { status: 'INTERRUPTED', activeKey: null, finishedAt: new Date() } });
      if (result.count) await tx.crewImageRefreshItem.updateMany({ where: { jobId: id, status: { in: ['PENDING', 'RUNNING'] } },
        data: { status: 'FAILED', message: '서버 작업이 중단되었습니다. 다시 선택해 주세요.', finishedAt: new Date() } });
    });
  }

  async close() {
    this.stopping = true;
    await Promise.allSettled([...this.running]);
  }
}
