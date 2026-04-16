import type { HistoryRecord } from "@/lib/history";
import { exportResultsToXlsx } from "@/lib/xlsx-utils";
import { format } from "date-fns";
import { Calendar, Download, Trash2 } from "lucide-react";
import { clearHistory } from "@/lib/history";

interface HistoryPanelProps {
  records: HistoryRecord[];
  onRefresh: () => void;
}

export default function HistoryPanel({ records, onRefresh }: HistoryPanelProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No history yet. Run a cross-check to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{records.length} previous checks</p>
        <button
          onClick={() => {
            clearHistory();
            onRefresh();
          }}
          className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
        >
          <Trash2 className="h-3 w-3" />
          Clear History
        </button>
      </div>

      {records.map((rec) => (
        <div
          key={rec.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Report Date: {rec.reportDate}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Checked on {format(new Date(rec.date), "dd MMM yyyy, hh:mm a")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {rec.dsrFiles.length} DSR file{rec.dsrFiles.length > 1 ? "s" : ""} ·{" "}
                {rec.totalAccused} accused · {rec.matchesFound} match
                {rec.matchesFound !== 1 ? "es" : ""}
              </p>
            </div>
            <button
              onClick={() => exportResultsToXlsx(rec.results, rec.reportDate)}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <Download className="h-3 w-3" />
              .xlsx
            </button>
          </div>

          {rec.results.filter((r) => r.isRowdySheeter).length > 0 && (
            <div className="mt-2 rounded-md bg-destructive/5 p-2">
              <p className="text-xs font-medium text-destructive">
                Matches: {rec.results.filter((r) => r.isRowdySheeter).map((r) => r.accusedName).join(", ")}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
