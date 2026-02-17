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
- `CORS_ALLOW_ORIGINS`: 허용 Origin 목록(쉼표 구분)
- `CORS_ALLOW_METHODS`: 허용 Method 목록(쉼표 구분)
- `CORS_ALLOW_HEADERS`: 허용 Header 목록(쉼표 구분)
- `CORS_ALLOW_CREDENTIALS`: credential 허용 여부(`true`/`false`)

예시:
```bash
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173 uvicorn app.main:app --reload
```

## Swagger
- UI: `/docs`
- OpenAPI JSON: `/openapi.json`

기본 포트는 `8001`입니다.
