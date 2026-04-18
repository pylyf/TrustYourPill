import { MedicationSupportService } from "../services/medication-support.service.js";
import type { MedicationSupportResponse } from "../schemas/check.schema.js";
import type { TraceContext } from "../utils/trace.js";

export class MedicationSupportAgent {
  constructor(private readonly medicationSupportService: MedicationSupportService = new MedicationSupportService()) {}

  async run(
    candidateMedication: string,
    currentMedications: string[],
    traceContext?: TraceContext
  ): Promise<MedicationSupportResponse> {
    return this.medicationSupportService.getSupport(candidateMedication, currentMedications, traceContext);
  }
}
