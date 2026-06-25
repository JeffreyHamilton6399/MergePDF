"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { PageItem, SourceFile } from "@/lib/pdf-pages";
import { SortablePageThumbnail } from "./page-thumbnail";

interface PageGridProps {
  pages: PageItem[];
  sources: SourceFile[];
  selectedIds: string[];
  onReorder: (activeId: string, overId: string) => void;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PageGrid({
  pages,
  sources,
  selectedIds,
  onReorder,
  onToggleSelect,
  onRotate,
  onDelete,
}: PageGridProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Long-press (≈140ms) then move to drag; quick tap selects; a fast
      // swipe (>8px before the delay) falls through to native scroll.
      activationConstraint: { delay: 140, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sourceMap = React.useMemo(
    () => new Map(sources.map((s) => [s.id, s])),
    [sources]
  );

  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const activePage = activeId
    ? pages.find((p) => p.id === activeId) ?? null
    : null;

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 content-start gap-2.5 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {pages.map((page, index) => (
            <SortablePageThumbnail
              key={page.id}
              page={page}
              index={index}
              source={sourceMap.get(page.sourceId)}
              selected={selectedSet.has(page.id)}
              onToggleSelect={onToggleSelect}
              onRotate={onRotate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
        {activePage ? (
          <div className="h-40 w-32 rotate-2 opacity-90 sm:h-44">
            <SortablePageThumbnail
              page={activePage}
              index={pages.findIndex((p) => p.id === activePage.id)}
              source={sourceMap.get(activePage.sourceId)}
              selected={selectedSet.has(activePage.id)}
              onToggleSelect={() => {}}
              onRotate={() => {}}
              onDelete={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
