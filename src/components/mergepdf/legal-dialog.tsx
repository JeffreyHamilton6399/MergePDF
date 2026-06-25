"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "./legal-content";

export type LegalKind = "privacy" | "terms";

interface LegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: LegalKind | null;
}

function Markdownish({ text }: { text: string }) {
  // Minimal, dependency-free markdown-ish renderer for headings + paragraphs.
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-2 ml-5 list-disc space-y-1.5 text-sm text-muted-foreground">
          {list.map((li, i) => (
            <li key={i}>{renderInline(li)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) {
      flushList();
      out.push(
        <h2 key={i} className="text-lg font-semibold tracking-tight text-foreground">
          {line.slice(2)}
        </h2>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(
        <h3 key={i} className="mt-4 text-sm font-semibold uppercase tracking-wide text-foreground">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      list.push(line.slice(2));
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      out.push(
        <p key={i} className="text-sm leading-relaxed text-muted-foreground">
          {renderInline(line)}
        </p>
      );
    }
  });
  flushList();
  return <div className="space-y-1">{out}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Handle backtick code spans + bold.
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8em] text-foreground">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function LegalDialog({ open, onOpenChange, kind }: LegalDialogProps) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const body = isPrivacy ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-3.5">
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-5 py-4">
            <Markdownish text={body} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
