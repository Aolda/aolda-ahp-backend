import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { CrewListResponse } from '../../repositories/team.repository';

// TODO: Notion DB 스키마 확인 후 프로퍼티 매핑 구현
export function mapCrewPages(_pages: PageObjectResponse[]): CrewListResponse {
  throw new Error('Not implemented: crew.mapper');
}
