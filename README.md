# MergePDF

Drop PDFs in, get thumbnails of every page, drag them into the order you want,
save one file back out.

Beyond reordering you can merge several files into one, split a PDF into
single-page files delivered as a zip, extract a selection of pages as a new
document, rotate individual pages, and delete the ones you don't need.

## How it works

There is no backend. Files are read into memory with the
[File APIs](https://developer.mozilla.org/en-US/docs/Web/API/File_API),
[pdf.js](https://github.com/mozilla/pdf.js) renders the page thumbnails, and
[pdf-lib](https://github.com/Hopding/pdf-lib) does the structural work. The
output is generated in the tab and handed to you as a download.

Nothing is transmitted. The only thing that persists is a light/dark preference
in `localStorage`.

## Running it

```bash
bun install
bun run dev
```

http://localhost:3000.

The pdf.js worker is served from `public/pdf.worker.min.mjs`. If you upgrade
`pdfjs-dist`, copy the matching worker over:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

## Built with

- Next.js 16 (App Router), TypeScript
- Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/)
- [pdf-lib](https://github.com/Hopding/pdf-lib) for merge, split, rotate, extract
- [pdf.js](https://github.com/mozilla/pdf.js) for thumbnail rendering
- [@dnd-kit](https://github.com/clauderic/dnd-kit) for the drag-and-drop grid
- [fflate](https://github.com/101arrowz/fflate) to zip split output
- [next-themes](https://github.com/pacocoursey/next-themes)

## Layout

```
src/
  app/
    layout.tsx          root layout, theme provider, metadata
    page.tsx            single-screen orchestrator
  components/
    mergepdf/
      header.tsx        logo, donate, settings
      footer.tsx
      dropzone.tsx      empty state
      toolbar.tsx       add / merge / split / rotate / delete / extract / clear
      page-grid.tsx     DndContext + SortableContext
      page-thumbnail.tsx sortable card with rotate, delete, selection
      legal-dialog.tsx
      legal-content.ts
      logo.tsx
    theme-provider.tsx
  lib/
    pdf-pages.ts        store: files, pages, selection, reorder
    pdf-ops.ts          thumbnail render, merge/split/rotate/extract
public/
  favicon.svg
  pdf.worker.min.mjs
```

## Deploying

Import the repo on Vercel. The build command is `next build`; because everything
runs client-side there are no serverless functions, no database and no
environment variables.

---

Jeffrey Hamilton · [GitHub](https://github.com/JeffreyHamilton6399) ·
[buy me a coffee](https://buymeacoffee.com/jeffreyscof)
