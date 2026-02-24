export interface InternalArchitectureCheckResponse {
  routeLayer: 'internal-example-route';
  serviceLayer: 'internal-example-service';
  repositoryLayer: 'internal-example-repository';
  datasource: 'mock' | 'prisma-prepared';
  message: string;
}

// Repository는 서비스가 의존하는 데이터 접근 계약(인터페이스)입니다.
export interface InternalExampleRepository {
  // TODO(질의자 구현 포인트): 실제 예시 도메인 데이터를 조회하도록 구현하세요.
  getArchitectureCheck(): Promise<InternalArchitectureCheckResponse>;
}
