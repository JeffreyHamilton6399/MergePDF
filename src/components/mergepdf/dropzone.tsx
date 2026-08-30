"use client";

import * as React from "react";
import { FileText, Upload, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isLikelyPdf } from "@/lib/pdf-ops";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  /** When true the dropzone is rendered as an overlay-ish tile inside the editor (e.g. "Add PDFs") */
  compact?: boolean;
}

export function Dropzone({ onFiles, compact = false }: DropzoneProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = React.useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const all = Array.from(fileList);
      const pdfs = all.filter(isLikelyPdf);
      const rejected = all.length - pdfs.length;
      if (rejected > 0) {
        toast.error(
          `${rejected} file${rejected > 1 ? "s" : ""} skipped, only PDF is supported.`
        );
      }
      if (pdfs.length > 0) onFiles(pdfs);
    },
    [onFiles]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-stone-500/50 hover:text-foreground",
            dragOver && "border-stone-500 text-stone-600"
          )}
        >
          <Upload className="size-3.5" />
          Drop PDFs here or click to add
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={onKeyDown}
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      className={cn(
        "group mx-auto flex min-h-[300px] w-full max-w-md cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragOver
          ? "border-stone-500 bg-stone-500/5"
          : "border-border hover:border-stone-500/50 hover:bg-muted/40"
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full border bg-background text-stone-500 shadow-sm transition-transform group-hover:scale-105",
          dragOver && "scale-105"
        )}
      >
        <FileText className="size-6" strokeWidth={1.5} />
      </div>

      <h2 className="text-base font-semibold tracking-tight">Drop PDFs</h2>
      <p className="max-w-[34ch] text-sm text-muted-foreground">
        Merge, split, rotate and reorder pages.
      </p>
      <p className="text-xs text-muted-foreground/70">or click to browse</p>

      <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="size-3.5 text-stone-500" />
        Everything happens in this tab.
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
