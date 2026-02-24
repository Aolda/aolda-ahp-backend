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

export class CloudMockRepository implements CloudRepository {
  // TODO: 임시 더미 응답입니다. 실제 구현 시 DB/API 호출로 교체하세요.
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
