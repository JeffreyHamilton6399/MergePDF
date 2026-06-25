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
          `${rejected} file${rejected > 1 ? "s" : ""} skipped — only PDF is supported.`
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
            "flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-emerald-500/50 hover:text-foreground",
            dragOver && "border-emerald-500 text-emerald-600"
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
        "group flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragOver
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-border hover:border-emerald-500/50 hover:bg-muted/40"
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-14 items-center justify-center rounded-xl border bg-background text-emerald-500 shadow-sm transition-transform group-hover:scale-105",
          dragOver && "scale-105"
        )}
      >
        <FileText className="size-7" strokeWidth={1.5} />
      </div>

      <h2 className="text-lg font-semibold tracking-tight">Drop PDFs to merge</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Merge, split, rotate, and rearrange — privately in your browser.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          No uploads
        </span>
        <span className="opacity-40">·</span>
        <span>No sign-up</span>
        <span className="opacity-40">·</span>
        <span>100% free</span>
      </div>

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
