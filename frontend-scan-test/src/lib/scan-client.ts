import type { MedicationScanResponse } from "../types/scan";

type ScanMedicationImageInput = {
  apiBaseUrl: string;
  imageBase64DataUrl: string;
  hint?: string;
};

type ApiErrorPayload = {
  error?: string;
};

export async function scanMedicationImage({
  apiBaseUrl,
  imageBase64DataUrl,
  hint
}: ScanMedicationImageInput): Promise<MedicationScanResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${trimTrailingSlash(apiBaseUrl)}/api/medications/scan`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imageBase64DataUrl,
        hint: hint?.trim() ? hint.trim() : undefined
      })
    });

    const payload = (await response.json().catch(() => null)) as MedicationScanResponse | ApiErrorPayload | null;

    if (!response.ok) {
      const apiMessage =
        payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : `HTTP ${response.status}`;

      throw new Error(`Scan request failed: ${apiMessage}`);
    }

    return payload as MedicationScanResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The scan request timed out before the backend replied.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("The scan request failed.");
  } finally {
    clearTimeout(timeout);
  }
}

function trimTrailingSlash(value: string) {
  return value.trim().replace(/\/+$/, "");
}
