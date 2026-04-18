const API_BASE = 'http://127.0.0.1:3001';

export const DEMO_USER_ID = 'demo-user-001';

export type MedicationAnalysis = {
  summary: {
    status: 'avoid_until_reviewed' | 'review_before_use' | 'insufficient_evidence' | 'safe';
    headline: string;
    explanation: string;
  };
  aiSummary: {
    headline: string;
    plainLanguageSummary: string;
    whatTriggeredThis: string;
    questionsForClinician: string[];
  };
  sideEffectSignals?: Array<{ domain: string; severity: string; explanation: string }>;
  supportiveCareIdeas?: Array<{ type: string; label: string; rationale: string; candidateName: string }>;
};

export type UserMedication = {
  id: string;
  userId: string;
  inputName: string;
  displayName: string;
  normalizedName: string;
  rxcui: string;
  rxaui?: string;
  source: string;
  searchScore?: number;
  scheduleTimes: string[];
  dosageText?: string | null;
  analysis: MedicationAnalysis | null;
  analysisAt: string | null;
  createdAt: string;
};

export type MedicationCandidate = {
  rxcui: string;
  rxaui?: string;
  displayName: string;
  normalizedName: string;
  confidenceScore: number;
  rank: number;
  source: string;
};

export async function getUserMedications(): Promise<UserMedication[]> {
  const res = await fetch(`${API_BASE}/api/users/${DEMO_USER_ID}/medications`);
  if (!res.ok) throw new Error('Failed to fetch medications');
  const data = await res.json();
  return data.medications as UserMedication[];
}

export async function addUserMedication(input: {
  inputName: string;
  displayName: string;
  normalizedName: string;
  rxcui: string;
  rxaui?: string;
  source: string;
  searchScore?: number;
  scheduleTimes?: string[];
  dosageText?: string | null;
  analysis?: MedicationAnalysis | null;
}): Promise<UserMedication> {
  const res = await fetch(`${API_BASE}/api/users/${DEMO_USER_ID}/medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to add medication');
  const data = await res.json();
  return data.medication as UserMedication;
}

export async function deleteUserMedication(medId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/users/${DEMO_USER_ID}/medications/${medId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete medication');
}

export async function searchMedication(q: string): Promise<{ candidates: MedicationCandidate[] }> {
  const res = await fetch(`${API_BASE}/api/medications/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Failed to search medication');
  return res.json();
}

// ── Symptom logs ──────────────────────────────────────────────────────────────

export type SymptomLog = {
  id: string;
  userId: string;
  symptoms: string[];
  otherText: string | null;
  feelingGood: boolean;
  loggedAt: string;
};

export async function getSymptomLogs(): Promise<SymptomLog[]> {
  const res = await fetch(`${API_BASE}/api/users/${DEMO_USER_ID}/symptom-logs`);
  if (!res.ok) throw new Error('Failed to fetch symptom logs');
  const data = await res.json();
  return data.logs as SymptomLog[];
}

export async function createSymptomLog(input: {
  symptoms: string[];
  otherText?: string | null;
  feelingGood: boolean;
}): Promise<SymptomLog> {
  const res = await fetch(`${API_BASE}/api/users/${DEMO_USER_ID}/symptom-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create symptom log');
  const data = await res.json();
  return data.log as SymptomLog;
}

// ── Supplements ───────────────────────────────────────────────────────────────

export type SupplementSource = {
  store: string;
  price: string;
  url: string;
};

export type SupplementRecommendation = {
  candidateName: string;
  label: string;
  rationale: string;
  sources: SupplementSource[];
};

export async function getUserSupplements(): Promise<SupplementRecommendation[]> {
  const res = await fetch(`${API_BASE}/api/users/${DEMO_USER_ID}/supplements`);
  if (!res.ok) throw new Error('Failed to fetch supplements');
  const data = await res.json();
  return data.supplements as SupplementRecommendation[];
}
