# aolda-ahp-backend

이 프로젝트는 `team`, `cloud`, `health` 공개 API를 제공하는 **TypeScript + Fastify 백엔드**입니다.
현재는 실제 DB 연동을 넣기 전이므로, 기존 응답을 유지하면서 비즈니스 로직을 추가할 수 있는 구조로 설계되어 있습니다.
특히 `team` 모듈은 Notion을 원천 데이터소스로 사용하면서, 조회 로직과 데이터 해석 로직을 분리하는 방향으로 리팩터링 중입니다.

## 이 문서를 보는 초보자용 가이드

프로젝트를 처음 열었을 때, 어떤 파일이 무엇을 하는지 한 번에 이해할 수 있도록 작성했습니다.
아래 그림은 요청이 서버에서 처리되는 순서를 보여줍니다.

```text
사용자 요청
  └─> Route(API 엔드포인트)
        └─> Service(유스케이스/비즈니스 규칙)
              └─> Repository(조회 시나리오 조합)
                    └─> Fetcher(외부 API / DB 호출)
                          └─> Extractor(순수 함수 기반 값 추출)
                                └─> 응답 반환
```

## 1) 프로젝트 구조를 먼저 이해하기

`src/` 루트는 아래와 같이 역할별로 나뉩니다.

```text
src/
  common/
    config/
      env.ts
  constants/
    team.ts
    cloud.ts
    schemas.ts
  routes/
    health.ts
    team.ts
    cloud.ts
  modules/
    team/
      services/
      repositories/
      datasources/
      notion/
        fetchers/
        extractors/
        parsers/
        assemblers/
    cloud/
      services/
      repositories/
      datasources/
    internal-example/
      routes/
      services/
      repositories/
      datasources/
  server.ts
prisma/
  schema.prisma
```

- `README`에서 문서가 길어지는 대신, 실제 동작을 기준으로 파일을 읽으면 이해가 빠릅니다.
- 공개 API는 `routes`에 선언되어 있고, 실제 동작은 `modules`에서 처리됩니다.

## 2) 폴더 역할 (한 줄로 요약)

- `src/server.ts`
  - 앱을 생성하고, 플러그인(CORS, Swagger), 라우트 등록, 환경변수 로깅을 담당합니다.
- `src/routes/*`
  - HTTP 요청을 받아 문서화(Swagger)하고, Service를 호출해 결과를 반환합니다.
  - 이곳은 DB/API 직접 접근을 하지 않습니다.
- `src/modules/<도메인>/services/*`
  - `팀 조회`, `클라우드 조회` 같은 업무 규칙이 배치될 장소입니다.
  - 현재는 Repository 호출만 래핑하고, 향후 정책/검증 로직을 넣을 예정입니다.
- `src/modules/<도메인>/repositories/*`
  - 데이터 조회 계약(인터페이스)입니다.
  - Service는 이 계약만 알면 되고, 실제 구현체는 바뀌어도 서비스는 영향이 적습니다.
- `src/modules/<도메인>/datasources/*`
  - `mock`은 현재 더미 데이터를 반환합니다.
  - `prisma`는 나중에 실제 DB 조회로 교체할 수 있는 준비부입니다.
- `src/modules/team/notion/fetchers/*`
  - Notion SDK 호출만 담당합니다.
  - `dataSources.query`, `blocks.children.list` 같은 I/O를 이 계층에 둡니다.
  - `CrewFetcher`는 `page + profileImageUrl + description` 같은 raw source만 반환합니다.
  - `ActivityFetcher`는 project/study datasource를 각각 조회한 뒤, repository가 메모리에서 병합할 수 있도록 `page` 기반 raw source를 반환합니다.
  - 임원 lookup처럼 별도 보조 데이터소스도 전용 fetcher로 분리해 조합합니다.
- `src/modules/team/notion/extractors/*`
  - 이미 조회한 `page`/`block`에서 필요한 값을 읽는 순수 함수 계층입니다.
  - 네트워크 호출 없이 입력값만 받아 결과를 반환합니다.
- `src/modules/team/notion/parsers/*`
  - Notion의 raw page를 팀 도메인에서 쓰기 쉬운 중간 형태로 해석합니다.
  - 예: activity page의 상태값, 시작학기, activity type 판별
- `src/modules/team/notion/assemblers/*`
  - parser/fetcher 결과를 최종 REST 응답 형태로 조립합니다.
  - 이 계층은 응답 shape를 알지만, 직접 외부 API를 호출하지 않습니다.
  - `crew`의 경우 repository가 여러 source와 supplement를 aggregate로 묶고, assembler가 그 aggregate를 응답 DTO로 변환합니다.
  - `activity/project`도 parser가 page를 해석하고, repository가 mock supplement와 aggregate를 조합한 뒤 assembler가 응답을 만듭니다.
