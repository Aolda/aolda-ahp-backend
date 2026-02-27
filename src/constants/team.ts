export const CREW_LIST_EXAMPLE = {
  total: 10,
  data: [
    {
      crewId: 15,
      profile: { url: 'https://cdn.aolda.io/profiles/crew-15.jpg' },
      crewName: '김서현',
      crewLog: [
        {
          generation: 3,
          type: 'CREW_ROLE/P',
          department: 'DEPARTMENT_TYPE/CLEVEL',
        },
        {
          generation: 4,
          type: 'CREW_ROLE/VP',
          department: 'DEPARTMENT_TYPE/CLEVEL',
        },
      ],
      isActive: true,
      joinedGen: 3,
      univDepartment: '소프트웨어학과',
      univJoinedYear: '20',
      totalActivities: 12,
      totalBloggings: 7,
    },
  ],
};

export const ACTIVITY_LIST_EXAMPLE = {
  total: 10,
  data: [
    {
      status: 'ACTIVITY_STATUS/RECRIUTING',
      startedAt: '2025-1',
      activityNames: {
        ko: '캡스톤 프로젝트 A',
        en: 'Capstone Project A',
        brief: '캡스톤A',
      },
      activityType: 'ACTIVITY_TYPE/PROJECT',
      description: '실사용자를 위한 서비스 개선을 목표로 진행한 프로젝트입니다.',
    },
    {
      status: 'ACTIVITY_STATUS/ONBOARDING',
      startedAt: '2024-2',
      activityNames: {
        ko: '리액트 스터디',
        en: 'React Study',
        brief: 'React',
      },
      activityType: 'ACTIVITY_TYPE/STUDY',
      description: '기초부터 심화까지 단계별로 학습하는 프론트엔드 스터디입니다.',
    },
  ],
};

export const CREW_DETAIL_EXAMPLE = {
  crewId: 15,
  profile: { url: 'https://cdn.aolda.io/profiles/crew-15.jpg' },
  crewName: '김서현',
  crewLog: [
    {
      generation: 3,
      type: 'CREW_ROLE/P',
      department: 'DEPARTMENT_TYPE/CLEVEL',
    },
    {
      generation: 4,
      type: 'CREW_ROLE/VP',
      department: 'DEPARTMENT_TYPE/CLEVEL',
    },
  ],
  isActive: true,
  joinedGen: 3,
  univDepartment: '소프트웨어학과',
  univJoinedYear: '20',
  crewEmail: 'seohyun.kim@aolda.io',
  description: '함께 성장하는 팀 문화를 지향합니다.',
  activities: [
    {
      activityId: 3,
      status: 'ACTIVITY_STATUS/RECRIUTING',
      startedAt: '2025-1',
      activityNames: {
        ko: '캡스톤 프로젝트 A',
        en: 'Capstone Project A',
        brief: '캡스톤A',
      },
      activityType: 'ACTIVITY_TYPE/PROJECT',
      description: '사용자 리서치를 바탕으로 신규 기능을 설계하고 구현했습니다.',
    },
    {
      activityId: 2,
      status: 'ACTIVITY_STATUS/ONBOARDING',
      startedAt: '2024-2',
      activityNames: {
        ko: '리액트 스터디',
        en: 'React Study',
        brief: 'React',
      },
      activityType: 'ACTIVITY_TYPE/STUDY',
      description: '기초 문법부터 실전 프로젝트까지 학습한 스터디입니다.',
    },
  ],
  bloggings: [
    {
      title: '컴포넌트 설계 원칙 정리',
      postedAt: '2025-01-15 14:22:10',
      contentPreview: '재사용성과 유지보수성을 고려한 컴포넌트 설계 원칙을 정리했습니다.',
    },
    {
      title: '협업을 위한 코드리뷰 체크리스트',
      postedAt: '2024-11-03 09:10:45',
      contentPreview: '리뷰 효율을 높이기 위한 체크리스트와 실제 사례를 공유합니다.',
    },
  ],
  connections: {
    isFollowing: false,
    followers: 0,
    followings: 0,
  },
};

