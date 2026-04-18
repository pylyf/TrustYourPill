import { MedicationRepository, type CreateUserMedicationInput, type UserMedicationRecord } from "../storage/medication.repository.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export class UserMedicationService {
  private readonly logger = createLogger("user-medication-service");

  constructor(private readonly medicationRepository: MedicationRepository = new MedicationRepository()) {}

  async listUserMedications(userId: string, traceContext?: TraceContext) {
    this.logger.info("Listing user medications", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      userId
    });

    const medications = await this.medicationRepository.listByUserId(userId, traceContext);

    return {
      userId,
      count: medications.length,
      medications
    };
  }

  async saveUserMedication(input: CreateUserMedicationInput, traceContext?: TraceContext) {
    this.logger.info("Saving user medication", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      userId: input.userId,
      rxcui: input.rxcui
    });

    const medication = await this.medicationRepository.create(input, traceContext);

    return { medication };
  }

  async deleteUserMedication(userId: string, medicationId: string, traceContext?: TraceContext) {
    this.logger.info("Deleting user medication", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      userId,
      medicationId
    });

    await this.medicationRepository.deleteById(userId, medicationId, traceContext);

    return {
      deleted: true,
      medicationId,
      userId
    };
  }
}
