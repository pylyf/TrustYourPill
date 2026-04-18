import { randomUUID } from "node:crypto";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3001";
const smokeUserId = `smoke-${randomUUID()}`;

const candidateMedication = "ibuprofen";
const currentMedications = ["warfarin", "aspirin"];

async function main() {
  const health = await requestJson("/health");
  const search = await requestJson(`/api/medications/search?q=${encodeURIComponent(candidateMedication)}`);
  const profile = await requestJson(`/api/medications/profile?name=${encodeURIComponent("warfarin")}`);

  const firstCandidate = search.candidates?.[0];

  if (!firstCandidate) {
    throw new Error("Smoke test search returned no candidates.");
  }

  const saveMedication = await requestJson(`/api/users/${smokeUserId}/medications`, {
    method: "POST",
    body: JSON.stringify({
      inputName: firstCandidate.displayName,
      displayName: firstCandidate.displayName,
      normalizedName: firstCandidate.normalizedName,
      rxcui: firstCandidate.rxcui,
      rxaui: firstCandidate.rxaui,
      source: firstCandidate.source,
      searchScore: firstCandidate.confidenceScore
    })
  });

  const listMedications = await requestJson(`/api/users/${smokeUserId}/medications`);
  const medicationCheck = await requestJson("/api/medications/check", {
    method: "POST",
    body: JSON.stringify({
      candidateMedication,
      currentMedications
    })
  });

  await requestJson(`/api/users/${smokeUserId}/medications/${saveMedication.medication.id}`, {
    method: "DELETE"
  });

  const summary = {
    healthStatus: health.status,
    searchCandidateCount: search.candidateCount,
    profileSource: profile.evidenceSource?.source,
    savedMedicationId: saveMedication.medication?.id,
    listedMedicationCount: listMedications.count,
    checkStatus: medicationCheck.summary?.status,
    aiGeneratedBy: medicationCheck.aiSummary?.generatedBy,
    sideEffectSignalCount: medicationCheck.sideEffectSignals?.length ?? 0,
    supportiveCareIdeaCount: medicationCheck.supportiveCareIdeas?.length ?? 0
  };

  console.log(JSON.stringify(summary, null, 2));
}

async function requestJson(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {})
  };

  const response = await fetch(`${baseUrl}${path}`, {
    headers,
    ...options
  });

  const text = await response.text();
  const body = text.length > 0 ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`Smoke test request failed for ${path}: ${response.status} ${text}`);
  }

  return body;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
