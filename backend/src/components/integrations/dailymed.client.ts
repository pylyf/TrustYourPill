import { XMLParser } from "fast-xml-parser";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import type { TraceContext } from "../utils/trace.js";

const DAILYMED_BASE_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v2";
const DAILYMED_TIMEOUT_MS = 10000;

type DailyMedSplSummary = {
  spl_version: number;
  published_date: string;
  title: string;
  setid: string;
};

type DailyMedSplsResponse = {
  data?: DailyMedSplSummary[];
};

export type DailyMedDrugLabel = {
  setId: string;
  splId: string | null;
  title: string | null;
  effectiveTime: string | null;
  manufacturerName: string | null;
  route: string | null;
  productType: string | null;
  brandNames: string[];
  genericNames: string[];
  sections: Array<{
    code: string | null;
    displayName: string | null;
    title: string | null;
    text: string;
  }>;
};

export class DailyMedClient {
  private readonly logger = createLogger("dailymed-client");
  private readonly xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
    parseTagValue: false
  });

  async getDrugLabelByRxcui(rxcui: string, traceContext?: TraceContext): Promise<DailyMedDrugLabel | null> {
    const spls = await this.getSplsByRxcui(rxcui, traceContext);
    const newestSpl = spls[0];

    if (!newestSpl) {
      this.logger.info("No DailyMed SPLs found for RxCUI", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        rxcui
      });

      return null;
    }

    return this.getSplDocumentBySetId(newestSpl.setid, traceContext);
  }

  async getSplsByRxcui(rxcui: string, traceContext?: TraceContext) {
    const url = `${DAILYMED_BASE_URL}/spls.json?rxcui=${encodeURIComponent(rxcui)}`;
    const startedAt = Date.now();

    const data = await withRetry(
      async () => {
        const response = await fetchWithTimeout(url, "application/json");

        if (response.status === 404) {
          return [] as DailyMedSplSummary[];
        }

        if (!response.ok) {
          throw new Error(`DailyMed SPL list request failed with status ${response.status}`);
        }

        const body = (await response.json()) as DailyMedSplsResponse;
        return body.data ?? [];
      },
      {
        retries: 2,
        delayMs: 250,
        onRetry: (attempt, error) => {
          this.logger.warn("Retrying DailyMed SPL list request", {
            requestId: traceContext?.requestId,
            traceId: traceContext?.traceId,
            rxcui,
            attempt,
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    );

    this.logger.info("DailyMed SPL list request completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      rxcui,
      candidateCount: data.length,
      durationMs: Date.now() - startedAt
    });

    return data;
  }

  async getSplDocumentBySetId(setId: string, traceContext?: TraceContext): Promise<DailyMedDrugLabel | null> {
    const url = `${DAILYMED_BASE_URL}/spls/${encodeURIComponent(setId)}.xml`;
    const startedAt = Date.now();

    const parsed = await withRetry(
      async () => {
        const response = await fetchWithTimeout(url);

        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`DailyMed SPL document request failed with status ${response.status}`);
        }

        const xml = await response.text();
        return this.parseSplXml(xml);
      },
      {
        retries: 2,
        delayMs: 250,
        onRetry: (attempt, error) => {
          this.logger.warn("Retrying DailyMed SPL document request", {
            requestId: traceContext?.requestId,
            traceId: traceContext?.traceId,
            setId,
            attempt,
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    );

    this.logger.info("DailyMed SPL document request completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      setId,
      sectionCount: parsed?.sections.length ?? 0,
      durationMs: Date.now() - startedAt
    });

    return parsed;
  }

  private parseSplXml(xml: string): DailyMedDrugLabel {
    const parsed = this.xmlParser.parse(xml) as Record<string, unknown>;
    const documentNode = asObject(parsed.document);
    const authorName = extractText(documentNode?.author?.assignedEntity?.representedOrganization?.name);
    const title = extractText(documentNode?.title);
    const effectiveTime = asObject(documentNode?.effectiveTime)?.["@_value"];
    const splId = asObject(documentNode?.id)?.["@_root"] ?? null;
    const setId = asObject(documentNode?.setId)?.["@_root"] ?? null;
    const productSection = findProductSection(documentNode);
    const manufacturedProduct = asObject(productSection?.subject?.manufacturedProduct?.manufacturedProduct);
    const brandName = extractText(manufacturedProduct?.name);
    const genericName = extractText(manufacturedProduct?.asEntityWithGeneric?.genericMedicine?.name);
    const route = asObject(
      productSection?.subject?.manufacturedProduct?.consumedIn?.substanceAdministration?.routeCode
    )?.["@_displayName"] ?? null;
    const productType = asObject(documentNode?.code)?.["@_displayName"] ?? null;

    return {
      setId: setId ?? "",
      splId,
      title,
      effectiveTime: typeof effectiveTime === "string" ? effectiveTime : null,
      manufacturerName: authorName,
      route: typeof route === "string" ? route : null,
      productType: typeof productType === "string" ? productType : null,
      brandNames: brandName ? [brandName] : [],
      genericNames: genericName ? [genericName] : [],
      sections: findAllSections(documentNode)
        .map((section) => ({
          code: asObject(section.code)?.["@_code"] ?? null,
          displayName: asObject(section.code)?.["@_displayName"] ?? null,
          title: extractText(section.title),
          text: extractText(section.text) ?? ""
        }))
        .filter((section) => section.text.length > 0)
    };
  }
}

async function fetchWithTimeout(url: string, accept?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DAILYMED_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      headers: accept
        ? {
            Accept: accept
          }
        : undefined,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function asObject(value: unknown): Record<string, any> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  return null;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function findProductSection(documentNode: Record<string, any> | null) {
  return findAllSections(documentNode).find((section) => asObject(section.code)?.["@_code"] === "48780-1") ?? null;
}

function findAllSections(documentNode: Record<string, any> | null): Array<Record<string, any>> {
  const sections: Array<Record<string, any>> = [];

  traverseSections(documentNode, sections);

  return sections;
}

function traverseSections(node: unknown, sections: Array<Record<string, any>>) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      traverseSections(item, sections);
    }

    return;
  }

  const objectNode = node as Record<string, unknown>;

  if (objectNode.section) {
    for (const section of asArray(objectNode.section)) {
      const sectionObject = asObject(section);

      if (sectionObject) {
        sections.push(sectionObject);
      }
    }
  }

  for (const value of Object.values(objectNode)) {
    traverseSections(value, sections);
  }
}

function extractText(node: unknown): string | null {
  if (node == null) {
    return null;
  }

  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    const text = String(node).replace(/\s+/g, " ").trim();
    return text.length > 0 ? text : null;
  }

  if (Array.isArray(node)) {
    const text = node
      .map((item) => extractText(item))
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return text.length > 0 ? text : null;
  }

  const objectNode = node as Record<string, unknown>;
  const values = Object.entries(objectNode)
    .filter(([key]) => !key.startsWith("@_"))
    .map(([, value]) => extractText(value))
    .filter((value): value is string => Boolean(value));

  const text = values.join(" ").replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}
