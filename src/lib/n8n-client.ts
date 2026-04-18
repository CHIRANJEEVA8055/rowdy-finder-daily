import type { MatchResult } from "./dsr-parser";

const WEBHOOK_KEY = "dsr-n8n-webhook-url";
const DEFAULT_URL = "http://localhost:5678/webhook/ui-processor";

export function getWebhookUrl(): string {
  return localStorage.getItem(WEBHOOK_KEY) || DEFAULT_URL;
}

export function setWebhookUrl(url: string) {
  localStorage.setItem(WEBHOOK_KEY, url);
}

export interface N8nResponse {
  matches?: Array<Record<string, unknown>>;
  results?: Array<Record<string, unknown>>;
  // Or it may return a bare array
}

/**
 * Sends DSR files + master excel to the n8n webhook.
 * Expects a JSON response containing matches, or empty/no body for "no matches".
 */
export async function sendToN8n(
  dsrFiles: File[],
  masterFile: File,
  reportDate: string
): Promise<MatchResult[]> {
  const url = getWebhookUrl();
  if (!url) throw new Error("n8n webhook URL is not configured.");

  const formData = new FormData();
  formData.append("reportDate", reportDate);
  formData.append("masterFile", masterFile, masterFile.name);
  for (const f of dsrFiles) {
    formData.append("dsrFiles", f, f.name);
  }

  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: formData });
  } catch (err) {
    throw new Error(
      `Could not reach n8n at ${url}. If this is a localhost URL, the deployed app cannot reach it — run the app locally or expose n8n via a public HTTPS URL (ngrok, Cloudflare Tunnel, etc.). (${
        err instanceof Error ? err.message : "network error"
      })`
    );
  }

  if (!response.ok) {
    throw new Error(`n8n webhook returned ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text.trim()) return []; // No matches

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("n8n response was not valid JSON.");
  }

  return normalizeMatches(data);
}

function normalizeMatches(data: unknown): MatchResult[] {
  let arr: Array<Record<string, unknown>> = [];

  if (Array.isArray(data)) {
    arr = data as Array<Record<string, unknown>>;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.matches)) arr = obj.matches as Array<Record<string, unknown>>;
    else if (Array.isArray(obj.results)) arr = obj.results as Array<Record<string, unknown>>;
    else if (Array.isArray(obj.data)) arr = obj.data as Array<Record<string, unknown>>;
  }

  return arr.map((row) => {
    const accusedName =
      (row.accusedName as string) ||
      (row.accused_name as string) ||
      (row.name as string) ||
      (row.accused as string) ||
      "Unknown";
    const matchedName =
      (row.matchedName as string) ||
      (row.matched_name as string) ||
      (row.rowdySheeterName as string) ||
      accusedName;
    return {
      accusedName,
      zone: (row.zone as string) || (row.zoneName as string) || "—",
      fileName: (row.fileName as string) || (row.source as string) || "—",
      matchedName,
      isRowdySheeter: true,
      masterData: row,
    };
  });
}
