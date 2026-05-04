import { Link, NavLink, useLocation } from "react-router-dom"
import { ChevronRight, ChevronsUpDown, LogOut, Settings, User } from "lucide-react"
import logoLight from "@/assets/logo/bobhaul-light.svg"
import logoDark from "@/assets/logo/bobhaul-dark.svg"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { navSections, type NavItem } from "@/config/nav"
import { useStore } from "@/store"

function useBadgeFor(url: string): number | undefined {
  const exceptions = useStore((s) =>
    s.exceptions.filter((e) => e.status === "open").length,
  )
  const pendingSigs = useStore((s) =>
    s.signatures.filter((sig) => sig.status === "pending").length,
  )
  const unreadThreads = useStore((s) =>
    s.threads.reduce((acc, t) => acc + t.unread, 0),
  )
  const queuedLoads = useStore((s) =>
    s.loads.filter((l) => l.status === "scheduled" && !l.dockId).length,
  )
  if (url === "/control-tower") return exceptions || undefined
  if (url === "/messenger") return unreadThreads || undefined
  if (url === "/documents/signature") return pendingSigs || undefined
  if (url === "/operations/dock") return queuedLoads || undefined
  return undefined
}

function NavMenuItem({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  const liveBadge = useBadgeFor(item.url)
  const badge = liveBadge ?? item.badge

  if (item.children?.length) {
    const isOpen = item.children.some((c) =>
      c.url === "/" ? pathname === "/" : pathname.startsWith(c.url),
    )
    return (
      <Collapsible defaultOpen={isOpen} asChild className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title}>
              <item.icon />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => {
                const childActive = pathname === child.url
                return (
                  <SidebarMenuSubItem key={child.url}>
                    <SidebarMenuSubButton asChild isActive={childActive}>
                      <NavLink to={child.url} end>
                        <span>{child.title}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  const isActive = item.url === "/" ? pathname === "/" : pathname === item.url
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <NavLink to={item.url} end={item.url === "/"}>
          <item.icon />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
      {badge !== undefined && (
        <SidebarMenuBadge>{badge}</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <div className="flex flex-1 items-center gap-2 overflow-hidden">
                    <img
                      src={logoLight}
                      alt="Bobhaul"
                      className="h-7 w-auto shrink-0 dark:hidden"
                    />
                    <img
                      src={logoDark}
                      alt="Bobhaul"
                      className="hidden h-7 w-auto shrink-0 dark:block"
                    />
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      North Hub
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 size-4 shrink-0 opacity-60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                align="start"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                <DropdownMenuItem>North Hub · Ops</DropdownMenuItem>
                <DropdownMenuItem>South Hub · Ops</DropdownMenuItem>
                <DropdownMenuItem>HQ · Admin</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavMenuItem key={item.url} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src="" alt="Operator" />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      OP
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Operator</span>
                    <span className="truncate text-xs text-muted-foreground">
                      ops@bobhaul.io
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                align="end"
                side="top"
              >
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/account/profile">
                    <User className="mr-2 size-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/settings">
                    <Settings className="mr-2 size-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
