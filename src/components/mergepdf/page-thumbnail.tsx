"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RotateCw, Trash2, AlertTriangle, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageItem, SourceFile } from "@/lib/pdf-pages";

interface SortablePageThumbnailProps {
  page: PageItem;
  index: number;
  source: SourceFile | undefined;
  selected: boolean;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

export function SortablePageThumbnail({
  page,
  index,
  source,
  selected,
  onToggleSelect,
  onRotate,
  onDelete,
  isDragging,
}: SortablePageThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isSortableDragging || isDragging;

  // A tap on the card (not a drag) toggles selection. dnd-kit's pointer sensor
  // delay lets the click through when no drag is initiated.
  const handleClick = (e: React.MouseEvent) => {
    if (dragging) return;
    onToggleSelect(page.id, e.shiftKey);
  };

  // Action buttons must not start a drag — block pointer-down from reaching
  // the card-level drag listeners.
  const block = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "group relative flex h-40 cursor-grab select-none flex-col overflow-hidden rounded-md border bg-card shadow-sm transition-[box-shadow,transform] active:cursor-grabbing sm:h-44",
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/60"
          : "border-border hover:border-emerald-500/40",
        dragging && "z-10 opacity-50 shadow-xl ring-2 ring-emerald-500/40"
      )}
    >
      {/* Source color accent — thin left edge */}
      <span
        className={cn(
          "absolute left-0 top-0 z-10 h-full w-0.5",
          source ? source.color.replace("text-", "bg-") : "bg-muted-foreground/30"
        )}
        aria-hidden
      />

      {/* Thumbnail canvas */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/25 p-2 pl-2.5">
        {page.status === "error" ? (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <AlertTriangle className="size-5 text-amber-500" />
            <span className="text-[10px]">Render failed</span>
          </div>
        ) : page.thumbnail ? (
          <img
            src={page.thumbnail}
            alt={`Page ${page.pageNumber}`}
            className="max-h-full max-w-full rounded-[2px] object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex aspect-[1/1.3] w-full max-w-[68%] flex-col gap-1.5">
            <div className="flex-1 animate-pulse rounded-sm bg-muted" />
          </div>
        )}

        {/* Page number badge */}
        <span className="absolute left-1.5 top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-black/75 px-1 text-[10px] font-medium tabular-nums text-white backdrop-blur-sm">
          {index + 1}
        </span>

        {/* Drag hint — subtle, appears on hover to signal draggability */}
        <span
          className="pointer-events-none absolute bottom-1.5 right-1.5 text-foreground/20 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        >
          <GripVertical className="size-3.5" />
        </span>

        {/* Hover / selection actions */}
        <div
          className={cn(
            "absolute right-1.5 top-1.5 flex gap-1 transition-opacity",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <button
            type="button"
            aria-label="Rotate page 90° clockwise"
            onPointerDown={block}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRotate(page.id);
            }}
            className="flex size-6 items-center justify-center rounded bg-black/65 text-white backdrop-blur-sm transition-colors hover:bg-emerald-600"
          >
            <RotateCw className="size-3" />
          </button>
          <button
            type="button"
            aria-label="Delete page"
            onPointerDown={block}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(page.id);
            }}
            className="flex size-6 items-center justify-center rounded bg-black/65 text-white backdrop-blur-sm transition-colors hover:bg-rose-600"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      {/* Source label */}
      <div className="flex items-center gap-1.5 truncate border-t bg-background/60 px-2 py-1 pl-2.5">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            source ? source.color.replace("text-", "bg-") : "bg-muted-foreground/40"
          )}
        />
        <span
          className="truncate text-[10px] leading-none text-muted-foreground"
          title={source?.name}
        >
          {source?.name ?? "Unknown"}
          <span className="ml-1 opacity-50">· {page.pageNumber}</span>
        </span>
      </div>
    </div>
  );
}
