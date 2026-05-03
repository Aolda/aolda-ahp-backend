import { Client } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints/blocks';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import { extractImageUrl, extractPlainTextFromBlock } from '../extractors/notion-block.extractor';
import type { CrewDetailSource, CrewPageSource } from '../types/crew-source';

const DUMMY_DESCRIPTION = 'DUMMY_DESCRIPTION_NOT_FETCHED_YET';

export class CrewFetcher {
  constructor(
    private readonly notionClient: Client,
    private readonly dataSourceId: string,
  ) {}

  async fetchPages(): Promise<PageObjectResponse[]> {
    return this.fetchAllPages();
  }

  async fetchPageSource(page: PageObjectResponse): Promise<CrewPageSource> {
    return {
      page,
      profileImageUrl: await this.findFirstImageUrl(page.id),
    };
  }

  async fetchDetailSource(page: PageObjectResponse): Promise<CrewDetailSource> {
    const pageSource = await this.fetchPageSource(page);

    return {
      ...pageSource,
      description: await this.fetchCrewDescription(page.id),
    };
  }

  private async fetchAllPages(): Promise<PageObjectResponse[]> {
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

  private async fetchCrewDescription(pageId: string): Promise<string> {
    // TODO: description이 여러 depth의 block에 걸쳐 있으면 재귀 조회로 확장해야 합니다.
    const blocks = await this.fetchBlockChildren(pageId);

    const description = blocks
      .map((block) => extractPlainTextFromBlock(block))
      .filter((text) => text.length > 0)
      .join('\n')
      .trim();

    if (description.length > 0) {
      return description;
    }

    // TODO(dummy): page 본문에서 description을 추출하지 못한 경우 placeholder 값을 사용합니다.
    return DUMMY_DESCRIPTION;
  }

  private async fetchBlockChildren(blockId: string): Promise<BlockObjectResponse[]> {
    const blocks: BlockObjectResponse[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.notionClient.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
      });

      const pageBlocks = response.results.filter(
        (block): block is BlockObjectResponse => block.object === 'block' && 'type' in block,
      );

      blocks.push(...pageBlocks);
      cursor = response.next_cursor ?? undefined;
    } while (cursor);

    return blocks;
  }

  private async findFirstImageUrl(blockId: string): Promise<string | null> {
    const blocks = await this.fetchBlockChildren(blockId);

    for (const block of blocks) {
      const imageUrl = extractImageUrl(block);
      if (imageUrl) {
        return imageUrl;
      }

      if (block.has_children) {
        const childImageUrl = await this.findFirstImageUrl(block.id);
        if (childImageUrl) {
          return childImageUrl;
        }
      }
    }

    return null;
  }
}
