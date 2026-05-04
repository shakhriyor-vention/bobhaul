import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Search } from "lucide-react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { CommandPalette } from "@/components/command-palette"
import { NotificationsPopover } from "@/components/notifications-popover"
import { navSections } from "@/config/nav"
import { useStore } from "@/store"

const accentVar: Record<string, string> = {
  violet: "oklch(0.55 0.22 295)",
  blue: "oklch(0.55 0.21 254)",
  emerald: "oklch(0.55 0.18 156)",
  amber: "oklch(0.7 0.18 70)",
  rose: "oklch(0.62 0.21 17)",
}

function useBreadcrumb() {
  const { pathname } = useLocation()
  if (pathname.startsWith("/account/profile"))
    return { section: "Account", item: "Profile" }
  if (pathname.startsWith("/account/settings"))
    return { section: "Account", item: "Settings" }
  for (const section of navSections) {
    for (const item of section.items) {
      if (item.children?.length) {
        for (const child of item.children) {
          const match = child.url === "/" ? pathname === "/" : pathname === child.url
          if (match)
            return { section: section.label, item: item.title, leaf: child.title }
        }
      }
      const match =
        item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
      if (match) return { section: section.label, item: item.title }
    }
  }
  return { section: "Workspace", item: "—" }
}

export default function RootLayout() {
  const crumb = useBreadcrumb()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const prefs = useStore((s) => s.prefs)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--primary", accentVar[prefs.accent] ?? accentVar.violet)
    root.dataset.density = prefs.density
    root.dataset.contrast = prefs.highContrast ? "high" : "normal"
    root.dataset.motion = prefs.reduceMotion ? "reduced" : "full"
    root.style.fontSize =
      prefs.textSize === "small" ? "14px" : prefs.textSize === "large" ? "17px" : "16px"
  }, [prefs.accent, prefs.density, prefs.highContrast, prefs.reduceMotion, prefs.textSize])

  return (
    <TooltipProvider delayDuration={120}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <span>{crumb.section}</span>
              <span className="text-border">/</span>
              <span className={crumb.leaf ? "" : "font-medium text-foreground"}>
                {crumb.item}
              </span>
              {crumb.leaf && (
                <>
                  <span className="text-border">/</span>
                  <span className="font-medium text-foreground">{crumb.leaf}</span>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden h-9 w-[280px] justify-between gap-2 px-3 text-muted-foreground md:flex"
                onClick={() => setPaletteOpen(true)}
              >
                <span className="flex items-center gap-2">
                  <Search className="size-4" />
                  Search shipments, drivers…
                </span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  ⌘K
                </kbd>
              </Button>
              <NotificationsPopover />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
      <Toaster richColors closeButton position="bottom-right" />
    </TooltipProvider>
  )
}
