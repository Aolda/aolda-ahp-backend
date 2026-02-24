import { FastifyInstance } from 'fastify';

import { successSchema } from '../../../constants/schemas';
import { InternalExampleService } from '../services/internal-example.service';

const ARCHITECTURE_CHECK_EXAMPLE = {
  routeLayer: 'internal-example-route',
  serviceLayer: 'internal-example-service',
  repositoryLayer: 'internal-example-repository',
  datasource: 'mock',
  message: 'route -> service -> repository -> datasource(mock) 호출 흐름이 정상입니다.',
};

interface InternalExampleRouteDeps {
  internalExampleService: InternalExampleService;
}

// Route는 HTTP 책임(요청 파싱/응답 형식/Swagger 문서화)만 담당합니다.
export async function registerInternalExampleRoutes(
  app: FastifyInstance,
  deps: InternalExampleRouteDeps,
): Promise<void> {
  const { internalExampleService } = deps;

  app.get(
    '/internal/example/architecture-check',
    {
      schema: {
        tags: ['internal-example'],
        summary: '아키텍처 계층 호출 예시 (개발 전용)',
        response: {
          200: successSchema(ARCHITECTURE_CHECK_EXAMPLE),
        },
      } as any,
    },
    async () => internalExampleService.getArchitectureCheck(),
  );
}
