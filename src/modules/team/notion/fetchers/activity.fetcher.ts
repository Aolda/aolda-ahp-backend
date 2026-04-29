import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { ActivityPageSource } from '../types/activity-source';

export class ActivityFetcher {
  constructor(
    private readonly notionClient: Client,
    private readonly dataSourceId: string,
  ) {}

  async fetchPages(): Promise<PageObjectResponse[]> {
    return this.fetchAllPages();
  }

  async fetchPageSource(page: PageObjectResponse): Promise<ActivityPageSource> {
    return { page };
  }

  async fetchAll(): Promise<PageObjectResponse[]> {
    return this.fetchAllPages();
  }

  private async fetchAllPages(): Promise<PageObjectResponse[]> {
    // TODO: 100건 초과 시 start_cursor를 이용한 페이지네이션 처리 필요
    const response = await this.notionClient.dataSources.query({
      data_source_id: this.dataSourceId,
    });
    return response.results.filter(
      (page): page is PageObjectResponse => page.object === 'page' && 'properties' in page,
    );
  }
}
