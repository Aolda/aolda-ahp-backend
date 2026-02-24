import { FastifyInstance, FastifyRequest } from 'fastify';

import {
  ACTIVITY_LIST_EXAMPLE,
  CREW_DETAIL_EXAMPLE,
  CREW_LIST_EXAMPLE,
  PROJECT_DETAIL_EXAMPLE,
  PROJECT_LIST_EXAMPLE,
} from '../constants/team';
import { errorSchema, serviceUnavailableSchema, successSchema } from '../constants/schemas';
import { TeamQueryService } from '../modules/team/services/team-query.service';

interface TeamRouteDeps {
  teamQueryService: TeamQueryService;
}

export async function registerTeamRoutes(app: FastifyInstance, deps: TeamRouteDeps): Promise<void> {
  const { teamQueryService } = deps;

  app.get(
    '/team/crew',
    {
      schema: {
        tags: ['team'],
        summary: '크루 목록조회 (AMMS 연계)',
        response: {
          200: successSchema(CREW_LIST_EXAMPLE),
          503: errorSchema('ERR_EXT_REQ_FAILED', 'Service Unavailable'),
        },
      } as any,
    },
    async () => teamQueryService.getCrewList(),
  );

  app.get(
    '/team/activity',
    {
      schema: {
        tags: ['team'],
        summary: '전체활동 목록조회 (AMMS 연계)',
        response: {
          200: successSchema(ACTIVITY_LIST_EXAMPLE),
          503: errorSchema('ERR_EXT_REQ_FAILED', 'Service Unavailable'),
        },
      } as any,
    },
    async () => teamQueryService.getActivityList(),
  );

  app.get(
    '/team/crew/:crew_id',
    {
      schema: {
        tags: ['team'],
        summary: '크루 상세조회 (AMMS 연계)',
        response: {
          200: successSchema(CREW_DETAIL_EXAMPLE),
          404: errorSchema('ERR_USER_NOT_FOUND', 'Not Found'),
          503: serviceUnavailableSchema(['ERR_EXT_REQ_FAILED', 'ERR_DB_REQ_FAILED']),
        },
      } as any,
    },
    async (request: FastifyRequest<{ Params: { crew_id: string } }>) =>
      teamQueryService.getCrewDetail(request.params.crew_id),
  );

  app.get(
    '/team/project',
    {
      schema: {
        tags: ['team'],
        summary: '프로젝트 전체정보 조회 (AMMS 연계)',
        response: {
          200: successSchema(PROJECT_LIST_EXAMPLE),
          400: errorSchema('ERR_INVALID_REQUEST', 'Bad Request'),
          404: errorSchema('ERR_USER_NOT_FOUND', 'Not Found'),
          503: serviceUnavailableSchema(['ERR_EXT_REQ_FAILED', 'ERR_DB_REQ_FAILED']),
        },
      } as any,
    },
    async () => teamQueryService.getProjectList(),
  );

  app.get(
    '/team/project/:project_id',
    {
      schema: {
        tags: ['team'],
        summary: '프로젝트 상세조회 (AMMS 연계)',
        response: {
          200: successSchema(PROJECT_DETAIL_EXAMPLE),
          403: errorSchema('ERR_ACTIVITY_ACCESS_DENIED', 'Forbidden'),
          404: errorSchema('ERR_USER_NOT_FOUND', 'Not Found'),
          503: serviceUnavailableSchema(['ERR_EXT_REQ_FAILED', 'ERR_DB_REQ_FAILED']),
        },
      } as any,
    },
    async (request: FastifyRequest<{ Params: { project_id: string } }>) =>
      teamQueryService.getProjectDetail(request.params.project_id),
  );
}
