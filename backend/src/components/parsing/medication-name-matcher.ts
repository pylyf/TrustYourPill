type MatchMedicationNamesInput = {
  text: string;
  aliases: string[];
};

export function matchMedicationNames(input: MatchMedicationNamesInput) {
  const normalizedText = normalizeText(input.text);
  const matches = input.aliases.filter((alias) => {
    const normalizedAlias = normalizeText(alias);

    if (normalizedAlias.length < 3) {
      return false;
    }

    return containsWholePhrase(normalizedText, normalizedAlias);
  });

  return {
    matched: matches.length > 0,
    matches
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsWholePhrase(text: string, phrase: string) {
  return new RegExp(`(^| )${escapeRegex(phrase)}( |$)`, "i").test(text);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
