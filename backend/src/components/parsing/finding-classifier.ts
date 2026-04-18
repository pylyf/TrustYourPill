import type { MedicationProfileResponse } from "../schemas/medication.schema.js";
import type { MedicationCheckEvidenceItem } from "../schemas/check.schema.js";
import { matchMedicationNames } from "./medication-name-matcher.js";

type ClassifyFindingsInput = {
  candidateProfile: MedicationProfileResponse;
  currentProfiles: MedicationProfileResponse[];
};

const MEDICATION_CLASS_ALIASES: Record<string, string[]> = {
  anticoagulant: ["warfarin", "warfarin sodium", "eliquis", "apixaban", "xarelto", "rivaroxaban", "dabigatran", "heparin"],
  nsaid: ["ibuprofen", "naproxen", "celecoxib", "diclofenac", "ketorolac", "indomethacin", "aleve", "motrin", "advil"],
  serotonergic: ["sertraline", "fluoxetine", "paroxetine", "venlafaxine", "duloxetine", "escitalopram", "citalopram", "bupropion"]
};

export function classifyFindings(input: ClassifyFindingsInput): MedicationCheckEvidenceItem[] {
  const findings: MedicationCheckEvidenceItem[] = [];

  for (const currentProfile of input.currentProfiles) {
    const pairFindings = filterPairFindings(classifyPair(input.candidateProfile, currentProfile));

    if (pairFindings.length === 0) {
      findings.push({
        type: "no_direct_label_match",
        source: currentProfile.evidenceSource.source,
        section: "none",
        foundInMedication: currentProfile.input,
        medication: currentProfile.input,
        excerpt: "",
        reason: "No explicit or class-level label signal was found in the retrieved sections."
      });
    } else {
      findings.push(...pairFindings);
    }
  }

  return findings;
}

function classifyPair(
  candidateProfile: MedicationProfileResponse,
  currentProfile: MedicationProfileResponse
): MedicationCheckEvidenceItem[] {
  const findings: MedicationCheckEvidenceItem[] = [];
  const candidateAliases = buildAliases(candidateProfile);
  const currentAliases = buildAliases(currentProfile);

  for (const profile of [candidateProfile, currentProfile]) {
    const pairedMedicationName = profile === candidateProfile ? currentProfile.input : candidateProfile.input;
    const pairedAliases = profile === candidateProfile ? currentAliases : candidateAliases;

    for (const section of profile.sections) {
      if (!isRelevantSection(section.name)) {
        continue;
      }

      const explicitMatch = matchMedicationNames({
        text: section.fullText,
        aliases: pairedAliases
      });

      if (explicitMatch.matched) {
        const type =
          section.name === "drug_interactions" || section.name === "boxed_warning"
            ? "explicit_label_interaction"
            : section.name === "contraindications"
              ? "general_contraindication"
              : section.name === "adverse_reactions"
                ? "adverse_effect_context"
                : "general_warning";

        findings.push({
          type,
          source: profile.evidenceSource.source,
          section: section.name,
          foundInMedication: profile.input,
          medication: pairedMedicationName,
          excerpt: section.excerpt,
          reason: `The ${section.name} section mentions ${explicitMatch.matches[0]}.`
        });
        continue;
      }

      const classFinding = classifyClassWarning(section.fullText, pairedAliases);

      if (classFinding) {
        findings.push({
          type: section.name === "contraindications" ? "general_contraindication" : "general_warning",
          source: profile.evidenceSource.source,
          section: section.name,
          foundInMedication: profile.input,
          medication: pairedMedicationName,
          excerpt: section.excerpt,
          reason: `The ${section.name} section contains a class-level warning for ${classFinding}.`
        });
      }
    }
  }

  return dedupeFindings(findings);
}

function buildAliases(profile: MedicationProfileResponse) {
  return [...new Set(
    [
      profile.input,
      profile.normalizedMedication.normalizedName,
      ...profile.evidenceSource.brandNames,
      ...profile.evidenceSource.genericNames,
      ...profile.evidenceSource.substanceNames
    ]
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  )];
}

function isRelevantSection(sectionName: string) {
  return [
    "boxed_warning",
    "contraindications",
    "drug_interactions",
    "drug_and_or_laboratory_test_interactions",
    "warnings",
    "ask_doctor_or_pharmacist",
    "adverse_reactions"
  ].includes(sectionName);
}

function classifyClassWarning(text: string, aliases: string[]) {
  const lowerText = text.toLowerCase();

  if (aliases.some((alias) => MEDICATION_CLASS_ALIASES.anticoagulant.includes(alias.toLowerCase()))) {
    if (lowerText.includes("anticoagulant") || lowerText.includes("blood thinning") || lowerText.includes("bleeding risk")) {
      return "anticoagulants / bleeding-risk drugs";
    }
  }

  if (aliases.some((alias) => MEDICATION_CLASS_ALIASES.nsaid.includes(alias.toLowerCase()))) {
    if (lowerText.includes("nsaid") || lowerText.includes("non-steroidal anti-inflammatory")) {
      return "NSAIDs";
    }
  }

  if (aliases.some((alias) => MEDICATION_CLASS_ALIASES.serotonergic.includes(alias.toLowerCase()))) {
    if (lowerText.includes("serotonin") || lowerText.includes("serotonergic") || lowerText.includes("serotonin reuptake")) {
      return "serotonergic drugs";
    }
  }

  return null;
}

function dedupeFindings(findings: MedicationCheckEvidenceItem[]) {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = `${finding.type}:${finding.source}:${finding.section}:${finding.medication}:${finding.reason}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function filterPairFindings(findings: MedicationCheckEvidenceItem[]) {
  const explicit = findings.filter((finding) => finding.type === "explicit_label_interaction");

  if (explicit.length > 0) {
    return prioritizeExplicitFindings(explicit);
  }

  const important = findings.filter((finding) => finding.type !== "adverse_effect_context");

  if (important.length > 0) {
    return dedupeFindings(important).slice(0, 2);
  }

  return dedupeFindings(findings).slice(0, 1);
}

function prioritizeExplicitFindings(findings: MedicationCheckEvidenceItem[]) {
  const sorted = [...findings].sort((left, right) => {
    const score = (finding: MedicationCheckEvidenceItem) => {
      if (finding.section === "drug_interactions") {
        return 3;
      }

      if (finding.section === "boxed_warning") {
        return 2;
      }

      return 1;
    };

    return score(right) - score(left);
  });

  return dedupeFindings(sorted).slice(0, 2);
}
