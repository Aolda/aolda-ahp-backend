export const BRIEF_EXAMPLE = {
  userCount: { value: 12540, unit: '명' },
  projectCount: { value: 312, unit: '개' },
  __________: { value: 48, unit: '개' },
};

export const USE_PROJECT_EXAMPLE = {
  total: 3,
  data: [
    {
      teamName: 'Aolda Research Lab',
      description: '대학 연구과제 데이터 파이프라인을 운영합니다.',
      duration: {
        from: { year: 2024, semester: 2 },
        to: { year: 2025, semester: 1 },
      },
      projectImage: { url: 'https://cdn.aolda.io/cloud/use-1.jpg' },
    },
    {
      teamName: '산학협력 프로젝트 팀',
      description: '클라우드 기반 이미지 처리 서비스를 개발했습니다.',
      duration: { from: { year: 2023, semester: 1 } },
      projectImage: { url: 'https://cdn.aolda.io/cloud/use-2.jpg' },
    },
    {
      teamName: '스타트업 MVP',
      description: '초기 MVP 검증을 위한 백엔드 인프라를 구성했습니다.',
      projectImage: { url: 'https://cdn.aolda.io/cloud/use-3.jpg' },
    },
  ],
};

export const FAQ_LIST_EXAMPLE = {
  categories: {
    CAT_GENERAL: {
      categoryImg: { url: 'https://cdn.aolda.io/faq/general.png' },
      categoryTitle: '일반',
    },
    CAT_BILLING: {
      categoryImg: { url: 'https://cdn.aolda.io/faq/billing.png' },
      categoryTitle: '요금 및 결제',
    },
  },
  questions: {
    paginate: { from: 1, to: 10, curr: 1 },
    total: 2,
    data: [
      {
        faqId: 1,
        faqTitle: '서비스 가입은 어떻게 하나요?',
        faqAnswer: '홈페이지에서 신청서를 제출하시면 담당자가 안내드립니다.',
      },
      {
        faqId: 2,
        faqTitle: '요금은 어떻게 청구되나요?',
        faqAnswer: '프로젝트 사용량 기반으로 월 단위 정산됩니다.',
      },
    ],
  },
};

export const NOTICE_LIST_EXAMPLE = {
  paginate: { from: 1, to: 10, curr: 1 },
  total: 2,
  data: [
    {
      noticeId: 1,
      noticeType: 'NOTICE_TYPE/USAGE',
      noticeTitle: '클라우드 사용 가이드 업데이트',
      createdAt: '2025-01-15 09:30:00',
    },
    {
      noticeId: 2,
      noticeType: 'NOTICE_TYPE/SERVICE',
      noticeTitle: '정기 점검 안내',
      createdAt: '2025-02-01 18:00:00',
    },
  ],
};

export const NOTICE_DETAIL_EXAMPLE = {
  data: {
    noticeId: 1,
    noticeType: 'NOTICE_TYPE/USAGE',
    noticeTitle: '클라우드 사용 가이드 업데이트',
    createdAt: '2025-01-15 09:30:00',
    createdBy: { userId: 1, userName: '관리자' },
    readCount: 128,
    attatchments: [
      {
        attatchmentId: 1,
        file: { url: 'https://cdn.aolda.io/notices/guide.pdf' },
      },
    ],
    content:
      '# 업데이트 안내\n\n- 사용 가이드가 최신 버전으로 변경되었습니다.\n- 세부 내용은 첨부파일을 참고해 주세요.',
  },
  neighbors: { prev: 0, next: 2 },
};

export const PRODUCT_LIST_EXAMPLE = {
  categories: {
    CAT_PLATFORM: {
      categoryImg: { url: 'https://cdn.aolda.io/products/platform.png' },
      categoryTitle: '플랫폼',
    },
    CAT_ANALYTICS: {
      categoryImg: { url: 'https://cdn.aolda.io/products/analytics.png' },
      categoryTitle: '데이터 분석',
    },
  },
  products: {
    CAT_PLATFORM: [
      {
        productId: 1,
        productIcon: { url: 'https://cdn.aolda.io/products/p1.png' },
        productName: 'Aolda Console',
        description: '클라우드 자원과 프로젝트를 통합 관리하는 콘솔입니다.',
      },
    ],
    CAT_ANALYTICS: [
      {
        productId: 2,
        productIcon: { url: 'https://cdn.aolda.io/products/p2.png' },
        productName: 'Insight Hub',
        description: '대시보드 기반 분석 리포트를 제공합니다.',
      },
    ],
  },
};

export const PRODUCT_DETAIL_EXAMPLE = {
  productId: 1,
  productIcon: { url: 'https://cdn.aolda.io/products/p1.png' },
  productName: 'Aolda Console',
  description: '클라우드 자원과 프로젝트를 통합 관리하는 콘솔입니다.',
  cloudLink: 'https://cloud.aolda.io/products/console',
  projectLink: 'https://aolda.io/projects/console',
  content: '# Aolda Console\n\n클라우드 리소스를 한 곳에서 모니터링하고 관리할 수 있습니다.',
  participants: [
    {
      crewId: 15,
      profile: { url: 'https://cdn.aolda.io/profiles/crew-15.jpg' },
      crewName: '김서현',
      univDepartment: '소프트웨어학과',
      univJoinedYear: '20',
    },
    {
      crewId: 31,
      profile: { url: 'https://cdn.aolda.io/profiles/crew-31.jpg' },
      crewName: '이준호',
      univDepartment: '산업공학과',
      univJoinedYear: '19',
    },
  ],
  relateServices: [
    {
      pageTitle: 'Aolda Monitor',
      thumbnailImg: { url: 'https://cdn.aolda.io/services/monitor.png' },
      serviceLink: 'https://aolda.io/services/monitor',
    },
    {
      pageTitle: 'Aolda Storage',
      thumbnailImg: { url: 'https://cdn.aolda.io/services/storage.png' },
      serviceLink: 'https://aolda.io/services/storage',
    },
  ],
};
