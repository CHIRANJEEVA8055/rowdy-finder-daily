import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

interface DropZoneProps {
  accept: string;
  multiple?: boolean;
  label: string;
  sublabel: string;
  formatHint: string;
  files: File[];
  onFiles: (files: File[]) => void;
}

export default function DropZone({
  accept,
  multiple = false,
  label,
  sublabel,
  formatHint,
  files,
  onFiles,
}: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      onFiles(multiple ? [...files, ...dropped] : dropped.slice(0, 1));
    },
    [files, multiple, onFiles]
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    onFiles(multiple ? [...files, ...selected] : selected.slice(0, 1));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
        dragging
          ? "border-primary bg-primary/5"
          : "border-dropzone-border bg-dropzone"
      }`}
    >
      <Upload className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
      <p className="text-xs text-muted-foreground">{formatHint}</p>

      <label className="mt-1 cursor-pointer text-sm font-medium text-primary hover:underline">
        Browse files
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleInput}
        />
      </label>

      {files.length > 0 && (
        <div className="mt-3 w-full space-y-1">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md bg-card px-3 py-1.5 text-xs"
            >
              <span className="truncate text-foreground">{f.name}</span>
              <button
                onClick={() => onFiles(files.filter((_, j) => j !== i))}
                className="ml-2 text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
