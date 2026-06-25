/**
 * Client-side PDF operations.
 *
 * Everything here runs in the browser. pdfjs-dist renders thumbnails, pdf-lib
 * performs structural manipulation (merge / split / rotate / extract), and
 * fflate zips split output. No data ever leaves the device.
 */

import type { PageItem, SourceFile } from "./pdf-pages";

/* -------------------------------------------------------------------------- */
/*  pdfjs — thumbnail rendering                                               */
/* -------------------------------------------------------------------------- */

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

export interface RenderedThumb {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render a single page of a PDF to a JPEG data URL at a low scale.
 * Used for the page-thumbnail grid.
 */
export async function renderThumbnail(
  file: File,
  pageNumber: number,
  scale = 0.3,
  rotation = 0
): Promise<RenderedThumb> {
  const pdfjs = await getPdfjs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  try {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale, rotation });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.7),
      width: viewport.width,
      height: viewport.height,
    };
  } finally {
    await loadingTask.destroy().catch(() => {});
  }
}

/** Read the total page count of a PDF without rendering anything. */
export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await getPdfjs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const count = doc.numPages;
  await loadingTask.destroy().catch(() => {});
  return count;
}

/* -------------------------------------------------------------------------- */
/*  pdf-lib — structural operations                                          */
/* -------------------------------------------------------------------------- */

let pdfLibPromise: Promise<typeof import("pdf-lib")> | null = null;
async function getPdfLib() {
  if (!pdfLibPromise) pdfLibPromise = import("pdf-lib");
  return pdfLibPromise;
}

let fflatePromise: Promise<typeof import("fflate")> | null = null;
async function getFflate() {
  if (!fflatePromise) fflatePromise = import("fflate");
  return fflatePromise;
}

/** Cache loaded source PDFDocuments (pdf-lib) keyed by source id for reuse. */
const docCache = new Map<string, Awaited<ReturnType<typeof import("pdf-lib")>["PDFDocument"]["load"]>>();

async function loadSourceDoc(source: SourceFile) {
  const { PDFDocument } = await getPdfLib();
  const existing = docCache.get(source.id);
  if (existing) return existing;
  const bytes = await source.file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  docCache.set(source.id, doc);
  return doc;
}

function clearDocCache() {
  docCache.clear();
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a beat so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Build a filename from a base + extension, stripping unsafe chars. */
function safeName(base: string, ext: string): string {
  const clean = base.replace(/[^\w\d-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return `${clean || "merged"}.${ext}`;
}

/* -------------------------------------------------------------------------- */
/*  Merge                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Merge all pages (in current order, respecting rotation) into a single PDF.
 */
export async function mergeToPdf(
  pages: PageItem[],
  sources: SourceFile[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const { PDFDocument, degrees } = await getPdfLib();
  const out = await PDFDocument.create();
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  // Group consecutive pages by source to batch-copy efficiently.
  const total = pages.length;

  let i = 0;
  while (i < total) {
    const currentSourceId = pages[i].sourceId;
    let j = i;
    while (j < total && pages[j].sourceId === currentSourceId) j++;
    const slice = pages.slice(i, j);
    const source = sourceMap.get(currentSourceId);
    if (!source) {
      i = j;
      continue;
    }
    const srcDoc = await loadSourceDoc(source);
    const pageIndices = slice.map((p) => p.pageNumber - 1);
    const copied = await out.copyPages(srcDoc, pageIndices);
    copied.forEach((page, idx) => {
      const orig = slice[idx];
      const baseAngle = page.getRotation().angle;
      page.setRotation(degrees((baseAngle + orig.rotation) % 360));
      out.addPage(page);
    });
    onProgress?.(j, total);
    i = j;
  }

  const bytes = await out.save();
  download(new Blob([bytes as BlobPart], { type: "application/pdf" }), safeName("merged", "pdf"));
  clearDocCache();
}

/* -------------------------------------------------------------------------- */
/*  Split — one PDF per page, zipped                                          */
/* -------------------------------------------------------------------------- */

export async function splitToZip(
  pages: PageItem[],
  sources: SourceFile[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const { PDFDocument, degrees } = await getPdfLib();
  const fflate = await getFflate();
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const files: Record<string, Uint8Array> = {};
  const total = pages.length;

  // Group by source for cache reuse.
  const bySource = new Map<string, PageItem[]>();
  for (const p of pages) {
    if (!bySource.has(p.sourceId)) bySource.set(p.sourceId, []);
    bySource.get(p.sourceId)!.push(p);
  }

  let done = 0;
  for (const [sourceId, srcPages] of bySource) {
    const source = sourceMap.get(sourceId);
    if (!source) continue;
    const srcDoc = await loadSourceDoc(source);
    for (const pageItem of srcPages) {
      const out = await PDFDocument.create();
      const [copied] = await out.copyPages(srcDoc, [pageItem.pageNumber - 1]);
      const baseAngle = copied.getRotation().angle;
      copied.setRotation(degrees((baseAngle + pageItem.rotation) % 360));
      out.addPage(copied);
      const bytes = await out.save();
      const name = `${safeName(source.name.replace(/\.pdf$/i, ""), "pdf")}_page_${pageItem.pageNumber}.pdf`;
      files[name] = bytes;
      done++;
      onProgress?.(done, total);
    }
  }

  const zipped = fflate.zipSync(files, { level: 5 });
  download(new Blob([zipped as BlobPart], { type: "application/zip" }), safeName("split", "zip"));
  clearDocCache();
}

/* -------------------------------------------------------------------------- */
/*  Extract — selected pages as a single new PDF                             */
/* -------------------------------------------------------------------------- */

export async function extractToPdf(
  pages: PageItem[],
  sources: SourceFile[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  // Extract is merge over a subset — reuse merge logic.
  return mergeToPdf(pages, sources, onProgress);
}

/* -------------------------------------------------------------------------- */
/*  Validation helpers                                                        */
/* -------------------------------------------------------------------------- */

export function isLikelyPdf(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return /\.pdf$/i.test(file.name);
}

/** Mobile/desktop page caps to bound memory use. */
export function pageLimit(isMobile: boolean): number {
  return isMobile ? 50 : 200;
}
