import type { MatchResult } from "./dsr-parser";

export interface HistoryRecord {
  id: string;
  date: string;
  reportDate: string;
  dsrFiles: string[];
  masterFile: string;
  totalAccused: number;
  matchesFound: number;
  results: MatchResult[];
}

const HISTORY_KEY = "dsr-crosscheck-history";

export function getHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(record: HistoryRecord) {
  const history = getHistory();
  history.unshift(record);
  // Keep last 50 records
  if (history.length > 50) history.length = 50;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
