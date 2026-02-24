import {
  BRIEF_EXAMPLE,
  FAQ_LIST_EXAMPLE,
  NOTICE_DETAIL_EXAMPLE,
  NOTICE_LIST_EXAMPLE,
  PRODUCT_DETAIL_EXAMPLE,
  PRODUCT_LIST_EXAMPLE,
  USE_PROJECT_EXAMPLE,
} from '../../../constants/cloud';
import {
  BriefResponse,
  CloudRepository,
  FaqListResponse,
  NoticeDetailResponse,
  NoticeListResponse,
  ProductDetailResponse,
  ProductListResponse,
  UseProjectResponse,
} from '../repositories/cloud.repository';

export class CloudPrismaRepository implements CloudRepository {
  // TODO: Prisma Client를 주입받아 실제 Cloud/Notice/Product 조회 쿼리를 구현하세요.
  // 현재는 잠수함 패치를 위해 기존 응답과 동일한 더미 값을 반환합니다.

  async getBrief(): Promise<BriefResponse> {
    return BRIEF_EXAMPLE;
  }

  async getUseProjectList(): Promise<UseProjectResponse> {
    return USE_PROJECT_EXAMPLE;
  }

  async getFaqList(): Promise<FaqListResponse> {
    return FAQ_LIST_EXAMPLE;
  }

  async getNoticeList(): Promise<NoticeListResponse> {
    return NOTICE_LIST_EXAMPLE;
  }

  async getNoticeDetail(_noticeId: string): Promise<NoticeDetailResponse> {
    return NOTICE_DETAIL_EXAMPLE;
  }

  async getProductList(): Promise<ProductListResponse> {
    return PRODUCT_LIST_EXAMPLE;
  }

  async getProductDetail(_productId: string): Promise<ProductDetailResponse> {
    return PRODUCT_DETAIL_EXAMPLE;
  }
}
