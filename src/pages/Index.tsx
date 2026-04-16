import { useState, useCallback } from "react";
import {
  FileText,
  Table2,
  Play,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import DropZone from "@/components/DropZone";
import ResultsTable from "@/components/ResultsTable";
import HistoryPanel from "@/components/HistoryPanel";
import { extractAccusedFromDocx, crossCheck } from "@/lib/dsr-parser";
import type { MatchResult } from "@/lib/dsr-parser";
import { parseMasterExcel, getMasterEntryCount } from "@/lib/xlsx-utils";
import { getHistory, saveToHistory } from "@/lib/history";
import { format } from "date-fns";

type Tab = "daily-check" | "history";

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("daily-check");
  const [dsrFiles, setDsrFiles] = useState<File[]>([]);
  const [masterFile, setMasterFile] = useState<File[]>([]);
  const [masterCount, setMasterCount] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState(getHistory);

  const handleMasterFile = useCallback(async (files: File[]) => {
    setMasterFile(files);
    if (files.length > 0) {
      try {
        const count = await getMasterEntryCount(files[0]);
        setMasterCount(count);
      } catch {
        setMasterCount(null);
      }
    } else {
      setMasterCount(null);
    }
  }, []);

  const handleClear = () => {
    setDsrFiles([]);
    setMasterFile([]);
    setMasterCount(null);
    setResults(null);
    setError(null);
  };

  const handleRun = async () => {
    if (dsrFiles.length === 0 || masterFile.length === 0) {
      setError("Please upload both DSR files and the master Excel file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Parse master list
      const masterList = await parseMasterExcel(masterFile[0]);

      // Extract accused from all DSR files
      const allAccused = [];
      for (const file of dsrFiles) {
        const accused = await extractAccusedFromDocx(file);
        allAccused.push(...accused);
      }

      if (allAccused.length === 0) {
        setError(
          "No accused names could be extracted from the DSR files. Please check the file format — look for patterns like 'Accused:', 'Name of Accused:', etc."
        );
        setLoading(false);
        return;
      }

      // Cross-check
      const matchResults = crossCheck(allAccused, masterList);
      setResults(matchResults);

      // Save to history
      const record = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        reportDate,
        dsrFiles: dsrFiles.map((f) => f.name),
        masterFile: masterFile[0].name,
        totalAccused: allAccused.length,
        matchesFound: matchResults.filter((r) => r.isRowdySheeter).length,
        results: matchResults,
      };
      saveToHistory(record);
      setHistory(getHistory());
    } catch (err) {
      setError(
        `Error processing files: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Tabs */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6">
          <button
            onClick={() => setActiveTab("daily-check")}
            className={`flex items-center gap-2 border-b-2 px-1 py-3.5 text-sm font-medium transition-colors ${
              activeTab === "daily-check"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            Daily Check
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 border-b-2 px-1 py-3.5 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-4 w-4" />
            History
          </button>

          {masterCount !== null && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {masterCount} RS entries loaded
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === "daily-check" ? (
          <>
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                Daily <span className="text-primary">Zone Check</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload zone situation reports and run cross-check against master
                list
              </p>
            </div>

            {/* Upload Sections */}
            <div className="mb-6 grid gap-6 lg:grid-cols-5">
              {/* DSR Files - larger */}
              <div className="lg:col-span-3">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Zone Situation Reports
                  </h2>
                </div>
                <DropZone
                  accept=".docx"
                  multiple
                  label="Drop zone .docx files here"
                  sublabel="Up to 7 daily zone reports"
                  formatHint="(.docx format only)"
                  files={dsrFiles}
                  onFiles={setDsrFiles}
                />
              </div>

              {/* Master File */}
              <div className="lg:col-span-2">
                <div className="mb-3 flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Master Rowdy Sheeter List
                  </h2>
                </div>
                <DropZone
                  accept=".xlsx,.xls"
                  label="Update Master Excel"
                  sublabel="Upload only when master list has new entries"
                  formatHint="(.xlsx)"
                  files={masterFile}
                  onFiles={handleMasterFile}
                />

                {masterCount !== null && (
                  <div className="mt-3 rounded-md bg-success-light p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Current Master File
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {masterCount} rowdy sheeters ·{" "}
                      <span className="font-normal text-muted-foreground">
                        {format(new Date(), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">
                  Report date:
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                />
              </div>

              <button
                onClick={handleRun}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Cross-Check
              </button>

              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>

            {/* Zone File Status */}
            <div className="mb-6 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Zone File Status
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {dsrFiles.length} files loaded
                </span>
              </div>
              {dsrFiles.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Upload zone files to see status…
                </p>
              )}
              {dsrFiles.length > 0 && (
                <div className="mt-3 space-y-1">
                  {dsrFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {f.name}
                      <span className="text-muted-foreground">
                        ({(f.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Results */}
            {results && (
              <ResultsTable results={results} reportDate={reportDate} />
            )}
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                Check <span className="text-primary">History</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                View and download previous cross-check results
              </p>
            </div>
            <HistoryPanel
              records={history}
              onRefresh={() => setHistory(getHistory())}
            />
          </>
        )}
      </main>
    </div>
  );
}
