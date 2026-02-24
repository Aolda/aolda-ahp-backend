import {
  InternalArchitectureCheckResponse,
  InternalExampleRepository,
} from '../repositories/internal-example.repository';

export class InternalExampleService {
  constructor(private readonly internalExampleRepository: InternalExampleRepository) {}

  // Service는 비즈니스 규칙(검증/권한/가공/예외 처리)을 담는 계층입니다.
  // TODO(질의자 구현 포인트): 실제 예시 유스케이스 규칙을 여기에 구현하세요.
  async getArchitectureCheck(): Promise<InternalArchitectureCheckResponse> {
    return this.internalExampleRepository.getArchitectureCheck();
  }
}
