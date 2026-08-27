import type { Client } from '@notionhq/client';
import { CrewFetcher } from './fetchers/crew.fetcher';

export class CrewImageSource {
  constructor(private readonly client: Client, private readonly crewDataSourceId: string) {}
  async getImageUrl(pageId: string): Promise<string | null> {
    const page = await this.client.pages.retrieve({ page_id: pageId });
    if (!('parent' in page) || page.archived || page.in_trash || page.parent.type !== 'data_source_id'
      || page.parent.data_source_id.replace(/-/g, '') !== this.crewDataSourceId.replace(/-/g, '')) {
      throw new Error('Not an active page in the configured Crew datasource');
    }
    // Same precedence as regular Crew sync: page icon, then the first image in its content.
    const source = await new CrewFetcher(this.client, this.crewDataSourceId).fetchPageSource(page);
    return source.profileImageUrl;
  }
}
