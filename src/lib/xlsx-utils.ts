import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { MasterEntry, MatchResult } from "./dsr-parser";

export function parseMasterExcel(file: File): Promise<MasterEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

        // Find the "name" column (case-insensitive)
        const entries: MasterEntry[] = json.map((row) => {
          const nameKey = Object.keys(row).find(
            (k) =>
              k.toLowerCase().includes("name") &&
              !k.toLowerCase().includes("father") &&
              !k.toLowerCase().includes("alias")
          );
          return {
            ...row,
            name: nameKey ? String(row[nameKey]) : "",
          } as MasterEntry;
        });

        resolve(entries.filter((e) => e.name.length > 0));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function exportResultsToXlsx(
  results: MatchResult[],
  reportDate: string
) {
  const exportData = results.map((r, i) => ({
    "S.No": i + 1,
    "Accused Name": r.accusedName,
    Zone: r.zone,
    "Source File": r.fileName,
    "Rowdy Sheeter": r.isRowdySheeter ? "YES" : "NO",
    "Matched Name": r.matchedName || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cross-Check Results");

  // Auto-width columns
  const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...exportData.map((r) => String((r as Record<string, unknown>)[key] || "").length)
    ) + 2,
  }));
  ws["!cols"] = colWidths;

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `cross-check-results-${reportDate}.xlsx`);
}

export function getMasterEntryCount(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet);
        resolve(json.length);
      } catch {
        reject(new Error("Failed to read Excel file"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
