from typing import Any, Dict

from fastapi import APIRouter


router = APIRouter(prefix="/team", tags=["team"])


CREW_LIST_EXAMPLE: Dict[str, Any] = {
    "total": 10,
    "data": [
        {
            "crewId": 15,
            "profile": {"url": "https://cdn.aolda.io/profiles/crew-15.jpg"},
            "crewName": "김서현",
            "cLevelLog": [
                {"generation": 3, "type": "CREW_ROLE/P"},
                {"generation": 4, "type": "CREW_ROLE/VP"},
            ],
            "isActive": True,
            "joinedGen": 3,
            "univDepartment": "소프트웨어학과",
            "univJoinedYear": "20",
            "totalActivities": 12,
            "totalBloggings": 7,
        }
    ],
}

ACTIVITY_LIST_EXAMPLE: Dict[str, Any] = {
    "total": 10,
    "data": [
        {
            "status": "ACTIVITY_STATUS/RECRIUTING",
            "startedAt": "2025-1",
            "activityNames": {
                "ko": "캡스톤 프로젝트 A",
                "en": "Capstone Project A",
            },
            "activityType": "ACTIVITY_TYPE/PROJECT",
            "description": "실사용자를 위한 서비스 개선을 목표로 진행한 프로젝트입니다.",
        },
        {
            "status": "ACTIVITY_STATUS/ONBOARDING",
            "startedAt": "2024-2",
            "activityNames": {
                "ko": "리액트 스터디",
                "en": "React Study",
            },
            "activityType": "ACTIVITY_TYPE/STUDY",
            "description": "기초부터 심화까지 단계별로 학습하는 프론트엔드 스터디입니다.",
        },
    ],
}

CREW_DETAIL_EXAMPLE: Dict[str, Any] = {
    "crewId": 15,
    "profile": {"url": "https://cdn.aolda.io/profiles/crew-15.jpg"},
    "crewName": "김서현",
    "cLevelLog": [
        {"generation": 3, "type": "CREW_ROLE/P"},
        {"generation": 4, "type": "CREW_ROLE/VP"},
    ],
    "isActive": True,
    "joinedGen": 3,
    "univDepartment": "소프트웨어학과",
    "univJoinedYear": "20",
    "crewEmail": "seohyun.kim@aolda.io",
    "description": "함께 성장하는 팀 문화를 지향합니다.",
    "activities": [
        {
            "activityId": 3,
            "status": "ACTIVITY_STATUS/RECRIUTING",
            "startedAt": "2025-1",
            "activityNames": {
                "ko": "캡스톤 프로젝트 A",
                "en": "Capstone Project A",
            },
            "activityType": "ACTIVITY_TYPE/PROJECT",
            "description": "사용자 리서치를 바탕으로 신규 기능을 설계하고 구현했습니다.",
        },
        {
            "activityId": 2,
            "status": "ACTIVITY_STATUS/ONBOARDING",
            "startedAt": "2024-2",
            "activityNames": {
                "ko": "리액트 스터디",
                "en": "React Study",
            },
            "activityType": "ACTIVITY_TYPE/STUDY",
            "description": "기초 문법부터 실전 프로젝트까지 학습한 스터디입니다.",
        },
    ],
    "bloggings": [
        {
            "title": "컴포넌트 설계 원칙 정리",
            "postedAt": "2025-01-15 14:22:10",
            "contentPreview": "재사용성과 유지보수성을 고려한 컴포넌트 설계 원칙을 정리했습니다.",
        },
        {
            "title": "협업을 위한 코드리뷰 체크리스트",
            "postedAt": "2024-11-03 09:10:45",
            "contentPreview": "리뷰 효율을 높이기 위한 체크리스트와 실제 사례를 공유합니다.",
        },
    ],
    "connections": {
        "isFollowing": False,
        "followers": 0,
        "followings": 0,
    },
}

