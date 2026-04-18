export type MedicationSearchCandidate = {
  rxcui: string;
  rxaui: string | null;
  displayName: string;
  normalizedName: string;
  confidenceScore: number;
  rank: number;
  source: string;
};

export type MedicationScanResponse = {
  source: "openai_vision";
  model: string;
  extraction: {
    isMedicationPackaging: boolean;
    packagingType: "bottle" | "box" | "blister_pack" | "printed_label" | "other" | "unknown";
    medicationName: string | null;
    dosageText: string | null;
    formText: string | null;
    manufacturer: string | null;
    visibleText: string[];
    confidence: "high" | "medium" | "low";
    requiresReview: boolean;
  };
  match: {
    status: "matched" | "ambiguous" | "no_match";
    reason: string;
    query: string | null;
    candidateCount: number;
    bestCandidate: MedicationSearchCandidate | null;
    candidates: MedicationSearchCandidate[];
  };
};
