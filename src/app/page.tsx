"use client";

import * as React from "react";
import { toast } from "sonner";
import { Header } from "@/components/mergepdf/header";
import { Footer } from "@/components/mergepdf/footer";
import { Dropzone } from "@/components/mergepdf/dropzone";
import { Toolbar } from "@/components/mergepdf/toolbar";
import { PageGrid } from "@/components/mergepdf/page-grid";
import {
  usePdfStore,
  makeId,
  nextColor,
  type SourceFile,
  type PageItem,
} from "@/lib/pdf-pages";
import {
  getPdfPageCount,
  renderThumbnail,
  mergeToPdf,
  splitToZip,
  extractToPdf,
  pageLimit,
  isLikelyPdf,
} from "@/lib/pdf-ops";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShieldCheck, UploadCloud } from "lucide-react";

export default function Home() {
  const pages = usePdfStore((s) => s.pages);
  const files = usePdfStore((s) => s.files);
  const selectedIds = usePdfStore((s) => s.selectedIds);

  const addSource = usePdfStore((s) => s.addSource);
  const setThumbnail = usePdfStore((s) => s.setThumbnail);
  const setPageStatus = usePdfStore((s) => s.setPageStatus);
  const reorder = usePdfStore((s) => s.reorder);
  const rotateByIds = usePdfStore((s) => s.rotateByIds);
  const deleteByIds = usePdfStore((s) => s.deleteByIds);
  const toggleSelect = usePdfStore((s) => s.toggleSelect);
  const selectRange = usePdfStore((s) => s.selectRange);
  const clearSelection = usePdfStore((s) => s.clearSelection);
  const clearAll = usePdfStore((s) => s.clearAll);

  const [busy, setBusy] = React.useState(false);
  const [busyLabel, setBusyLabel] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);

  const [dragOverEditor, setDragOverEditor] = React.useState(false);
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const renderedRotations = React.useRef<Map<string, number>>(new Map());
  const renderingRef = React.useRef(false);

  const isMobile = useIsMobile();

  /* ---------------------------------------------------------------------- */
  /*  File ingestion                                                        */
  /* ---------------------------------------------------------------------- */

  const handleFiles = React.useCallback(
    async (incoming: File[]) => {
      const pdfs = incoming.filter(isLikelyPdf);
      if (pdfs.length === 0) return;

      const limit = pageLimit(isMobile);
      const currentCount = usePdfStore.getState().pages.length;
      const remaining = Math.max(0, limit - currentCount);

      setBusy(true);
      setBusyLabel("Reading PDFs…");
      setProgress(0);

      let processed = 0;
      let addedPages = 0;
      for (const file of pdfs) {
        if (addedPages >= remaining) {
          toast.warning(
            `Page limit reached (${limit}). Some files were not added.`
          );
          break;
        }
        try {
          const pageCount = await getPdfPageCount(file);
          if (pageCount === 0) {
            toast.error(`"${file.name}" has no pages.`);
            continue;
          }
          const take = Math.min(pageCount, remaining - addedPages);
          const fileId = makeId("file");
          const color = nextColor(usePdfStore.getState().files);
          const source: SourceFile = {
            id: fileId,
            name: file.name,
            file,
            color,
            pageCount,
          };
          const newPages: PageItem[] = Array.from({ length: take }, (_, i) => ({
            id: makeId("page"),
            sourceId: fileId,
            pageNumber: i + 1,
            rotation: 0,
            width: 0,
            height: 0,
            thumbnail: null,
            status: "pending" as const,
          }));
          addSource(source, newPages);
          addedPages += take;
          if (take < pageCount) {
            toast.warning(
              `Only added ${take} of ${pageCount} pages from "${file.name}" (limit).`
            );
          }
        } catch (err) {
          console.error(err);
          toast.error(
            `Could not read "${file.name}". It may be corrupt or password-protected.`
          );
        }
        processed += 1;
        setProgress(Math.round((processed / pdfs.length) * 100));
      }

      setBusy(false);
      setBusyLabel(null);
      setProgress(0);
    },
    [addSource, isMobile]
  );

  /* ---------------------------------------------------------------------- */
  /*  Thumbnail render queue (sequential, re-renders on rotation change)    */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    if (renderingRef.current) return;
    const state = usePdfStore.getState();
    const sourceMap = new Map(state.files.map((f) => [f.id, f]));
    const next = state.pages.find((p) => {
      if (p.status === "error") return false;
      const lastRot = renderedRotations.current.get(p.id);
      return !p.thumbnail || lastRot !== p.rotation;
    });
    if (!next) return;
    const source = sourceMap.get(next.sourceId);
    if (!source) return;

    renderingRef.current = true;
    (async () => {
      try {
        const scale = isMobile ? 0.22 : 0.3;
        const thumb = await renderThumbnail(
          source.file,
          next.pageNumber,
          scale,
          next.rotation
        );
        renderedRotations.current.set(next.id, next.rotation);
        setThumbnail(next.id, thumb.dataUrl, thumb.width, thumb.height);
      } catch (err) {
        console.error("thumbnail render failed", err);
        setPageStatus(next.id, "error");
        renderedRotations.current.set(next.id, next.rotation);
      } finally {
        renderingRef.current = false;
      }
    })();
  }, [pages, isMobile, setThumbnail, setPageStatus]);

  /* ---------------------------------------------------------------------- */
  /*  Selection                                                             */
  /* ---------------------------------------------------------------------- */

  const handleToggleSelect = React.useCallback(
    (id: string, shiftKey: boolean) => {
      if (shiftKey) {
        selectRange(id);
      } else {
        toggleSelect(id);
      }
    },
    [selectRange, toggleSelect]
  );

  /* ---------------------------------------------------------------------- */
  /*  Single-page actions (from thumbnail hover buttons)                    */
  /* ---------------------------------------------------------------------- */

  const handleRotateOne = React.useCallback(
    (id: string) => {
      rotateByIds([id]);
    },
    [rotateByIds]
  );

  const handleDeleteOne = React.useCallback(
    (id: string) => {
      deleteByIds([id]);
    },
    [deleteByIds]
  );

  /* ---------------------------------------------------------------------- */
  /*  Toolbar actions                                                       */
  /* ---------------------------------------------------------------------- */

  const handleMerge = React.useCallback(async () => {
    if (pages.length === 0 || busy) return;
    setBusy(true);
    setBusyLabel("Merging pages…");
    setProgress(0);
    try {
      await mergeToPdf(pages, files, (d, t) =>
        setProgress(Math.round((d / t) * 100))
      );
      toast.success("Merged PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Merge failed. A source PDF may be corrupt or encrypted.");
    } finally {
      setBusy(false);
      setBusyLabel(null);
      setProgress(0);
    }
  }, [pages, files, busy]);

  const handleSplit = React.useCallback(async () => {
    if (pages.length === 0 || busy) return;
    setBusy(true);
    setBusyLabel("Splitting into single pages…");
    setProgress(0);
    try {
      await splitToZip(pages, files, (d, t) =>
        setProgress(Math.round((d / t) * 100))
      );
      toast.success("Split ZIP downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Split failed. A source PDF may be corrupt or encrypted.");
    } finally {
      setBusy(false);
      setBusyLabel(null);
      setProgress(0);
    }
  }, [pages, files, busy]);

  const handleExtract = React.useCallback(async () => {
    if (selectedIds.length === 0 || busy) return;
    const selectedPages = pages.filter((p) => selectedIds.includes(p.id));
    if (selectedPages.length === 0) return;
    setBusy(true);
    setBusyLabel("Extracting selected pages…");
    setProgress(0);
    try {
      await extractToPdf(selectedPages, files, (d, t) =>
        setProgress(Math.round((d / t) * 100))
      );
      toast.success("Extracted PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Extract failed. A source PDF may be corrupt or encrypted.");
    } finally {
      setBusy(false);
      setBusyLabel(null);
      setProgress(0);
    }
  }, [pages, files, selectedIds, busy]);

  const handleRotate = React.useCallback(() => {
    if (selectedIds.length === 0 || busy) return;
    rotateByIds(selectedIds);
  }, [selectedIds, rotateByIds, busy]);

  const handleDelete = React.useCallback(() => {
    if (selectedIds.length === 0) return;
    deleteByIds(selectedIds);
  }, [selectedIds, deleteByIds]);

  const handleClear = React.useCallback(() => {
    if (pages.length === 0) return;
    if (
      window.confirm(
        "Clear all pages? This removes every loaded PDF from the editor."
      )
    ) {
      renderedRotations.current.clear();
      clearAll();
    }
  }, [pages.length, clearAll]);

  const handleAddFilesClick = React.useCallback(() => {
    addInputRef.current?.click();
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Whole-area drag-to-add (editor state)                                 */
  /* ---------------------------------------------------------------------- */

  const onEditorDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setDragOverEditor(true);
    }
  };
  const onEditorDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setDragOverEditor(false);
  };
  const onEditorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverEditor(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) handleFiles(dropped);
  };

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  const hasPages = pages.length > 0;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Header />

      <main className="relative flex min-h-0 flex-1 flex-col">
        {hasPages ? (
          <>
            <Toolbar
              pageCount={pages.length}
              selectedCount={selectedIds.length}
              busy={busy}
              busyLabel={busyLabel}
              progress={progress}
              onAddFiles={handleAddFilesClick}
              onMerge={handleMerge}
              onSplit={handleSplit}
              onRotate={handleRotate}
              onDelete={handleDelete}
              onExtract={handleExtract}
              onClear={handleClear}
            />
            <div
              className="relative min-h-0 flex-1 overflow-y-auto"
              onDragOver={onEditorDragOver}
              onDragLeave={onEditorDragLeave}
              onDrop={onEditorDrop}
              onClick={(e) => {
                // Click empty area to clear selection
                if (e.target === e.currentTarget) clearSelection();
              }}
            >
              <PageGrid
                pages={pages}
                sources={files}
                selectedIds={selectedIds}
                onReorder={reorder}
                onToggleSelect={handleToggleSelect}
                onRotate={handleRotateOne}
                onDelete={handleDeleteOne}
              />

              {/* Drag-to-add overlay */}
              {dragOverEditor && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-500 px-8 py-6 text-emerald-600">
                    <UploadCloud className="size-7" />
                    <span className="text-sm font-medium">
                      Drop to add more PDFs
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            className="flex min-h-0 flex-1 items-stretch p-3 sm:p-6"
            onDragOver={onEditorDragOver}
            onDragLeave={onEditorDragLeave}
            onDrop={onEditorDrop}
          >
            <div className="mx-auto flex w-full max-w-2xl flex-col">
              <Dropzone onFiles={handleFiles} />
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                iLovePDF uploads your tax returns. We don&apos;t.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <input
        ref={addInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}
