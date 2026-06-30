export interface CloudMetricValue {
  value: number;
  unit: string;
}

export interface BriefResponse {
  userCount: CloudMetricValue;
  projectCount: CloudMetricValue;
}

export interface UseProjectResponse {
  total: number;
  data: Array<{
    teamName: string;
    description: string;
    duration?: {
      from?: { year: number; semester: number };
      to?: { year: number; semester: number };
    };
    projectImage: { url: string };
  }>;
}
export interface FaqListResponse {
  categories: Record<string, { categoryImg: { url: string }; categoryTitle: string }>;
  questions: {
    paginate: { from: number; to: number; curr: number };
    total: number;
    data: Array<{
      faqId: number;
      faqTitle: string;
      faqAnswer: string;
    }>;
  };
}

export interface NoticeListResponse {
  paginate: { from: number; to: number; curr: number };
  total: number;
  data: Array<{
    noticeId: number;
    noticeType: string;
    noticeTitle: string;
    createdAt: string;
  }>;
}

export interface NoticeDetailResponse {
  data: {
    noticeId: number;
    noticeType: string;
    noticeTitle: string;
    createdAt: string;
    createdBy: { userId: number; userName: string };
    readCount: number;
    attatchments: Array<{
      attatchmentId: number;
      file: { url: string };
    }>;
    content: string;
  };
  neighbors: { prev: number; next: number };
}

export interface ProductListResponse {
  categories: Record<string, { categoryImg: { url: string }; categoryTitle: string }>;
  products: Record<
    string,
    Array<{
      productId: number;
      productIcon: { url: string };
      productName: string;
      description: string;
    }>
  >;
}

export interface ProductDetailResponse {
  productId: number;
  productIcon: { url: string };
  productName: string;
  description: string;
  cloudLink: string;
  projectLink: string;
  content: string;
  participants: Array<{
    crewId: number | string;
    profile: { url: string };
    crewName: string;
    univDepartment: string;
    univJoinedYear: string;
  }>;
  relateServices: Array<{
    pageTitle: string;
    thumbnailImg: { url: string };
    serviceLink: string;
  }>;
}

export interface CloudRepository {
  // TODO: keyword/category/page 등 조회 조건은 도메인 스펙 확정 후 인자로 확장하세요.
  getBrief(): Promise<BriefResponse>;
  getUseProjectList(): Promise<UseProjectResponse>;
  getFaqList(): Promise<FaqListResponse>;
  getNoticeList(): Promise<NoticeListResponse>;
  getNoticeDetail(noticeId: string): Promise<NoticeDetailResponse>;
  getProductList(): Promise<ProductListResponse>;
  getProductDetail(productId: string, requestOrigin: string): Promise<ProductDetailResponse>;
}
