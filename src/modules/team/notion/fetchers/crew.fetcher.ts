import { Client } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints/blocks';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { CrewDetailResponse, CrewListResponse } from '../../repositories/team.repository';

const ACTIVE_GENERATION = '2026-1';
const DUMMY_DESCRIPTION = 'DUMMY_DESCRIPTION_NOT_FETCHED_YET';
const DUMMY_PROFILE_URL = 'https://dummy.aolda.local/profiles/not-fetched-yet.jpg';

type CrewListItem = CrewListResponse['data'][number];
type CrewDetailItem = CrewDetailResponse;

export class CrewFetcher {
  constructor(
    private readonly notionClient: Client,
    private readonly dataSourceId: string,
  ) {}

  async fetchAll(): Promise<CrewListItem[]> {
    const pages = await this.fetchAllPages();
    const activePages = this.buildActiveCrewPages(pages);
    return Promise.all(activePages.map((page, index) => this.buildCrewListItem(page, index)));
  }

  async fetchDetail(crewId: string): Promise<CrewDetailItem> {
    const pages = await this.fetchAllPages();
    const activePages = this.buildActiveCrewPages(pages);

    // TODO(dummy): crewId는 active crew 목록 기준의 임시 순번이며, 아직 Notion 원본 ID와 1:1 매핑되지 않습니다.
    const targetIndex = Number(crewId) - 1;
    const targetPage = activePages[targetIndex];

    if (!targetPage) {
      throw new Error(`Crew not found: ${crewId}`);
    }

    const baseItem = await this.buildCrewListItem(targetPage, targetIndex);
    const description = await this.fetchCrewDescription(targetPage.id);

    return {
      ...baseItem,
      crewEmail: this.extractCrewEmail(targetPage),
      description,
      // TODO(dummy): 활동 데이터는 아직 별도 activity 데이터소스 연동 전이라 비워둔 mock 값입니다.
      activities: [],
      // TODO(dummy): 블로깅 데이터는 아직 별도 블로그/콘텐츠 연동 전이라 비워둔 mock 값입니다.
      bloggings: [],
      // TODO(dummy): 팔로우 관계 데이터는 아직 별도 소셜/관계 데이터 미연동 상태라 mock 값입니다.
      connections: {
        isFollowing: false,
        followers: 0,
        followings: 0,
      },
    };
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

  private buildActiveCrewPages(pages: PageObjectResponse[]): PageObjectResponse[] {
    return pages.filter((page) => this.isCurrentActiveCrew(page));
  }

  private isCurrentActiveCrew(page: PageObjectResponse): boolean {
    const activeGeneration = (page.properties['작성기수'] as { select?: { name?: string } }).select?.name;
    return activeGeneration === ACTIVE_GENERATION;
  }

  private async buildCrewListItem(page: PageObjectResponse, index: number): Promise<CrewListItem> {
    const generations = this.extractGenerationNumbers(page);
    const profileUrl = (await this.findFirstImageUrl(page.id)) ?? DUMMY_PROFILE_URL;

    return {
      // TODO(dummy): Notion 원본 ID -> API crewId 매핑 규칙이 아직 없어서 임시 순번을 사용합니다.
      crewId: index + 1,
      // TODO(dummy): 페이지 본문에서 이미지를 찾지 못한 경우에만 더미 URL을 사용합니다.
      profile: { url: profileUrl },
      crewName: this.extractCrewName(page),
      crewLog: generations.map((generation) => ({
        generation,
        // TODO(dummy): 역할 정보는 추가 조회 전까지 더미값입니다.
        type: 'CREW_ROLE/DUMMY_NOT_FETCHED_YET',
        // TODO(dummy): 부서 정보는 추가 조회 전까지 더미값입니다.
        department: 'DEPARTMENT_TYPE/DUMMY_NOT_FETCHED_YET',
      })),
      isActive: this.isCurrentActiveCrew(page),
      joinedGen: generations[0] ?? 0,
      univDepartment: this.extractUnivDepartment(page),
      univJoinedYear: this.extractUnivJoinedYear(page),
      // TODO(dummy): 활동 수는 관련 데이터소스 조회 전까지 더미값입니다.
      totalActivities: 0,
      // TODO(dummy): 블로깅 수는 관련 데이터소스 조회 전까지 더미값입니다.
      totalBloggings: 0,
    };
  }

  private extractCrewName(page: PageObjectResponse): string {
    const title = (page.properties.Name as { title?: Array<{ plain_text?: string }> }).title;
    return title?.[0]?.plain_text ?? 'UNKNOWN_CREW_NAME';
  }

  private extractUnivDepartment(page: PageObjectResponse): string {
    const department = (page.properties['학과'] as { select?: { name?: string } }).select?.name;
    return department ?? 'DUMMY_DEPARTMENT_NOT_FETCHED_YET';
  }

  private extractCrewEmail(page: PageObjectResponse): string {
    const portalIdProperty = page.properties['포털ID'] as
      | { rich_text?: Array<{ plain_text?: string }> }
      | undefined;
    const portalIdField = portalIdProperty?.rich_text?.[0];
    if (!portalIdField?.plain_text) {
      // TODO(dummy): 포털ID 필드를 찾지 못한 경우 placeholder 메일을 사용합니다.
      return 'dummy-email-not-fetched-yet@aolda.local';
    }

    const portalId = portalIdField.plain_text;
    return `${portalId}@ajou.ac.kr`;
  }

  private extractUnivJoinedYear(page: PageObjectResponse): string {
    const propertyCandidates = [
      page.properties['입학년도'] as { rich_text?: Array<{ plain_text?: string }>; number?: number; select?: { name?: string } },
      page.properties['학번'] as { rich_text?: Array<{ plain_text?: string }>; number?: number; select?: { name?: string } },
    ];

    for (const property of propertyCandidates) {
      const richTextValue = property?.rich_text?.[0]?.plain_text;
      if (richTextValue) {
        return richTextValue;
      }

      if (typeof property?.number === 'number') {
        return String(property.number);
      }

      if (property?.select?.name) {
        return property.select.name;
      }
    }

    // TODO(dummy): 입학년도/학번 필드는 현재 Notion 스키마 확인 전이라 placeholder 값을 사용합니다.
    return '00';
  }

  private extractGenerationNumbers(page: PageObjectResponse): number[] {
    const multiSelect = (page.properties['기수'] as { multi_select?: Array<{ name?: string }> }).multi_select;

    return (multiSelect ?? [])
      .map((value) => Number((value.name ?? '').slice(0, -1)))
      .filter((value) => !Number.isNaN(value))
      .sort((left, right) => left - right);
  }

  private async fetchCrewDescription(pageId: string): Promise<string> {
    // TODO: description이 여러 depth의 block에 걸쳐 있으면 재귀 조회로 확장해야 합니다.
    const blocks = await this.fetchBlockChildren(pageId);

    const description = blocks
      .map((block) => this.extractPlainTextFromBlock(block))
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
      const imageUrl = this.extractImageUrl(block);
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

  private extractImageUrl(block: BlockObjectResponse): string | null {
    if (block.type !== 'image') {
      return null;
    }

    return block.image.type === 'external' ? block.image.external.url : block.image.file.url;
  }

  private extractPlainTextFromBlock(block: BlockObjectResponse): string {
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
}
