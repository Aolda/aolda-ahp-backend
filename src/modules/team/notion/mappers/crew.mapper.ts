import type { CrewDetailResponse, CrewListResponse } from '../../repositories/team.repository';

type CrewListItem = CrewListResponse['data'][number];

export function mapCrewPages(crews: CrewListItem[]): CrewListResponse {
  return {
    total: crews.length,
    data: crews,
  };
}

export function mapCrewDetail(detail: CrewDetailResponse): CrewDetailResponse {
  return detail;
}
