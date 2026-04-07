import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { ProjectListResponse } from '../../repositories/team.repository';

// TODO: Notion DB 스키마 확인 후 프로퍼티 매핑 구현
export function mapProjectPages(_pages: PageObjectResponse[]): ProjectListResponse {
  throw new Error('Not implemented: project.mapper');
}
