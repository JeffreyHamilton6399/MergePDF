"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Merge,
  Split,
  RotateCw,
  Trash2,
  Download,
  Layers,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export interface ToolbarProps {
  pageCount: number;
  selectedCount: number;
  busy: boolean;
  busyLabel: string | null;
  progress: number; // 0..100
  onAddFiles: () => void;
  onMerge: () => void;
  onSplit: () => void;
  onRotate: () => void;
  onDelete: () => void;
  onExtract: () => void;
  onClear: () => void;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "ghost",
  className,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "default";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn("h-8 gap-1.5 rounded-lg px-2.5 text-xs", className)}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function Toolbar({
  pageCount,
  selectedCount,
  busy,
  busyLabel,
  progress,
  onAddFiles,
  onMerge,
  onSplit,
  onRotate,
  onDelete,
  onExtract,
  onClear,
}: ToolbarProps) {
  const hasPages = pageCount > 0;
  const hasSelection = selectedCount > 0;

  return (
    <div className="shrink-0 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center gap-1.5 px-3 py-2 sm:px-4">
        {/* Status */}
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Layers className="size-3.5 text-emerald-500" />
            <span>{pageCount}</span>
            <span className="hidden text-muted-foreground sm:inline">
              {pageCount === 1 ? "page" : "pages"}
            </span>
          </span>
          {hasSelection && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-emerald-600 dark:text-emerald-400">
                {selectedCount} selected
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ActionButton
            icon={Plus}
            label="Add PDFs"
            onClick={onAddFiles}
            disabled={busy}
          />

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          <ActionButton
            icon={Split}
            label="Split"
            onClick={onSplit}
            disabled={busy || !hasPages}
          />
          <ActionButton
            icon={Download}
            label="Extract"
            onClick={onExtract}
            disabled={busy || !hasSelection}
          />
          <ActionButton
            icon={RotateCw}
            label="Rotate"
            onClick={onRotate}
            disabled={busy || !hasSelection}
          />
          <ActionButton
            icon={Trash2}
            label="Delete"
            onClick={onDelete}
            disabled={busy || !hasSelection}
          />

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          <ActionButton
            icon={FileText}
            label="Clear"
            onClick={onClear}
            disabled={busy || !hasPages}
            className="text-muted-foreground hover:text-destructive"
          />

          <Button
            type="button"
            size="sm"
            onClick={onMerge}
            disabled={busy || !hasPages}
            className="ml-1 h-8 gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <Merge className="size-3.5" />
            <span>Merge All</span>
          </Button>
        </div>
      </div>

      {busy && (
        <div className="flex items-center gap-2 px-3 pb-2 sm:px-4">
          <Progress value={progress} className="h-1 flex-1" />
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {busyLabel}
          </span>
        </div>
      )}
    </div>
  );
}
