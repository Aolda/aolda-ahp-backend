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

export class CloudQueryService {
  constructor(private readonly cloudRepository: CloudRepository) {}

  // TODO: 비즈니스 규칙(검색 조건/권한/정렬/예외 처리)은 이 계층에 구현하세요.
  async getBrief(): Promise<BriefResponse> {
    return this.cloudRepository.getBrief();
  }

  async getUseProjectList(): Promise<UseProjectResponse> {
    return this.cloudRepository.getUseProjectList();
  }

  async getFaqList(): Promise<FaqListResponse> {
    return this.cloudRepository.getFaqList();
  }

  async getNoticeList(): Promise<NoticeListResponse> {
    return this.cloudRepository.getNoticeList();
  }

  async getNoticeDetail(noticeId: string): Promise<NoticeDetailResponse> {
    return this.cloudRepository.getNoticeDetail(noticeId);
  }

  async getProductList(): Promise<ProductListResponse> {
    return this.cloudRepository.getProductList();
  }

  async getProductDetail(productId: string, requestOrigin: string): Promise<ProductDetailResponse> {
    return this.cloudRepository.getProductDetail(productId, requestOrigin);
  }
}