- `prisma/schema.prisma`
  - Prisma 스키마 파일입니다.
  - 현재는 최소 예시 모델만 두고, 도메인 모델은 추후 확장용으로 남겨두었습니다.
- `src/constants/*`
  - 현재 공개 API 응답 형식(오탈자 키 포함)을 보존하기 위한 고정 예시 데이터/스키마입니다.

## 3) 왜 `team`/`cloud` 구조가 분리되었는가?

현재 공개 API는 바뀌면 안 됩니다. 하지만 내부 구현은 바뀌어야 합니다.
이때 바로가기에 필요한 구조입니다.

- 공개 API 호환성은 `routes`와 `constants` 응답 샘플 기준으로 유지됩니다.
- 실제 데이터 소스는 `datasource`만 바꾸면 되도록 계층을 분리했습니다.
- `USE_MOCK_DATA`를 통해 공개 응답 유지 상태에서 점진적으로 전환 가능합니다.

## 3-1) Team Notion 리팩터링 방향

현재 `team` 모듈은 아래 방향으로 구조를 정리하고 있습니다.

- `fetcher`는 Notion API를 호출합니다.
- `fetcher`는 최종 응답이 아니라 raw source를 반환합니다.
- `extractor`는 Notion page/block에서 필요한 값을 읽습니다.
- `parser`는 raw Notion 객체를 도메인 친화적인 값으로 해석합니다.
- `assembler`는 최종 REST 응답을 조립합니다.
- `repository`는 여러 fetch 결과를 조합해 하나의 조회 흐름을 만듭니다.
- `repository`는 cross-source 값이나 아직 미연동된 값의 mock supplement도 이 단계에서 관리합니다.
- `crewLog`는 `Crew Book 계정(프로필) people -> 임원 lookup datasource의 people 필드` 매칭으로 role을 조합합니다.
- `crewLog.department`는 `Crew Book 작성기수 -> 활동학기/기수 매핑 datasource -> 해당 기수의 Crew Book 팀 필드` 흐름으로 계산합니다.
- lookup에 없는 기수는 일반 활동회원 이력으로 fallback 합니다.
- 현재 role 코드는 `회장 -> CREW_ROLE/P`, `부회장 -> CREW_ROLE/VP`, `총무 -> CREW_ROLE/EA`, `일반 크루원 -> CREW_ROLE/CREW`로 매핑합니다.
- 현재 department 코드는 `임원진 -> DEPARTMENT_TYPE/CLEVEL`, `개발팀 -> DEPARTMENT_TYPE/DEV`, `인프라개발팀 -> DEPARTMENT_TYPE/INFRA_DEV`, `인프라팀 -> DEPARTMENT_TYPE/INFRA`, `운영지원팀 -> DEPARTMENT_TYPE/GA`, `디자인팀 -> DEPARTMENT_TYPE/DESIGN`으로 매핑합니다.

예를 들어 `GET /team/crew`는 다음과 같은 흐름으로 읽으면 됩니다.

```text
route/team.ts
  -> TeamQueryService
  -> TeamRealRepository
  -> CrewFetcher
  -> crew-page.extractor / notion-block.extractor
  -> repository aggregate composition
  -> crew-response.assembler
```

`GET /team/activity`, `GET /team/project`는 다음처럼 조금 더 세분화됩니다.

```text
route/team.ts
  -> TeamQueryService
  -> TeamRealRepository
  -> ActivityFetcher(raw sources from project datasource)
  -> ActivityFetcher(raw sources from study datasource)
  -> repository merge in memory
  -> repository aggregate composition
  -> activity-page.parser
  -> activity-response.assembler or project-response.assembler
```

현재 실제 호출스택은 아래처럼 이해하면 가장 정확합니다.

- `GET /team/crew`
  - `route -> service -> TeamRealRepository -> CrewFetcher(raw sources) -> extractors -> repository aggregate composition -> crew-response.assembler`
- `GET /team/activity`
  - `route -> service -> TeamRealRepository -> project/study ActivityFetcher(raw sources) -> repository merge in memory -> activity-page.parser -> repository aggregate composition -> activity-response.assembler`
- `GET /team/project`
  - `route -> service -> TeamRealRepository -> project/study ActivityFetcher(raw sources) -> repository merge in memory -> activity-page.parser -> repository aggregate composition -> project-response.assembler`

즉 현재 `activity list`는 project datasource와 study datasource를 각각 읽은 뒤 메모리에서 병합하고, `project list`는 그 병합 결과 중 `ACTIVITY_TYPE/PROJECT`로 판별된 항목만 추려 구성합니다.

## 4) 공개 API 목록

### Team
- `GET /team/crew`
  - 응답에는 `total`, `keys`, `data`가 함께 내려가며, `keys`에는 해당 응답에서 실제 사용된 `crewLog.department` / `crewLog.type` key-value 매핑이 포함됩니다.
- `GET /team/department`
  - 전체 `crewLog.department` key-value 사전을 반환합니다.
