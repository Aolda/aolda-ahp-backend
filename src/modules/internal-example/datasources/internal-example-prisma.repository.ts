import {
  InternalArchitectureCheckResponse,
  InternalExampleRepository,
} from '../repositories/internal-example.repository';

// Datasource(prisma): 실제 DB 질의 구현 자리입니다.
export class InternalExamplePrismaRepository implements InternalExampleRepository {
  // TODO(질의자 구현 포인트): Prisma Client를 주입받아 실제 쿼리로 교체하세요.
  async getArchitectureCheck(): Promise<InternalArchitectureCheckResponse> {
    return {
      routeLayer: 'internal-example-route',
      serviceLayer: 'internal-example-service',
      repositoryLayer: 'internal-example-repository',
      datasource: 'prisma-prepared',
      message: 'route -> service -> repository -> datasource(prisma 준비) 호출 흐름이 정상입니다.',
    };
  }
}
