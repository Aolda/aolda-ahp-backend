import type { CrewDetailResponse, CrewListResponse } from '../../repositories/team.repository';
import { normalizeAdmissionYear } from '../../crew-academic-profile';
import {
  CREW_DEPARTMENT_KEY_VALUES,
  CREW_TYPE_KEY_VALUES,
} from '../../constants/crew-log-keys';
import {
  extractCrewName,
  extractUnivDepartment,
  extractUnivJoinedYear,
} from '../extractors/crew-page.extractor';
import type { CrewPageSource } from '../types/crew-source';

const DUMMY_PROFILE_URL = 'https://dummy.aolda.local/profiles/not-fetched-yet.jpg';

type CrewListItem = CrewListResponse['data'][number];
type CrewLogItem = CrewListItem['crewLog'][number];

export interface CrewListAggregate {
  crewId: number;
  source: CrewPageSource;
  isActive: boolean;
  joinedGen: number;
  crewLog: CrewLogItem[];
  profileSupplement?: {
    univDepartment?: string | null;
    univJoinedYear?: string | null;
  };
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
  const data = crews.map((crew) => assembleCrewListItem(crew));

  return {
    total: crews.length,
    keys: collectCrewListKeys(data),
    data,
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
    isActive: crew.isActive,
    joinedGen: crew.joinedGen,
    univDepartment: crew.profileSupplement?.univDepartment ?? extractUnivDepartment(crew.source.page),
    univJoinedYear: normalizeAdmissionYear(
      crew.profileSupplement?.univJoinedYear ?? extractUnivJoinedYear(crew.source.page),
    ) ?? '',
    totalActivities: crew.totalActivities,
    totalBloggings: crew.totalBloggings,
  };
}

function collectCrewListKeys(data: CrewListResponse['data']): CrewListResponse['keys'] {
  const departmentEntries = new Map<string, string>();
  const typeEntries = new Map<string, string>();

  for (const crew of data) {
    for (const log of crew.crewLog) {
      const departmentLabel = CREW_DEPARTMENT_KEY_VALUES[log.department as keyof typeof CREW_DEPARTMENT_KEY_VALUES];
      if (departmentLabel) {
        departmentEntries.set(log.department, departmentLabel);
      }

      const typeLabel = CREW_TYPE_KEY_VALUES[log.type as keyof typeof CREW_TYPE_KEY_VALUES];
      if (typeLabel) {
        typeEntries.set(log.type, typeLabel);
      }
    }
  }

  return {
    department: Object.fromEntries(departmentEntries),
    type: Object.fromEntries(typeEntries),
  };
}
