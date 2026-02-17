# aolda-ahp-backend

FastAPI 기반 백엔드 프로젝트 스캐폴딩입니다.

## 실행
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
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
브라우저에서 `/docs` 경로로 접속하면 Swagger UI를 사용할 수 있습니다.
