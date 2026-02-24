import {
  InternalArchitectureCheckResponse,
  InternalExampleRepository,
} from '../repositories/internal-example.repository';

// Datasource(mock): 현재 단계에서는 응답 호환을 위해 더미 데이터를 반환합니다.
export class InternalExampleMockRepository implements InternalExampleRepository {
  // TODO(질의자 구현 포인트): 필요 시 mock fixture를 분리해 시나리오별 응답을 확장하세요.
  async getArchitectureCheck(): Promise<InternalArchitectureCheckResponse> {
    return {
      routeLayer: 'internal-example-route',
      serviceLayer: 'internal-example-service',
      repositoryLayer: 'internal-example-repository',
      datasource: 'mock',
      message: 'route -> service -> repository -> datasource(mock) 호출 흐름이 정상입니다.',
    };
  }
}
