import { MedicationCheckService } from "../services/medication-check.service.js";
import type { MedicationCheckResponse } from "../schemas/check.schema.js";
import type { TraceContext } from "../utils/trace.js";

export class MedicationCheckAgent {
  constructor(private readonly medicationCheckService: MedicationCheckService = new MedicationCheckService()) {}

  async run(
    candidateMedication: string,
    currentMedications: string[],
    traceContext?: TraceContext
  ): Promise<MedicationCheckResponse> {
    return this.medicationCheckService.check(candidateMedication, currentMedications, traceContext);
  }
}