- `GET /team/crewtype`
  - 전체 `crewLog.type` key-value 사전을 반환합니다.
- `GET /team/activity`
- `GET /team/crew/:crew_id`
- `GET /team/project`
- `GET /team/project/:project_id`

### Cloud
- `GET /cloud/brief`
- `GET /cloud/use_project`
- `GET /cloud/qna`
- `GET /cloud/notice`
- `GET /cloud/notice/:notice_id`
- `GET /cloud/product`
- `GET /cloud/product/:product_id`

### Health
- `GET /health`

### 내부 학습용(개발 전용)
- `GET /internal/example/architecture-check`
- `NODE_ENV=development`일 때만 노출됩니다.

## 5) 처음 실행하기 (초심자용)

- Node.js: `20.x`
- npm 설치

```bash
npm install
```

### 개발 실행
```bash
npm run dev
```

### 타입 체크
```bash
npm run typecheck
```

### 빌드
```bash
npm run build
```

### 실행
```bash
npm run start
```

기본 포트: `8001`

```text
사용 가능한 엔드포인트
http://localhost:8001/docs
http://localhost:8001/openapi.json
```

## 6) 환경변수 가이드

### 공통 환경
- `NODE_ENV`
  - `development`면 내부 예시 API가 노출됩니다.
- `CORS_ALLOW_ORIGINS`
  - 쉼표 구분 문자열
- `CORS_ALLOW_METHODS`
- `CORS_ALLOW_HEADERS`
- `CORS_ALLOW_CREDENTIALS`
- `USE_MOCK_DATA`
  - `true`: mock datasource 사용(기본)
  - `false`: prisma datasource 사용(현재는 동일 더미 반환)
- `DATABASE_URL`
  - PostgreSQL 연결 문자열
  - 현재는 `crew` 프로필 이미지 URL 캐시 저장소로 사용합니다.
- `NOTION_API_KEY`
  - Notion API 호출용 integration secret
- `NOTION_TEAM_DB_IDS`
  - `crew:<id>,activity:<id>,study:<id>,project:<id>,crew_role_lookup:<id>` 형식의 key-value 문자열
  - 현재 구현 기준 필수값은 `crew`, `activity`입니다.
  - `study`를 넣으면 `/team/activity` 병합 시 해당 datasource를 사용하고, 없으면 코드에 내장된 기본 study datasource ID를 사용합니다.
  - `project`는 향후 project detail 구현용 예약 키로 보고 있으며, 현 시점의 project list 호출에는 사용하지 않습니다.
  - `crew_role_lookup`는 crewLog 임원 정보 lookup용 보조 데이터소스입니다.

예시:
```bash
NODE_ENV=development \
USE_MOCK_DATA=true \
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173 \
CORS_ALLOW_METHODS=GET,POST,OPTIONS \
CORS_ALLOW_HEADERS=Content-Type,Authorization \
CORS_ALLOW_CREDENTIALS=true \
npm run dev
```

모든 Origin 허용(개발 편의):
```bash
CORS_ALLOW_ORIGINS=* npm run dev
```

시작 시 로그로 다음이 출력됩니다.
- 허용된 env 키 목록
- 실제 적용된 env 값

## 7) Prisma(준비 상태)

현재는 준비 단계이므로 최소 예시 모델만 존재합니다.

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:migrate:dev
npm run prisma:studio
```

프로필 이미지 캐시를 수동으로 한 번 동기화하려면:

```bash
npm run team:profile-image:sync
```

`USE_MOCK_DATA=false` 이고 `DATABASE_URL`이 설정되어 있으면, 서버는 시작 후 즉시 한 번 동기화하고 이후 12시간마다 프로필 이미지 URL 캐시를 갱신합니다.

## 8) 신규 API/로직 추가 방법

1. `repositories`에서 인터페이스를 정의합니다.
2. `datasources`에 mock/prisma 구현체를 추가합니다.
3. `services`에서 비즈니스 규칙을 작성합니다.
4. `routes`에서 엔드포인트와 Swagger 응답 형식을 등록합니다.
5. `server.ts`에서 사용할 datasource와 서비스를 연결합니다.
6. `typecheck`와 `build`로 타입/컴파일만 먼저 통과시킵니다.

## 9) 실무에서 꼭 지켜야 할 점

- 공개 API 응답 키는 문서 기준으로 그대로 유지하세요.
  - 현재 코드에는 오탈자 키(예: `attatchments`, `RECRIUTING`, `__________`)가 실제 응답 규칙의 일부로 들어가 있습니다.
- 내부 로직을 확장할 때는 바로 `datasource`만 교체하는 방식으로 접근 범위를 좁히세요.
- 새 구조를 이해하려면 먼저 `server.ts -> routes -> services -> repositories -> datasources` 순으로 추적하면 전체 흐름이 보입니다.
