import type { MedicationProfileResponse } from "../schemas/medication.schema.js";
import type {
  MedicationCheckSideEffectSignal,
  MedicationCheckSupportiveCareIdea
} from "../schemas/check.schema.js";

type DomainRule = {
  domain: MedicationCheckSideEffectSignal["domain"];
  patterns: string[];
};

const DOMAIN_RULES: DomainRule[] = [
  {
    domain: "bleeding_risk",
    patterns: ["bleeding", "hemorrhage", "haemorrhage", "bruise", "gastrointestinal bleeding"]
  },
  {
    domain: "stomach_irritation",
    patterns: ["stomach", "gastric", "ulcer", "nausea", "vomiting", "abdominal pain", "gastrointestinal"]
  },
  {
    domain: "liver_caution",
    patterns: ["liver", "hepatic", "hepatotoxic", "transaminase", "jaundice", "alanine aminotransferase"]
  },
  {
    domain: "kidney_caution",
    patterns: ["kidney", "renal", "creatinine", "urination", "dehydration", "urine output"]
  },
  {
    domain: "sedation",
    patterns: ["drowsiness", "sedation", "somnolence", "sleepiness", "dizzy", "impaired alertness"]
  }
];

type DomainAccumulator = {
  domain: MedicationCheckSideEffectSignal["domain"];
  medications: Set<string>;
  sourceSections: Set<string>;
  severity: MedicationCheckSideEffectSignal["severity"];
};

export function buildFallbackSideEffectSignals(
  candidateProfile: MedicationProfileResponse,
  currentProfiles: MedicationProfileResponse[]
): MedicationCheckSideEffectSignal[] {
  const accumulators = new Map<MedicationCheckSideEffectSignal["domain"], DomainAccumulator>();
  const profiles = [candidateProfile, ...currentProfiles];

  for (const profile of profiles) {
    for (const section of profile.sections) {
      const haystack = `${section.title} ${section.excerpt} ${section.fullText}`.toLowerCase();

      for (const rule of DOMAIN_RULES) {
        if (!rule.patterns.some((pattern) => haystack.includes(pattern))) {
          continue;
        }

        const existing = accumulators.get(rule.domain) ?? {
          domain: rule.domain,
          medications: new Set<string>(),
          sourceSections: new Set<string>(),
          severity: "low" as const
        };

        existing.medications.add(profile.normalizedMedication.normalizedName);
        existing.sourceSections.add(section.name);
        existing.severity = pickHigherSeverity(existing.severity, inferSeverity(section.name));
        accumulators.set(rule.domain, existing);
      }
    }
  }

  return Array.from(accumulators.values())
    .map((item) => ({
      domain: item.domain,
      severity: item.severity,
      sourceSections: Array.from(item.sourceSections),
      explanation: buildSignalExplanation(item.domain, Array.from(item.medications), Array.from(item.sourceSections))
    }))
    .sort(compareSignals);
}

export function buildFallbackSupportiveCareIdeas(
  signals: MedicationCheckSideEffectSignal[]
): MedicationCheckSupportiveCareIdea[] {
  const ideas = new Map<string, MedicationCheckSupportiveCareIdea>();

  for (const signal of signals) {
    for (const idea of buildIdeasForSignal(signal)) {
      const key = `${idea.type}:${idea.label}:${idea.candidateName ?? ""}`;
      ideas.set(key, idea);
    }
  }

  return Array.from(ideas.values()).slice(0, 6);
}

