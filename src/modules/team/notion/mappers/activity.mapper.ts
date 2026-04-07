import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { ActivityListResponse } from '../../repositories/team.repository';

// TODO: Notion DB 스키마 확인 후 프로퍼티 매핑 구현
export function mapActivityPages(_pages: PageObjectResponse[]): ActivityListResponse {
  throw new Error('Not implemented: activity.mapper');
}