PROJECT_LIST_EXAMPLE: Dict[str, Any] = {
    "total": 10,
    "data": {
        "statistics": {
            "projects": {
                "key": "STATISTIC_VALUE/PROJECTS",
                "total": 20,
                "value": 12,
            },
            "participants": {
                "key": "STATISTIC_VALUE/PARTICIPANTS",
                "total": 55,
                "value": 23,
            },
            "paran_projects": {
                "key": "STATISTIC_VALUE/PARAN_PROJECTS",
                "total": 20,
                "value": 8,
            },
        },
        "filters": {
            "status": {
                "STATUS_RECRUITING": {
                    "key": "ACTIVITY_TYPE/RECRIUTING",
                    "value": "모집중",
                },
                "STATUS_ONBOARDING": {
                    "key": "ACTIVITY_TYPE/ONBOARDING",
                    "value": "진행중",
                },
                "STATUS_COMPLETED": {
                    "key": "ACTIVITY_TYPE/COMPLETED",
                    "value": "완료",
                },
            },
            "seasons": {
                "SEMESTER_2024_2": {
                    "key": "2024-2",
                    "value": "2024학년도 2학기",
                },
                "SEMESTER_2025_1": {
                    "key": "2025-1",
                    "value": "2025학년도 1학기",
                },
                "SEMESTER_2025_2": {
                    "key": "2025-2",
                    "value": "2025학년도 2학기",
                },
            },
        },
        "projects": [
            {
                "activityId": 3,
                "status": "ACTIVITY_TYPE/RECRIUTING",
                "startedAt": "2025-1",
                "activityNames": {
                    "ko": "AI 학습 파이프라인 구축",
                    "en": "AI Training Pipeline",
                },
                "backgroundImage": {
                    "url": "https://cdn.aolda.io/projects/bg-3.jpg",
                },
            },
            {
                "activityId": 5,
                "status": "ACTIVITY_TYPE/ONBOARDING",
                "startedAt": "2024-2",
                "activityNames": {
                    "ko": "클라우드 비용 최적화",
                    "en": "Cloud Cost Optimization",
                },
                "backgroundImage": {
                    "url": "https://cdn.aolda.io/projects/bg-5.jpg",
                },
            },
        ],
    },
}

PROJECT_DETAIL_EXAMPLE: Dict[str, Any] = {
    "activityNames": {
        "ko": "AI 학습 파이프라인 구축",
        "en": "AI Training Pipeline",
    },
    "backgroundImage": {
        "url": "https://cdn.aolda.io/projects/bg-3.jpg",
    },
    "contents": {
        "ideaBackground": "문제 정의부터 사용자 리서치 결과까지 정리했습니다.\n\n현재 수집 파이프라인의 병목을 해결하기 위해 개선안을 도출했습니다.",
        "asIs": "데이터 적재 지연으로 학습 주기가 길었습니다.\n\n파이프라인 자동화가 부족해 운영 비용이 높았습니다.",
        "toBe": "ETL 자동화를 통해 학습 주기를 단축합니다.\n\n모니터링과 알림을 강화해 운영 비용을 절감합니다.",
    },
    "participants": [
        {
            "crewId": 15,
            "profile": {"url": "https://cdn.aolda.io/profiles/crew-15.jpg"},
            "crewName": "김서현",
            "univDepartment": "소프트웨어학과",
            "univJoinedYear": "20",
        },
        {
            "crewId": 22,
            "profile": {"url": "https://cdn.aolda.io/profiles/crew-22.jpg"},
            "crewName": "박지훈",
            "univDepartment": "인공지능학과",
            "univJoinedYear": "19",
        },
    ],
    "gallery": [
        {
            "photoId": 1,
            "content": {
                "url": "https://cdn.aolda.io/projects/gallery-1.jpg",
            },
        },
        {
            "photoId": 2,
            "content": {
                "url": "https://cdn.aolda.io/projects/gallery-2.jpg",
            },
        },
    ],
}


@router.get(
    "/crew",
    summary="크루 목록조회 (AMMS 연계)",
    responses={
        200: {
            "description": "OK",
            "content": {"application/json": {"example": CREW_LIST_EXAMPLE}},
        }
    },
)
def get_crew_list() -> Dict[str, Any]:
    return CREW_LIST_EXAMPLE


@router.get(
    "/activity",
    summary="전체활동 목록조회 (AMMS 연계)",
    responses={
        200: {
            "description": "OK",
            "content": {"application/json": {"example": ACTIVITY_LIST_EXAMPLE}},
        }
    },
)
def get_activity_list() -> Dict[str, Any]:
    return ACTIVITY_LIST_EXAMPLE


@router.get(
    "/crew/{crew_id}",
    summary="크루 상세조회 (AMMS 연계)",
    responses={
        200: {
            "description": "OK",
            "content": {"application/json": {"example": CREW_DETAIL_EXAMPLE}},
        }
    },
)
def get_crew_detail(crew_id: int) -> Dict[str, Any]:
    return CREW_DETAIL_EXAMPLE


@router.get(
    "/project",
    summary="프로젝트 전체정보 조회 (AMMS 연계)",
    responses={
        200: {
            "description": "OK",
            "content": {"application/json": {"example": PROJECT_LIST_EXAMPLE}},
        }
    },
)
def get_project_list() -> Dict[str, Any]:
    return PROJECT_LIST_EXAMPLE


@router.get(
    "/project/{project_id}",
    summary="프로젝트 상세조회 (AMMS 연계)",
    responses={
        200: {
            "description": "OK",
            "content": {"application/json": {"example": PROJECT_DETAIL_EXAMPLE}},
        }
    },
)
def get_project_detail(project_id: int) -> Dict[str, Any]:
    return PROJECT_DETAIL_EXAMPLE
