import type { ActivityListResponse } from '../../repositories/team.repository';

type ActivityListItem = ActivityListResponse['data'][number];

export interface ActivityAggregate {
  activityId: number;
  status: ActivityListItem['status'];
  startedAt: string;
  endedAt?: string | null;
  activityType: ActivityListItem['activityType'];
  participantsCount: number;
  activityNames: ActivityListItem['activityNames'];
  background: ActivityListItem['background'];
  description: ActivityListItem['description'];
}
