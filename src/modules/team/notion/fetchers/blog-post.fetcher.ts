import { Client } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints/blocks';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import { extractPlainTextFromBlock } from '../extractors/notion-block.extractor';

export class BlogPostFetcher {
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

  async fetchMarkdownContent(pageId: string): Promise<string | null> {
    const blocks = await this.fetchBlockChildren(pageId);
    const lines = blocks
      .map((block, index) => this.blockToMarkdownLine(block, index))
      .filter((line) => line.length > 0);

    return lines.length > 0 ? lines.join('\n\n') : null;
  }

  private async fetchBlockChildren(blockId: string): Promise<BlockObjectResponse[]> {
    const blocks: BlockObjectResponse[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.notionClient.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      });

      blocks.push(
        ...response.results.filter(
          (block): block is BlockObjectResponse => block.object === 'block' && 'type' in block,
        ),
      );

      cursor = response.next_cursor ?? undefined;
    } while (cursor);

    return blocks;
  }

  private blockToMarkdownLine(block: BlockObjectResponse, index: number): string {
    const text = extractPlainTextFromBlock(block).trim();
    if (!text) {
      return '';
    }

    switch (block.type) {
      case 'heading_1':
        return `# ${text}`;
      case 'heading_2':
        return `## ${text}`;
      case 'heading_3':
        return `### ${text}`;
      case 'bulleted_list_item':
        return `- ${text}`;
      case 'numbered_list_item':
        return `${index + 1}. ${text}`;
      case 'quote':
        return `> ${text}`;
      default:
        return text;
    }
  }
}
