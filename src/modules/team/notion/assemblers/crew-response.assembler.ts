import type { CrewDetailResponse, CrewListResponse } from '../../repositories/team.repository';
import {
  extractCrewName,
  extractUnivDepartment,
  extractUnivJoinedYear,
  isCurrentActiveCrew,
} from '../extractors/crew-page.extractor';
import type { CrewPageSource } from '../types/crew-source';

const DUMMY_PROFILE_URL = 'https://dummy.aolda.local/profiles/not-fetched-yet.jpg';

type CrewListItem = CrewListResponse['data'][number];
type CrewLogItem = CrewListItem['crewLog'][number];

export interface CrewListAggregate {
  crewId: number;
  source: CrewPageSource;
  joinedGen: number;
  crewLog: CrewLogItem[];
  totalActivities: number;
  totalBloggings: number;
}

export interface CrewDetailAggregate extends CrewListAggregate {
  crewEmail: string;
  description: string;
  activities: CrewDetailResponse['activities'];
  bloggings: CrewDetailResponse['bloggings'];
  connections: CrewDetailResponse['connections'];
}

export function assembleCrewListResponse(crews: CrewListAggregate[]): CrewListResponse {
  return {
    total: crews.length,
    data: crews.map((crew) => assembleCrewListItem(crew)),
  };
}

export function assembleCrewDetailResponse(detail: CrewDetailAggregate): CrewDetailResponse {
  return {
    ...assembleCrewListItem(detail),
    crewEmail: detail.crewEmail,
    description: detail.description,
    activities: detail.activities,
    bloggings: detail.bloggings,
    connections: detail.connections,
  };
}

function assembleCrewListItem(crew: CrewListAggregate): CrewListItem {
  return {
    crewId: crew.crewId,
    profile: {
      // TODO(dummy): 페이지 본문에서 이미지를 찾지 못한 경우에만 더미 URL을 사용합니다.
      url: crew.source.profileImageUrl ?? DUMMY_PROFILE_URL,
    },
    crewName: extractCrewName(crew.source.page),
    crewLog: crew.crewLog,
    isActive: isCurrentActiveCrew(crew.source.page),
    joinedGen: crew.joinedGen,
    univDepartment: extractUnivDepartment(crew.source.page),
    univJoinedYear: extractUnivJoinedYear(crew.source.page),
    totalActivities: crew.totalActivities,
    totalBloggings: crew.totalBloggings,
  };
}
