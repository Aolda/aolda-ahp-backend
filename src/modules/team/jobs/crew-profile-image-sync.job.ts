import type { FastifyBaseLogger } from 'fastify';
import { TeamRealRepository } from '../datasources/team-real.repository';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export class CrewProfileImageSyncJob {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly teamRealRepository: TeamRealRepository,
    private readonly logger?: FastifyBaseLogger,
  ) {}

  start(): void {
    void this.runOnce();
    this.timer = setInterval(() => {
      void this.runOnce();
    }, TWELVE_HOURS_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async runOnce(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const syncedCount = await this.teamRealRepository.syncCrewProfileImageCache();
      this.logger?.info({ syncedCount }, 'Crew profile image cache sync completed');
    } catch (error) {
      this.logger?.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        'Crew profile image cache sync failed',
      );
    } finally {
      this.running = false;
    }
  }
}
