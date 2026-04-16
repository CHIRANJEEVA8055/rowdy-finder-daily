import mammoth from "mammoth";

export interface AccusedEntry {
  name: string;
  zone: string;
  fileName: string;
  rawText?: string;
}

/**
 * Extracts accused names from a DSR .docx file.
 * Looks for patterns like "Accused:", "Name of Accused:", "Accused Name:" etc.
 */
export async function extractAccusedFromDocx(
  file: File
): Promise<AccusedEntry[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;

  const accused: AccusedEntry[] = [];

  // Try multiple patterns to find accused names
  const patterns = [
    /(?:accused|name\s+of\s+accused|accused\s+name|accused\s*persons?)\s*[:\-–]\s*(.+)/gi,
    /(?:suspect|offender|perpetrator)\s*[:\-–]\s*(.+)/gi,
    /(?:arrested|apprehended|detained)\s*[:\-–]\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const rawNames = match[1].trim();
      // Split by common delimiters (comma, "and", ampersand, semicolon)
      const names = rawNames
        .split(/[,;&]|\band\b/i)
        .map((n) => n.trim())
        .filter((n) => n.length > 2 && n.length < 100);

      for (const name of names) {
        // Clean up: remove trailing periods, numbers, parenthetical info
        const cleanName = name
          .replace(/\s*\(.*?\)\s*/g, " ")
          .replace(/[.\d]+$/, "")
          .replace(/\s+/g, " ")
          .trim();

        if (cleanName.length > 2) {
          accused.push({
            name: cleanName,
            zone: extractZoneFromFilename(file.name) || "Unknown",
            fileName: file.name,
          });
        }
      }
    }
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return accused.filter((a) => {
    const key = a.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractZoneFromFilename(filename: string): string {
  // Try to extract zone name from filename
  const match = filename.match(/(?:zone|z)\s*[-_]?\s*(\w+)/i);
  return match ? `Zone ${match[1]}` : filename.replace(/\.docx$/i, "");
}

export interface MasterEntry {
  name: string;
  [key: string]: unknown;
}

export interface MatchResult {
  accusedName: string;
  zone: string;
  fileName: string;
  matchedName: string | null;
  isRowdySheeter: boolean;
  masterData: Record<string, unknown>;
}

/**
 * Fuzzy match: checks if names are similar enough
 */
function namesMatch(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();

  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  // Check individual words overlap
  const wordsA = na.split(" ");
  const wordsB = nb.split(" ");
  const common = wordsA.filter((w) => wordsB.includes(w));
  if (common.length >= 2) return true;
  if (wordsA.length === 1 && wordsB.length === 1) return false;
  if (common.length >= Math.min(wordsA.length, wordsB.length) * 0.6) return true;

  return false;
}

export function crossCheck(
  accused: AccusedEntry[],
  masterList: MasterEntry[]
): MatchResult[] {
  return accused.map((a) => {
    const match = masterList.find((m) => namesMatch(a.name, m.name));
    return {
      accusedName: a.name,
      zone: a.zone,
      fileName: a.fileName,
      matchedName: match?.name || null,
      isRowdySheeter: !!match,
      masterData: match ? { ...match } : {},
    };
  });
}
