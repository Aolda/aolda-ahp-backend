import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';
import type { ActivityListResponse } from '../../repositories/team.repository';
import { parseActivityPage } from '../parsers/activity-page.parser';

export function assembleActivityListResponse(pages: PageObjectResponse[]): ActivityListResponse {
  const data = pages.map((page) => parseActivityPage(page));

  return {
    total: data.length,
    data,
  };
}
