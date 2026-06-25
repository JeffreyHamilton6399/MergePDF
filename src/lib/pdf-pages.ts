import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";

export type PageStatus = "pending" | "rendering" | "ready" | "error";

export interface SourceFile {
  id: string;
  name: string;
  /** Original File reference kept in memory for re-reading during merge/split */
  file: File;
  /** Tailwind text color class used for the source badge / border accent */
  color: string;
  pageCount: number;
}

export interface PageItem {
  id: string;
  sourceId: string;
  /** 1-indexed page number within the source PDF */
  pageNumber: number;
  rotation: 0 | 90 | 180 | 270;
  width: number;
  height: number;
  thumbnail: string | null;
  status: PageStatus;
}

/**
 * Color palette used to color-code pages by source file.
 * Deliberately avoids indigo/blue as a primary — emerald stays reserved for
 * the "selected" + "merge" accent.
 */
export const SOURCE_COLORS = [
  "text-emerald-500",
  "text-rose-500",
  "text-amber-500",
  "text-teal-500",
  "text-fuchsia-500",
  "text-orange-500",
  "text-lime-500",
  "text-pink-500",
  "text-cyan-500",
  "text-violet-500",
];

export function colorForIndex(i: number): string {
  return SOURCE_COLORS[i % SOURCE_COLORS.length];
}

export function nextColor(existing: SourceFile[]): string {
  return colorForIndex(existing.length);
}

let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

interface PdfState {
  files: SourceFile[];
  pages: PageItem[];
  selectedIds: string[];
  lastSelectedId: string | null;

  addSource: (file: SourceFile, pages: PageItem[]) => void;
  setThumbnail: (pageId: string, thumbnail: string, w: number, h: number) => void;
  setPageStatus: (pageId: string, status: PageStatus) => void;
  reorder: (activeId: string, overId: string) => void;
  rotateSelected: () => void;
  rotateByIds: (ids: string[]) => void;
  deleteSelected: () => void;
  deleteByIds: (ids: string[]) => void;
  removeFile: (fileId: string) => void;
  toggleSelect: (id: string) => void;
  selectRange: (id: string) => void;
  selectOnly: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  clearAll: () => void;
  setSelected: (ids: string[]) => void;
}

export const usePdfStore = create<PdfState>((set, get) => ({
  files: [],
  pages: [],
  selectedIds: [],
  lastSelectedId: null,

  addSource: (file, pages) =>
    set((state) => ({
      files: [...state.files, file],
      pages: [...state.pages, ...pages],
    })),

  setThumbnail: (pageId, thumbnail, w, h) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, thumbnail, width: w, height: h, status: "ready" as PageStatus }
          : p
      ),
    })),

  setPageStatus: (pageId, status) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, status } : p)),
    })),

  reorder: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.pages.findIndex((p) => p.id === activeId);
      const newIndex = state.pages.findIndex((p) => p.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      return { pages: arrayMove(state.pages, oldIndex, newIndex) };
    }),

  rotateSelected: () => get().rotateByIds(get().selectedIds),

  rotateByIds: (ids) =>
    set((state) => {
      if (ids.length === 0) return state;
      const targets = new Set(ids);
      return {
        pages: state.pages.map((p) =>
          targets.has(p.id)
            ? { ...p, rotation: (((p.rotation + 90) % 360) as 0 | 90 | 180 | 270) }
            : p
        ),
      };
    }),

  deleteSelected: () => get().deleteByIds(get().selectedIds),

  deleteByIds: (ids) =>
    set((state) => {
      if (ids.length === 0) return state;
      const toDelete = new Set(ids);
      const remaining = state.pages.filter((p) => !toDelete.has(p.id));
      // Drop source files that no longer have any pages
      const usedSources = new Set(remaining.map((p) => p.sourceId));
      return {
        pages: remaining,
        files: state.files.filter((f) => usedSources.has(f.id)),
        selectedIds: state.selectedIds.filter((id) => !toDelete.has(id)),
        lastSelectedId:
          state.lastSelectedId && toDelete.has(state.lastSelectedId)
            ? null
            : state.lastSelectedId,
      };
    }),

  removeFile: (fileId) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== fileId),
      pages: state.pages.filter((p) => p.sourceId !== fileId),
      selectedIds: state.selectedIds.filter(
        (id) => !state.pages.some((p) => p.id === id && p.sourceId === fileId)
      ),
    })),

  toggleSelect: (id) =>
    set((state) => {
      const isSelected = state.selectedIds.includes(id);
      const next = isSelected
        ? state.selectedIds.filter((s) => s !== id)
        : [...state.selectedIds, id];
      return { selectedIds: next, lastSelectedId: id };
    }),

  selectRange: (id) =>
    set((state) => {
      const anchor = state.lastSelectedId ?? state.pages[0]?.id;
      if (!anchor) return { selectedIds: [id], lastSelectedId: id };
      const ids = state.pages.map((p) => p.id);
      const a = ids.indexOf(anchor);
      const b = ids.indexOf(id);
      if (a === -1 || b === -1) return { selectedIds: [id], lastSelectedId: id };
      const [start, end] = a <= b ? [a, b] : [b, a];
      const range = ids.slice(start, end + 1);
      return { selectedIds: range, lastSelectedId: id };
    }),

  selectOnly: (id) => set({ selectedIds: [id], lastSelectedId: id }),

  clearSelection: () => set({ selectedIds: [], lastSelectedId: null }),

  selectAll: () =>
    set((state) => ({ selectedIds: state.pages.map((p) => p.id), lastSelectedId: null })),

  clearAll: () =>
    set({ files: [], pages: [], selectedIds: [], lastSelectedId: null }),

  setSelected: (ids) => set({ selectedIds: ids }),
}));
