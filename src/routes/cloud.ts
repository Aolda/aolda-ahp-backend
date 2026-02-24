import { FastifyInstance, FastifyRequest } from 'fastify';

import {
  BRIEF_EXAMPLE,
  FAQ_LIST_EXAMPLE,
  NOTICE_DETAIL_EXAMPLE,
  NOTICE_LIST_EXAMPLE,
  PRODUCT_DETAIL_EXAMPLE,
  PRODUCT_LIST_EXAMPLE,
  USE_PROJECT_EXAMPLE,
} from '../constants/cloud';
import { errorSchema, serviceUnavailableSchema, successSchema } from '../constants/schemas';
import { CloudQueryService } from '../modules/cloud/services/cloud-query.service';

interface CloudRouteDeps {
  cloudQueryService: CloudQueryService;
}

export async function registerCloudRoutes(app: FastifyInstance, deps: CloudRouteDeps): Promise<void> {
  const { cloudQueryService } = deps;

  app.get(
    '/cloud/brief',
    {
      schema: {
        tags: ['cloud'],
        summary: '아올다 주요지표 조회',
        response: {
          200: successSchema(BRIEF_EXAMPLE),
          503: errorSchema('ERR_EXT_REQ_FAILED', 'Service Unavailable'),
        },
      } as any,
    },
    async () => cloudQueryService.getBrief(),
  );

  app.get(
    '/cloud/use_project',
    {
      schema: {
        tags: ['cloud'],
        summary: '클라우드 사용처 목록 조회',
        response: {
          200: successSchema(USE_PROJECT_EXAMPLE),
          503: serviceUnavailableSchema(['ERR_EXT_REQ_FAILED', 'ERR_DB_REQ_FAILED']),
        },
      } as any,
    },
    async () => cloudQueryService.getUseProjectList(),
  );

  app.get(
    '/cloud/qna',
    {
      schema: {
        tags: ['cloud'],
        summary: 'FAQ 목록 조회',
        response: {
          200: successSchema(FAQ_LIST_EXAMPLE),
          503: serviceUnavailableSchema(['ERR_EXT_REQ_FAILED', 'ERR_DB_REQ_FAILED']),
        },
      } as any,
    },
    async () => cloudQueryService.getFaqList(),
  );

  app.get(
    '/cloud/notice',
    {
      schema: {
        tags: ['cloud'],
        summary: '공지사항 목록 조회',
        response: {
          200: successSchema(NOTICE_LIST_EXAMPLE),
          400: errorSchema('ERR_INVALID_REQUEST', 'Bad Request'),
          503: errorSchema('ERR_DB_REQ_FAILED', 'Service Unavailable'),
        },
      } as any,
    },
    async () => cloudQueryService.getNoticeList(),
  );

  app.get(
    '/cloud/notice/:notice_id',
    {
      schema: {
        tags: ['cloud'],
        summary: '공지사항 상세 조회',
        response: {
          200: successSchema(NOTICE_DETAIL_EXAMPLE),
          400: errorSchema('ERR_INVALID_REQUEST', 'Bad Request'),
          404: errorSchema('ERR_NOTICE_NOT_FOUND', 'Not Found'),
          503: errorSchema('ERR_DB_REQ_FAILED', 'Service Unavailable'),
        },
      } as any,
    },
    async (request: FastifyRequest<{ Params: { notice_id: string } }>) =>
      cloudQueryService.getNoticeDetail(request.params.notice_id),
  );

  app.get(
    '/cloud/product',
    {
      schema: {
        tags: ['cloud'],
        summary: '제품목록 조회 (AMMS 연계)',
        response: {
          200: successSchema(PRODUCT_LIST_EXAMPLE),
          503: serviceUnavailableSchema(['ERR_EXT_REQ_FAILED', 'ERR_DB_REQ_FAILED']),
        },
      } as any,
    },
    async () => cloudQueryService.getProductList(),
  );

  app.get(
    '/cloud/product/:product_id',
    {
      schema: {
        tags: ['cloud'],
        summary: '제품 상세조회 (AMMS 연계)',
        response: {
          200: successSchema(PRODUCT_DETAIL_EXAMPLE),
          400: errorSchema('ERR_INVALID_REQUEST', 'Bad Request'),
          404: errorSchema('ERR_NOTICE_NOT_FOUND', 'Not Found'),
          503: errorSchema('ERR_DB_REQ_FAILED', 'Service Unavailable'),
        },
      } as any,
    },
    async (request: FastifyRequest<{ Params: { product_id: string } }>) =>
      cloudQueryService.getProductDetail(request.params.product_id),
  );
}
