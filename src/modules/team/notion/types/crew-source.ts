import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints/common';

export interface CrewPageSource {
  page: PageObjectResponse;
  profileImageUrl: string | null;
}

export interface CrewDetailSource extends CrewPageSource {
  description: string;
}
