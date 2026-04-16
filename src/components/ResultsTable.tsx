import type { MatchResult } from "@/lib/dsr-parser";
import { exportResultsToXlsx } from "@/lib/xlsx-utils";
import { CheckCircle2, XCircle, Download } from "lucide-react";

interface ResultsTableProps {
  results: MatchResult[];
  reportDate: string;
}

export default function ResultsTable({ results, reportDate }: ResultsTableProps) {
  const matches = results.filter((r) => r.isRowdySheeter);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Cross-Check Results
          </h3>
          <p className="text-xs text-muted-foreground">
            {results.length} accused checked · {matches.length} match
            {matches.length !== 1 ? "es" : ""} found
          </p>
        </div>
        <button
          onClick={() => exportResultsToXlsx(results, reportDate)}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <Download className="h-3.5 w-3.5" />
          Download .xlsx
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                S.No
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Accused Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Zone / File
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Matched Name
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-border/50 ${
                  r.isRowdySheeter ? "bg-destructive/5" : ""
                }`}
              >
                <td className="px-3 py-2 text-foreground">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-foreground">
                  {r.accusedName}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{r.zone}</td>
                <td className="px-3 py-2">
                  {r.isRowdySheeter ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      <XCircle className="h-3 w-3" />
                      Rowdy Sheeter
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-xs font-medium text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      No Match
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {r.matchedName || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
