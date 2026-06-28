import type { PrismaClient } from '@prisma/client';
import type { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

import {
  extractCrewWritingTerm,
  extractProfileAccountIds,
} from '../../team/notion/extractors/crew-page.extractor';
import { CrewFetcher } from '../../team/notion/fetchers/crew.fetcher';

export interface CrewTermTeamWriteInput {
  generation: number;
  activityTerm: string;
  teamName: string;
}

export interface CrewTermTeamWriteResult {
  generation: number;
  activityTerm: string;
  teamName: string;
  notionPageId: string | null;
  status: 'synced' | 'failed';
  message?: string;
}

export class NotionCrewTeamWriteService {
  constructor(
    private readonly notionClient: Client,
    private readonly crewDataSourceId: string,
    private readonly prisma: PrismaClient,
  ) {}

  async writeCrewTermTeams(
    crewSourceId: string,
    items: CrewTermTeamWriteInput[],
  ): Promise<CrewTermTeamWriteResult[]> {
    const crewSource = await this.prisma.crewSource.findUnique({
      where: { id: crewSourceId },
      select: { profileAccountIds: true },
    });

    if (!crewSource) {
      throw new Error(`Crew source not found: ${crewSourceId}`);
    }

    const crewProfileAccountIds = this.parseStringArray(crewSource.profileAccountIds);
    const pages = await new CrewFetcher(this.notionClient, this.crewDataSourceId).fetchPages();

    const results: CrewTermTeamWriteResult[] = [];
    for (const item of items) {
      const targetPage = this.findCrewTermPage(pages, item.activityTerm, crewProfileAccountIds);
      if (!targetPage) {
        const message = `Crew page not found for term ${item.activityTerm}`;
        await this.markFailed(crewSourceId, item, message);
        results.push({ ...item, notionPageId: null, status: 'failed', message });
        continue;
      }

      try {
        await this.notionClient.pages.update({
          page_id: targetPage.id,
          properties: {
            팀: {
              select: {
                name: item.teamName,
              },
            },
          } as any,
        });
        await this.markSynced(crewSourceId, item);
        results.push({ ...item, notionPageId: targetPage.id, status: 'synced' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Notion write failed';
        await this.markFailed(crewSourceId, item, message);
        results.push({ ...item, notionPageId: targetPage.id, status: 'failed', message });
      }
    }

    return results;
  }

  private findCrewTermPage(
    pages: PageObjectResponse[],
    activityTerm: string,
    crewProfileAccountIds: string[],
  ): PageObjectResponse | null {
    for (const page of pages) {
      if (extractCrewWritingTerm(page) !== activityTerm) {
        continue;
      }

      const pageProfileAccountIds = extractProfileAccountIds(page);
      if (pageProfileAccountIds.some((id) => crewProfileAccountIds.includes(id))) {
        return page;
      }
    }

    return null;
  }

  private async markSynced(
    crewSourceId: string,
    item: CrewTermTeamWriteInput,
  ): Promise<void> {
    await this.prisma.crewTermTeamOverride.update({
      where: {
        crewSourceId_generation: {
          crewSourceId,
          generation: item.generation,
        },
      },
      data: {
        notionSyncedAt: new Date(),
        notionWriteFailedAt: null,
        notionWriteError: null,
      },
    });
  }

  private async markFailed(
    crewSourceId: string,
    item: CrewTermTeamWriteInput,
    message: string,
  ): Promise<void> {
    await this.prisma.crewTermTeamOverride.update({
      where: {
        crewSourceId_generation: {
          crewSourceId,
          generation: item.generation,
        },
      },
      data: {
        notionWriteFailedAt: new Date(),
        notionWriteError: message,
      },
    });
  }

  private parseStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }
}
