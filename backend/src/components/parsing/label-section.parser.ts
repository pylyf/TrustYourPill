import type { LabelSection } from "../schemas/evidence.schema.js";
import { createExcerpt } from "../utils/excerpts.js";
import type { DailyMedDrugLabel } from "../integrations/dailymed.client.js";

const SECTION_CONFIG = [
  { key: "boxed_warning", title: "Boxed Warning" },
  { key: "contraindications", title: "Contraindications" },
  { key: "drug_interactions", title: "Drug Interactions" },
  { key: "drug_and_or_laboratory_test_interactions", title: "Drug and Laboratory Test Interactions" },
  { key: "warnings", title: "Warnings" },
  { key: "ask_doctor_or_pharmacist", title: "Ask Doctor or Pharmacist" },
  { key: "adverse_reactions", title: "Adverse Reactions" }
] as const;

type OpenFdaLabelShape = Record<string, unknown>;

export function parseLabelSections(label: OpenFdaLabelShape): LabelSection[] {
  return SECTION_CONFIG.flatMap((section) => {
    const fullText = normalizeSectionText(label[section.key]);

    if (!fullText) {
      return [];
    }

    return [
      {
        name: section.key,
        title: section.title,
        excerpt: createExcerpt(fullText, 320),
        fullText
      }
    ];
  });
}

const DAILYMED_SECTION_RULES = [
  {
    name: "boxed_warning",
    title: "Boxed Warning",
    matches: (section: DailyMedDrugLabel["sections"][number]) =>
      section.code === "34066-1" || includesAny(section, ["boxed warning"])
  },
  {
    name: "contraindications",
    title: "Contraindications",
    matches: (section: DailyMedDrugLabel["sections"][number]) =>
      section.code === "34070-3" || includesAny(section, ["contraindications"])
  },
  {
    name: "drug_interactions",
    title: "Drug Interactions",
    matches: (section: DailyMedDrugLabel["sections"][number]) =>
      section.code === "34073-7" || includesAny(section, ["drug interactions"])
  },
  {
    name: "drug_and_or_laboratory_test_interactions",
    title: "Drug and Laboratory Test Interactions",
    matches: (section: DailyMedDrugLabel["sections"][number]) =>
      includesAny(section, ["laboratory test interactions", "drug and laboratory test interactions"])
  },
  {
    name: "warnings",
    title: "Warnings",
    matches: (section: DailyMedDrugLabel["sections"][number]) =>
      section.code === "34071-1" || includesAny(section, ["warnings", "warnings and precautions"])
  },
  {
    name: "ask_doctor_or_pharmacist",
    title: "Ask Doctor or Pharmacist",
    matches: (section: DailyMedDrugLabel["sections"][number]) =>
      includesAny(section, ["ask a doctor or pharmacist", "otc - ask doctor/pharmacist"])
  },
  {
    name: "adverse_reactions",
    title: "Adverse Reactions",
    matches: (section: DailyMedDrugLabel["sections"][number]) =>
      section.code === "34084-4" || includesAny(section, ["adverse reactions"])
  }
] as const;

export function parseDailyMedLabelSections(label: DailyMedDrugLabel): LabelSection[] {
  return DAILYMED_SECTION_RULES.flatMap((rule) => {
    const section = label.sections.find(rule.matches);

    if (!section || section.text.trim().length === 0) {
      return [];
    }

    const fullText = section.text.replace(/\s+/g, " ").trim();

    return [
      {
        name: rule.name,
        title: rule.title,
        excerpt: createExcerpt(fullText, 320),
        fullText
      }
    ];
  });
}

function normalizeSectionText(value: unknown) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const text = value
      .filter((item): item is string => typeof item === "string")
      .join("\n\n")
      .replace(/\s+/g, " ")
      .trim();

    return text.length > 0 ? text : null;
  }

  if (typeof value === "string") {
    const text = value.replace(/\s+/g, " ").trim();
    return text.length > 0 ? text : null;
  }

  return null;
}

function includesAny(section: DailyMedDrugLabel["sections"][number], patterns: string[]) {
  const haystack = `${section.displayName ?? ""} ${section.title ?? ""}`.toLowerCase();
  return patterns.some((pattern) => haystack.includes(pattern));
}
