import type { CrewDetailResponse, CrewListResponse } from '../../repositories/team.repository';

type CrewListItem = CrewListResponse['data'][number];

export function assembleCrewListResponse(crews: CrewListItem[]): CrewListResponse {
  return {
    total: crews.length,
    data: crews,
  };
}

export function assembleCrewDetailResponse(detail: CrewDetailResponse): CrewDetailResponse {
  return detail;
}
