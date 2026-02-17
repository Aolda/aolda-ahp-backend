# aolda-ahp-backend

TypeScript + Fastify 기반 백엔드 프로젝트입니다.

## Requirements
- Node.js 20 LTS 이상
- npm

## 설치
```bash
npm install
```

## 개발 실행
```bash
npm run dev
```

## 빌드
```bash
npm run build
```

## 프로덕션 실행
```bash
npm run start
```

## CORS 환경변수
- `CORS_ALLOW_ORIGINS`: 허용 Origin 목록(쉼표 구분, 예: `http://localhost:3000,http://localhost:5173`)
- `CORS_ALLOW_METHODS`: 허용 Method 목록(쉼표 구분, 기본값 `*`)
- `CORS_ALLOW_HEADERS`: 허용 Header 목록(쉼표 구분, 기본값 `*`)
- `CORS_ALLOW_CREDENTIALS`: credential 허용 여부(`true`/`false`, 기본값 `true`)

예시:
```bash
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173 \\
CORS_ALLOW_METHODS=GET,POST,OPTIONS \\
CORS_ALLOW_HEADERS=Content-Type,Authorization \\
CORS_ALLOW_CREDENTIALS=true \\
npm run dev
```

서버 시작 시 허용 가능한 CORS env 키 목록과 적용된 CORS 값을 로그로 출력합니다.

## Swagger
- UI: `/docs`
- OpenAPI JSON: `/openapi.json`

기본 포트는 `8001`입니다.
