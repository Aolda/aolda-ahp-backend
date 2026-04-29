import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints/blocks';

export function extractImageUrl(block: BlockObjectResponse): string | null {
  if (block.type !== 'image') {
    return null;
  }

  return block.image.type === 'external' ? block.image.external.url : block.image.file.url;
}

export function extractPlainTextFromBlock(block: BlockObjectResponse): string {
  switch (block.type) {
    case 'paragraph':
      return block.paragraph.rich_text.map((item) => item.plain_text).join('');
    case 'heading_1':
      return block.heading_1.rich_text.map((item) => item.plain_text).join('');
    case 'heading_2':
      return block.heading_2.rich_text.map((item) => item.plain_text).join('');
    case 'heading_3':
      return block.heading_3.rich_text.map((item) => item.plain_text).join('');
    case 'bulleted_list_item':
      return block.bulleted_list_item.rich_text.map((item) => item.plain_text).join('');
    case 'numbered_list_item':
      return block.numbered_list_item.rich_text.map((item) => item.plain_text).join('');
    case 'quote':
      return block.quote.rich_text.map((item) => item.plain_text).join('');
    case 'callout':
      return block.callout.rich_text.map((item) => item.plain_text).join('');
    default:
      return '';
  }
}