function buildIdeasForSignal(signal: MedicationCheckSideEffectSignal): MedicationCheckSupportiveCareIdea[] {
  switch (signal.domain) {
    case "bleeding_risk":
      return [
        {
          type: "monitoring",
          label: "Ask what bleeding symptoms should trigger a call to a clinician",
          rationale: "Bleeding-related label evidence was detected, so symptom monitoring should be reviewed.",
          candidateName: null,
          requiresReview: true,
          shouldCheckInteractions: false
        },
        {
          type: "avoidance",
          label: "Avoid adding OTC pain relievers or supplements without checking first",
          rationale: "Bleeding risk can increase when other medicines or supplements are added casually.",
          candidateName: null,
          requiresReview: true,
          shouldCheckInteractions: true
        }
      ];
    case "stomach_irritation":
      return [
        {
          type: "food",
          label: "Ask whether taking the medication with food is appropriate",
          rationale: "The label suggests stomach irritation or GI-related side effects may matter here.",
          candidateName: null,
          requiresReview: true,
          shouldCheckInteractions: false
        },
        {
          type: "hydration",
          label: "Keep an eye on hydration if nausea or stomach upset appears",
          rationale: "GI side effects can lead to poorer tolerance and dehydration.",
          candidateName: null,
          requiresReview: false,
          shouldCheckInteractions: false
        }
      ];
    case "liver_caution":
      return [
        {
          type: "monitoring",
          label: "Ask whether liver-related symptoms or labs need monitoring",
          rationale: "The retrieved label text includes liver-related caution signals.",
          candidateName: null,
          requiresReview: true,
          shouldCheckInteractions: false
        }
      ];
    case "kidney_caution":
      return [
        {
          type: "hydration",
          label: "Ask whether hydration or kidney monitoring matters for this regimen",
          rationale: "The label includes kidney-related caution signals that may affect tolerability.",
          candidateName: null,
          requiresReview: true,
          shouldCheckInteractions: false
        }
      ];
    case "sedation":
      return [
        {
          type: "timing_discussion",
          label: "Ask whether timing changes could reduce daytime drowsiness",
          rationale: "Sedation-related language was found in the retrieved label evidence.",
          candidateName: null,
          requiresReview: true,
          shouldCheckInteractions: false
        }
      ];
    default:
      return [];
  }
}

function buildSignalExplanation(
  domain: MedicationCheckSideEffectSignal["domain"],
  medications: string[],
  sections: string[]
) {
  const medicationText = medications.join(", ");
  const sectionText = sections.map((item) => item.replaceAll("_", " ")).join(", ");

  switch (domain) {
    case "bleeding_risk":
      return `Label evidence for ${medicationText} includes bleeding-related language in ${sectionText}.`;
    case "stomach_irritation":
      return `Label evidence for ${medicationText} includes stomach or GI-related language in ${sectionText}.`;
    case "liver_caution":
      return `Label evidence for ${medicationText} includes liver-related caution in ${sectionText}.`;
    case "kidney_caution":
      return `Label evidence for ${medicationText} includes kidney-related caution in ${sectionText}.`;
    case "sedation":
      return `Label evidence for ${medicationText} includes sedation or dizziness language in ${sectionText}.`;
    default:
      return `Label evidence for ${medicationText} includes relevant side-effect language in ${sectionText}.`;
  }
}

function inferSeverity(sectionName: string): MedicationCheckSideEffectSignal["severity"] {
  if (sectionName === "boxed_warning" || sectionName === "contraindications" || sectionName === "drug_interactions") {
    return "high";
  }

  if (sectionName === "warnings" || sectionName === "ask_doctor_or_pharmacist") {
    return "moderate";
  }

  return "low";
}

function pickHigherSeverity(
  current: MedicationCheckSideEffectSignal["severity"],
  next: MedicationCheckSideEffectSignal["severity"]
): MedicationCheckSideEffectSignal["severity"] {
  const order: Record<MedicationCheckSideEffectSignal["severity"], number> = {
    low: 0,
    moderate: 1,
    high: 2
  };

  return order[next] > order[current] ? next : current;
}

function compareSignals(
  left: MedicationCheckSideEffectSignal,
  right: MedicationCheckSideEffectSignal
) {
  const order: Record<MedicationCheckSideEffectSignal["severity"], number> = {
    high: 0,
    moderate: 1,
    low: 2
  };

  return order[left.severity] - order[right.severity];
}
