import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

export class CrewProfileFetcher {
  constructor(
    private readonly notionClient: Client,
    private readonly dataSourceId: string,
  ) {}

  async fetchPages(): Promise<PageObjectResponse[]> {
    const pages: PageObjectResponse[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.notionClient.dataSources.query({
        data_source_id: this.dataSourceId,
        start_cursor: cursor,
        page_size: 100,
      });

      pages.push(
        ...response.results.filter(
          (page): page is PageObjectResponse => page.object === 'page' && 'properties' in page,
        ),
      );

      cursor = response.next_cursor ?? undefined;
    } while (cursor);

    return pages;
  }
}
