const API_BASE = 'http://127.0.0.1:3001';

export const DEMO_USER_ID = 'demo-user-001';

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
