# MergePDF

Merge, split, rotate, and rearrange PDF pages — **entirely in your browser**.

Drop multiple PDFs, drag page thumbnails to reorder, merge into one file. No
uploads, no sign-up, no ads. Your documents never leave your device.

## What it does

- Drop one or multiple PDF files
- See visual page thumbnails for every page in every file
- Drag pages to reorder them
- **Merge** multiple PDFs into one document
- **Split** a PDF into separate single-page PDFs (downloaded as a ZIP)
- **Rotate** individual pages (90° clockwise)
- **Delete** individual pages
- **Extract** a selection of pages as a new PDF
- Download the final result
- All client-side, zero uploads

## The privacy promise

MergePDF has no backend. Every PDF you drop is read into your browser's memory
using the [File APIs](https://developer.mozilla.org/en-US/docs/Web/API/File_API)
and processed by [pdf.js](https://github.com/mozilla/pdf.js) and
[pdf-lib](https://github.com/Hopding/pdf-lib) entirely on your device. Merged,
split, or extracted output is generated in your browser and offered as a
download.

At no point are your files transmitted over the network. There is no analytics,
no tracking, and no advertising. The only thing stored is your theme preference
(light/dark) in `localStorage`.

> iLovePDF uploads your tax returns. We don't.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [pdf-lib](https://github.com/Hopding/pdf-lib) — merge / split / rotate / extract
- [pdf.js](https://github.com/mozilla/pdf.js) — page thumbnail rendering
- [@dnd-kit](https://github.com/clauderic/dnd-kit) — drag-and-drop page reordering
- [fflate](https://github.com/101arrowz/fflate) — ZIP packaging for split output
- [next-themes](https://github.com/pacocoursey/next-themes) — light/dark mode

## Local development

```bash
bun install
bun run dev
```

The app runs on `http://localhost:3000`.

The pdf.js worker is served from `/public/pdf.worker.min.mjs`. If you upgrade
`pdfjs-dist`, re-copy the worker:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo into [Vercel](https://vercel.com/new).
3. No environment variables are required.
4. Deploy.

The build command is `next build`. Because everything runs client-side, there
are no serverless functions, no databases, and no env vars to configure.

## Project structure

```
src/
  app/
    layout.tsx          # Root layout, theme provider, metadata
    page.tsx            # Single-screen orchestrator (the whole app)
  components/
    mergepdf/
      header.tsx        # Logo + Donate + Settings dropdown
      footer.tsx        # "V1 · Jeffrey Hamilton"
      dropzone.tsx      # Empty state — drop PDFs to merge
      toolbar.tsx       # Add / Merge / Split / Rotate / Delete / Extract / Clear
      page-grid.tsx     # DndContext + SortableContext grid
      page-thumbnail.tsx# Sortable page card with rotate/delete/selection
      legal-dialog.tsx  # Privacy Policy & Terms of Service modal
      legal-content.ts  # Privacy + Terms text
      logo.tsx          # Flat SVG merge mark
    theme-provider.tsx  # next-themes wrapper
  lib/
    pdf-pages.ts        # Zustand store: files, pages, selection, reorder
    pdf-ops.ts          # Thumbnail render + merge/split/rotate/extract
public/
  favicon.svg           # Custom merge icon
  pdf.worker.min.mjs    # pdf.js worker
```

## Author

**Jeffrey Hamilton** — [GitHub](https://github.com/JeffreyHamilton6399)

Donate: [Buy Me a Coffee](https://buymeacoffee.com/jeffreyscof)
