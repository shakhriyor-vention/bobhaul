import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  Boxes,
  CalendarClock,
  CreditCard,
  FileText,
  IdCard,
  LayoutDashboard,
  Map,
  MessageSquare,
  PenLine,
  Radar,
  ScanLine,
  ScanText,
  ShieldCheck,
  Sparkle,
  Sparkles,
  Truck,
  UsersRound,
  Warehouse,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useStore } from "@/store"

const routes = [
  { url: "/", title: "Dashboard", icon: LayoutDashboard, group: "Navigate" },
  { url: "/map", title: "Live Map", icon: Map, group: "Navigate" },
  { url: "/control-tower", title: "Control Tower", icon: Radar, group: "Navigate" },
  { url: "/messenger", title: "Messenger", icon: MessageSquare, group: "Navigate" },
  { url: "/company", title: "Account", icon: Building2, group: "Navigate" },
  { url: "/company/site-details", title: "Site Details", icon: Building2, group: "Navigate" },
  { url: "/company/facilities", title: "Facilities", icon: Building2, group: "Navigate" },
  { url: "/users", title: "Users", icon: UsersRound, group: "Navigate" },
  { url: "/drivers", title: "Drivers", icon: IdCard, group: "Navigate" },
  { url: "/fleet", title: "Fleet", icon: Truck, group: "Navigate" },
  { url: "/operations/appointments", title: "Appointments", icon: CalendarClock, group: "Navigate" },
  { url: "/operations/gate", title: "Gate", icon: ScanLine, group: "Navigate" },
  { url: "/operations/dock", title: "Dock Board", icon: Warehouse, group: "Navigate" },
  { url: "/operations/loads", title: "Loads", icon: Boxes, group: "Navigate" },
  { url: "/operations/optimization", title: "Optimization", icon: Sparkles, group: "Navigate" },
  { url: "/documents/scanner", title: "Document Scanner", icon: ScanText, group: "Navigate" },
  { url: "/documents/generator", title: "Document Generator", icon: FileText, group: "Navigate" },
  { url: "/documents/signature", title: "Digital Signature", icon: PenLine, group: "Navigate" },
  { url: "/compliance", title: "Compliance Hub", icon: ShieldCheck, group: "Navigate" },
  { url: "/billing/subscription", title: "Subscription", icon: Sparkle, group: "Navigate" },
  { url: "/billing/payments", title: "Payments", icon: CreditCard, group: "Navigate" },
]

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const navigate = useNavigate()
  const { drivers, loads, appointments } = useStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  const go = (url: string) => {
    setOpen(false)
    navigate(url)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command, navigate, search drivers / loads…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {routes.map((r) => (
            <CommandItem key={r.url} onSelect={() => go(r.url)}>
              <r.icon className="mr-2 size-4" />
              {r.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Drivers">
          {drivers.slice(0, 6).map((d) => (
            <CommandItem key={d.id} onSelect={() => go(`/drivers`)}>
              <IdCard className="mr-2 size-4" />
              {d.name} <span className="ml-2 text-xs text-muted-foreground">{d.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Loads">
          {loads.slice(0, 6).map((l) => (
            <CommandItem key={l.id} onSelect={() => go(`/operations/loads`)}>
              <Boxes className="mr-2 size-4" />
              {l.id} <span className="ml-2 text-xs text-muted-foreground">{l.origin} → {l.destination}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Appointments">
          {appointments.slice(0, 4).map((a) => (
            <CommandItem key={a.id} onSelect={() => go(`/operations/appointments`)}>
              <CalendarClock className="mr-2 size-4" />
              {a.id} <span className="ml-2 text-xs text-muted-foreground">{a.time} · {a.carrier}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
