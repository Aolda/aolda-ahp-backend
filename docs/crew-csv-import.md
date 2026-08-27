# Crew CSV 일괄 등록/수정

관리자 콘솔은 이 백엔드에서 제공한다. 프런트엔드 저장소 변경이나 별도 서비스는 필요 없다.

## 사용법

크루 관리 → CSV 일괄 등록 → 빈 양식 다운로드 → UTF-8 CSV 업로드 → 미리보기·검증 → 전체 행 저장.
한 파일은 최대 512KB/1,000행이다. UTF-8 BOM, CRLF/LF, 인용부호·쉼표·여러 줄 소개를 지원한다.

| 열 | 의미 |
| --- | --- |
| crewId | 기존 크루 수정 시 필수. 크루 상세 상단에서 복사. 신규 등록에서는 빈 값 |
| name, email | 신규 등록 필수. 이메일은 대소문자 무시 중복 검사, 이름으로 병합하지 않음 |
| joinedGen | 0~999 정수 |
| univDepartment | 학과, 최대 200자 |
| univJoinedYear | 4자리 입학연도만. 전체 학번은 거부하고 미리보기에서도 제외 |
| description | 소개, 최대 5,000자 |
| isVisible | true/false. 신규 등록의 빈 값은 false |
| notionPageId | 선택적 Notion Crew 페이지 UUID. 기존 연결 교체는 거부 |

빈 셀은 기존 값을 삭제하지 않는다. 오류 행이 하나라도 있으면 저장할 수 없다.
미리보기 토큰은 CSV/모드/관리자/크루 스냅샷에 결합되고 15분 후 만료된다.
미리보기 뒤 다른 관리자나 동기화가 데이터를 변경하면 재검증한다. 저장은 Serializable 트랜잭션으로 전체 적용/전체 취소한다.
네트워크 오류로 결과가 불명확할 때는 목록을 확인하고 미리보기부터 다시 진행한다. 같은 신규 등록 토큰을 재전송해도 중복 생성하지 않는다.

## 데이터 소유권

- `csv:` sourceKey로 로컬 크루를 생성한다. Notion 쓰기/계정 생성은 하지 않는다.
- 이름·이메일·기수는 새 nullable 관리자 override 3개, 학과·입학연도·소개·공개 여부는 기존 관리자 필드에 저장한다.
- 공개 목록/상세/프로젝트 참여자와 관리자 크루 조회에 override를 반영한다.
- 명시적으로 연결된 Notion 페이지가 수집되면 동일 레코드를 갱신한다. sourceKey와 페이지 ID가 서로 다른 기존 크루를 가리키면 자동 병합하지 않고 동기화를 중단한다. 관리자가 연결을 확인해야 한다.
- Notion 페이지를 연결하지 않은 CSV 크루는 Notion 이미지 갱신 대상에서 건너뛴다(별도 이미지 갱신 PR).
- 동일 이름인 별개의 크루는 허용한다. 같은 이메일의 신규 행은 거부하며 기존 수정 모드/crewId를 사용한다.

## 검증

`npm run prisma:generate`, `npm run typecheck`, `npm run build`, `npm run crew:csv:test`, `npm run crew:academic:test`.
`npm run crew:csv:integration`은 localhost:55439의 `ahp_admin_features_test` 전용 DB만 허용한다.
DB 통합 검증: 원자적 롤백, 토큰 변조/다른 관리자/재전송/오래된 미리보기 거부, 공개 기본값, 빈 셀 유지, Notion 재동기화 보존, 연결 중복 방지, 목록/상세/참여자 매핑.

## 운영 적용/롤백 (PR 승인·병합 후에만)

1. 대상은 기존 AOLDA_BETA_nate2402의 ahp 네임스페이스. 승인 SHA와 diff를 확인한다. 다른 미병합 작업은 배포하지 않는다.
2. 현재 이미지, `/opt/aolda/ahp-k3s.yaml`, DB pg_dump 백업을 권한 제한 디렉터리에 보존한다. 비밀값/CSV 원문을 출력하지 않는다.
3. 운영은 과거 db push 기반이므로 마이그레이션 이력과 실제 컬럼을 먼저 확인한다. `migrate deploy`나 과거 db push initContainer를 무조건 실행하지 않는다.
4. `20260827110000_crew_csv_import/migration.sql`의 nullable 컬럼 3개만 트랜잭션으로 추가한다. 이미 존재하면 타입/nullable 상태 확인 후 건너뛴다. 이력을 일괄 조작하지 않는다.
5. 새 backend 이미지 배포 후 관리자 인증, 양식, 검증, 합성 비공개 크루 한 건 등록/수정, 공개 API를 확인한다. 기존 개인정보를 테스트 CSV로 내보내지 않는다.
6. 실패 시 이전 앱 이미지로 롤백한다. 추가 컬럼은 유지하며 구버전 `prisma db push`로 삭제하지 않는다. 이전 앱은 새 override를 읽지 않으므로 롤백 중 CSV 수정값 표시가 일시적으로 원본으로 돌아갈 수 있다.

이 PR에는 운영 변경/자동 승인/자동 병합이 포함되지 않는다.
