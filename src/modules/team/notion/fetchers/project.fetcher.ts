import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export class ProjectFetcher {
  constructor(
    private readonly notionClient: Client,
    private readonly databaseId: string,
  ) {}

  async fetchAll(): Promise<PageObjectResponse[]> {
    // TODO: 100건 초과 시 start_cursor를 이용한 페이지네이션 처리 필요
    const response = await this.notionClient.databases.query({
      database_id: this.databaseId,
    });
    return response.results.filter(
      (page): page is PageObjectResponse => page.object === 'page' && 'properties' in page,
    );
  }
}