export const PROJECT_LIST_EXAMPLE = {
  total: 10,
  data: {
    statistics: {
      projects: {
        key: 'STATISTIC_VALUE/PROJECTS',
        total: 20,
        value: 12,
      },
      participants: {
        key: 'STATISTIC_VALUE/PARTICIPANTS',
        total: 55,
        value: 23,
      },
      paran_projects: {
        key: 'STATISTIC_VALUE/PARAN_PROJECTS',
        total: 20,
        value: 8,
      },
    },
    filters: {
      status: {
        STATUS_RECRUITING: {
          key: 'ACTIVITY_TYPE/RECRIUTING',
          value: '모집중',
        },
        STATUS_ONBOARDING: {
          key: 'ACTIVITY_TYPE/ONBOARDING',
          value: '진행중',
        },
        STATUS_COMPLETED: {
          key: 'ACTIVITY_TYPE/COMPLETED',
          value: '완료',
        },
      },
      seasons: {
        SEMESTER_2024_2: {
          key: '2024-2',
          value: '2024학년도 2학기',
        },
        SEMESTER_2025_1: {
          key: '2025-1',
          value: '2025학년도 1학기',
        },
        SEMESTER_2025_2: {
          key: '2025-2',
          value: '2025학년도 2학기',
        },
      },
    },
    projects: [
      {
        activityId: 3,
        status: 'ACTIVITY_TYPE/RECRIUTING',
        startedAt: '2025-1',
        participantsCount: 22,
        activityNames: {
          ko: 'AI 학습 파이프라인 구축',
          en: 'AI Training Pipeline',
          brief: 'AI 파이프',
        },
        background: {
          url: 'https://cdn.aolda.io/projects/bg-3.jpg',
          color: '#1E3A8A',
        },
      },
      {
        activityId: 5,
        status: 'ACTIVITY_TYPE/ONBOARDING',
        startedAt: '2024-2',
        participantsCount: 18,
        activityNames: {
          ko: '클라우드 비용 최적화',
          en: 'Cloud Cost Optimization',
          brief: 'Cloud Opt',
        },
        background: {
          url: 'https://cdn.aolda.io/projects/bg-5.jpg',
          color: '#0F766E',
        },
      },
    ],
  },
};

export const PROJECT_DETAIL_EXAMPLE = {
  activityNames: {
    ko: 'AI 학습 파이프라인 구축',
    en: 'AI Training Pipeline',
    brief: 'AI 파이프',
  },
  background: {
    url: 'https://cdn.aolda.io/projects/bg-3.jpg',
    color: '#334155',
  },
  contents: {
    ideaBackground:
      '문제 정의부터 사용자 리서치 결과까지 정리했습니다.\n\n현재 수집 파이프라인의 병목을 해결하기 위해 개선안을 도출했습니다.',
    activityInfo: {
      startedAt: ['2024-2', '2025-1'],
      projectType: 'PROJECT_TYPE/IN_HOUSE',
      activityCounts: 6,
      bloggingCounts: 3,
    },
    mainBloggings: [
      {
        title: '모델 학습 파이프라인 구축기',
        createdBy: { crewId: 15, crewName: '김서현' },
        postedAt: '2025-01-10 11:40:00',
        contentPreview: '데이터 수집부터 학습 자동화까지의 과정을 정리했습니다.',
      },
      {
        title: '운영비용 최적화 회고',
        createdBy: { crewId: 22, crewName: '박지훈' },
        postedAt: '2025-01-25 18:05:30',
        contentPreview: '리소스 최적화로 비용을 절감한 사례를 공유합니다.',
      },
    ],
  },
  participants: [
    {
      crewId: 15,
      profile: { url: 'https://cdn.aolda.io/profiles/crew-15.jpg' },
      crewName: '김서현',
      univDepartment: '소프트웨어학과',
      univJoinedYear: '20',
    },
    {
      crewId: 22,
      profile: { url: 'https://cdn.aolda.io/profiles/crew-22.jpg' },
      crewName: '박지훈',
      univDepartment: '인공지능학과',
      univJoinedYear: '19',
    },
  ],
  gallery: [
    {
      photoId: 1,
      content: {
        url: 'https://cdn.aolda.io/projects/gallery-1.jpg',
      },
    },
    {
      photoId: 2,
      content: {
        url: 'https://cdn.aolda.io/projects/gallery-2.jpg',
      },
    },
  ],
};
