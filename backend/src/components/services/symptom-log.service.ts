import { SymptomLogRepository } from "../storage/symptom-log.repository.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export class SymptomLogService {
  private readonly logger = createLogger("symptom-log-service");

  constructor(
    private readonly symptomLogRepository: SymptomLogRepository = new SymptomLogRepository()
  ) {}

  async listSymptomLogs(userId: string, traceContext?: TraceContext) {
    this.logger.info("Listing symptom logs", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      userId,
    });

    const logs = await this.symptomLogRepository.listByUserId(userId, 30, traceContext);

    return { userId, count: logs.length, logs };
  }

  async createSymptomLog(
    input: { userId: string; symptoms: string[]; otherText?: string | null; feelingGood: boolean },
    traceContext?: TraceContext
  ) {
    this.logger.info("Creating symptom log", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      userId: input.userId,
      feelingGood: input.feelingGood,
      symptomCount: input.symptoms.length,
    });

    const log = await this.symptomLogRepository.create(input, traceContext);

    return { log };
  }
}
