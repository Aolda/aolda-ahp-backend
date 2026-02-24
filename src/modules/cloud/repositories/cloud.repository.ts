import {
  BRIEF_EXAMPLE,
  FAQ_LIST_EXAMPLE,
  NOTICE_DETAIL_EXAMPLE,
  NOTICE_LIST_EXAMPLE,
  PRODUCT_DETAIL_EXAMPLE,
  PRODUCT_LIST_EXAMPLE,
  USE_PROJECT_EXAMPLE,
} from '../../../constants/cloud';

export type BriefResponse = typeof BRIEF_EXAMPLE;
export type UseProjectResponse = typeof USE_PROJECT_EXAMPLE;
export type FaqListResponse = typeof FAQ_LIST_EXAMPLE;
export type NoticeListResponse = typeof NOTICE_LIST_EXAMPLE;
export type NoticeDetailResponse = typeof NOTICE_DETAIL_EXAMPLE;
export type ProductListResponse = typeof PRODUCT_LIST_EXAMPLE;
export type ProductDetailResponse = typeof PRODUCT_DETAIL_EXAMPLE;

export interface CloudRepository {
  // TODO: keyword/category/page 등 조회 조건은 도메인 스펙 확정 후 인자로 확장하세요.
  getBrief(): Promise<BriefResponse>;
  getUseProjectList(): Promise<UseProjectResponse>;
  getFaqList(): Promise<FaqListResponse>;
  getNoticeList(): Promise<NoticeListResponse>;
  getNoticeDetail(noticeId: string): Promise<NoticeDetailResponse>;
  getProductList(): Promise<ProductListResponse>;
  getProductDetail(productId: string): Promise<ProductDetailResponse>;
}
