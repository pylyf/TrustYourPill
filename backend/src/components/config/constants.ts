export const CACHE_TTLS = {
  rxNavDays: 30,
  evidenceDays: 7
} as const;

export const DISCLAIMER = "Prototype only. Not medical advice.";

export const TABLES = {
  userMedications: "user_medications",
  medicationEvidenceCache: "medication_evidence_cache",
  checkResults: "check_results"
} as const;
