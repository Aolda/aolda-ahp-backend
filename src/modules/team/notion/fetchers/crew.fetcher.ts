import { Client } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints/blocks';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { CrewDetailResponse, CrewListResponse } from '../../repositories/team.repository';
import {
  extractCrewEmail,
  extractCrewName,
  extractGenerationNumbers,
  extractUnivDepartment,
  extractUnivJoinedYear,
  isCurrentActiveCrew,
} from '../extractors/crew-page.extractor';
import { extractImageUrl, extractPlainTextFromBlock } from '../extractors/notion-block.extractor';

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
      crewEmail: extractCrewEmail(targetPage),
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
    return pages.filter(isCurrentActiveCrew);
  }

  private async buildCrewListItem(page: PageObjectResponse, index: number): Promise<CrewListItem> {
    const generations = extractGenerationNumbers(page);
    const profileUrl = (await this.findFirstImageUrl(page.id)) ?? DUMMY_PROFILE_URL;

    return {
      // TODO(dummy): Notion 원본 ID -> API crewId 매핑 규칙이 아직 없어서 임시 순번을 사용합니다.
      crewId: index + 1,
      // TODO(dummy): 페이지 본문에서 이미지를 찾지 못한 경우에만 더미 URL을 사용합니다.
      profile: { url: profileUrl },
      crewName: extractCrewName(page),
      crewLog: generations.map((generation) => ({
        generation,
        // TODO(dummy): 역할 정보는 추가 조회 전까지 더미값입니다.
        type: 'CREW_ROLE/DUMMY_NOT_FETCHED_YET',
        // TODO(dummy): 부서 정보는 추가 조회 전까지 더미값입니다.
        department: 'DEPARTMENT_TYPE/DUMMY_NOT_FETCHED_YET',
      })),
      isActive: isCurrentActiveCrew(page),
      joinedGen: generations[0] ?? 0,
      univDepartment: extractUnivDepartment(page),
      univJoinedYear: extractUnivJoinedYear(page),
      // TODO(dummy): 활동 수는 관련 데이터소스 조회 전까지 더미값입니다.
      totalActivities: 0,
      // TODO(dummy): 블로깅 수는 관련 데이터소스 조회 전까지 더미값입니다.
      totalBloggings: 0,
    };
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
