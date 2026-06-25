"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Settings,
  Sun,
  Moon,
  Shield,
  FileText,
  Github,
} from "lucide-react";
import { Logo } from "./logo";
import { LegalDialog, type LegalKind } from "./legal-dialog";

const DONATE_URL = "https://buymeacoffee.com/jeffreyscof";
const GITHUB_URL = "https://github.com/JeffreyHamilton6399";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [legal, setLegal] = React.useState<LegalKind | null>(null);

  React.useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";
  // The menu item shows the mode you'll switch *to* — matches the screenshot
  // where, in dark mode, the item reads "Light mode" with a sun icon.
  const toggleLabel = isDark ? "Light mode" : "Dark mode";
  const ToggleIcon = isDark ? Sun : Moon;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b px-3 sm:px-4">
      {/* Left — logo + wordmark */}
      <div className="flex items-center gap-2">
        <span className="text-emerald-500">
          <Logo className="size-6" />
        </span>
        <span className="text-sm font-semibold tracking-tight">MergePDF</span>
      </div>

      {/* Right — donate + settings */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-7 rounded-full px-3 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
        >
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer">
            <Heart className="size-3.5" />
            <span className="text-xs font-medium">Donate</span>
          </a>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full"
              aria-label="Settings"
            >
              <Settings className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="cursor-pointer"
            >
              <ToggleIcon className="size-4" />
              <span>{mounted ? toggleLabel : "Light mode"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Legal
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setLegal("privacy")}
              className="cursor-pointer"
            >
              <Shield className="size-4" />
              <span>Privacy Policy</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLegal("terms")}
              className="cursor-pointer"
            >
              <FileText className="size-4" />
              <span>Terms of Service</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                <span>GitHub</span>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LegalDialog
        open={legal !== null}
        onOpenChange={(o) => !o && setLegal(null)}
        kind={legal}
      />
    </header>
  );
}
