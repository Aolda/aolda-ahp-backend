import type { ActivityListResponse } from '../../repositories/team.repository';
import type { ActivityAggregate } from '../types/activity-aggregate';

export function assembleActivityListResponse(activities: ActivityAggregate[]): ActivityListResponse {
  const data = activities.map((activity) => ({
    activityId: activity.activityId,
    status: activity.status,
    startedAt: activity.startedAt,
    activityNames: activity.activityNames,
    background: activity.background,
    activityType: activity.activityType,
    description: activity.description,
  }));

  return {
    total: data.length,
    data,
  };
}
