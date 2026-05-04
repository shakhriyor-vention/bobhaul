import { useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Building2,
  Calendar as CalendarIcon,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  ClockAlert,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  Inbox,
  List as ListIcon,
  LogIn,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Pencil,
  Repeat2,
  Search,
  Truck,
  X,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/page-header"
import { BookAppointmentDialog } from "@/components/dialogs/book-appointment-dialog"
import { useStore, type Appointment, type AppointmentStatus } from "@/store"
import { cn } from "@/lib/utils"

const statusTone: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  late: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "checked-in": "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  loading: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  completed: "bg-muted text-muted-foreground",
  canceled: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
}

const typeTone: Record<"inbound" | "outbound" | "cross-dock", string> = {
  inbound:
    "border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold",
  outbound:
    "border-orange-500/40 bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold",
  "cross-dock":
    "border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 text-fuchsia-700 dark:text-fuchsia-300 font-semibold",
}

const eventTone: Record<AppointmentStatus, string> = {
  confirmed: "border-l-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20",
  pending: "border-l-amber-500 bg-amber-500/10 hover:bg-amber-500/20",
  late: "border-l-rose-500 bg-rose-500/10 hover:bg-rose-500/20",
  "checked-in": "border-l-blue-500 bg-blue-500/10 hover:bg-blue-500/20",
  loading: "border-l-violet-500 bg-violet-500/10 hover:bg-violet-500/20",
  completed: "border-l-slate-400 bg-muted/40 hover:bg-muted/60",
  canceled:
    "border-l-rose-500 bg-rose-500/10 line-through opacity-60 hover:bg-rose-500/20",
}

const declineReasons = [
  "Capacity full",
  "Wrong dock type",
  "Outside hours",
  "Driver not approved",
  "Other",
]

const HOUR_START = 6
const HOUR_END = 22
const HOUR_PX = 60
const TIMEZONE = Intl.DateTimeFormat()
  .resolvedOptions()
  .timeZone.split("/")
  .pop()
  ?.replace("_", " ") ?? "Local"

function startOfWeek(d: Date) {
  const day = d.getDay()
  const offset = day === 0 ? -6 : 1 - day
  const r = new Date(d)
  r.setDate(d.getDate() + offset)
  r.setHours(0, 0, 0, 0)
  return r
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(m: number) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

function defaultDuration(a: Appointment): number {
  if (a.durationMin) return a.durationMin
  if (a.type === "cross-dock") return 90
  if (a.type === "inbound") return 60
  return 60
}

function formatLongDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatRelativeDate(iso: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso + "T00:00:00")
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays === -1) return "Yesterday"
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays}d`
  if (diffDays < -1 && diffDays > -7) return `${-diffDays}d ago`
  return null
}

function formatTimeRange(a: Appointment) {
  const start = a.time
  const dur = defaultDuration(a)
  const endMin = timeToMinutes(start) + dur
  const end = minutesToTime(endMin)
  return `${start} – ${end}`
}

type LaneAssigned = { appt: Appointment; lane: number; lanes: number }

function assignLanes(appts: Appointment[]): LaneAssigned[] {
  const sorted = [...appts].sort((a, b) =>
    timeToMinutes(a.time) - timeToMinutes(b.time),
  )
  const result: { appt: Appointment; start: number; end: number; lane: number }[] = []
  const groups: number[][] = []
  for (const a of sorted) {
    const start = timeToMinutes(a.time)
    const end = start + defaultDuration(a)
    let lane = 0
    while (
      result.some(
        (r) => r.lane === lane && r.end > start && r.start < end,
      )
    ) {
      lane += 1
    }
    result.push({ appt: a, start, end, lane })
  }
  // Group overlapping clusters and compute group lane count
  for (const r of result) {
    let placed = false
    for (const g of groups) {
      if (g.some((idx) => result[idx].end > r.start && result[idx].start < r.end)) {
        g.push(result.indexOf(r))
        placed = true
        break
      }
    }
    if (!placed) groups.push([result.indexOf(r)])
  }
  // Rebuild groups with proper transitive merging
  const groups2: Set<number>[] = []
  for (let i = 0; i < result.length; i++) {
    const r = result[i]
    const merged = new Set<number>([i])
    for (const g of groups2) {
      for (const idx of g) {
        const o = result[idx]
        if (o.end > r.start && o.start < r.end) {
          g.forEach((x) => merged.add(x))
        }
      }
    }
    groups2.push(merged)
  }
  // Final lane count per group: max lane in group + 1
  const laneCountByIdx = new Map<number, number>()
  for (const g of groups2) {
    const maxLane = Math.max(...Array.from(g).map((i) => result[i].lane))
    for (const i of g) {
      const prev = laneCountByIdx.get(i) ?? 0
      laneCountByIdx.set(i, Math.max(prev, maxLane + 1))
    }
  }
  return result.map((r, i) => ({
    appt: r.appt,
    lane: r.lane,
    lanes: laneCountByIdx.get(i) ?? 1,
  }))
}

function exportCsv(rows: Appointment[], driverNames: Record<string, string>) {
  const headers = [
    "id",
    "date",
    "time",
    "endTime",
    "carrier",
    "type",
    "status",
    "driver",
    "dock",
    "load",
    "equipment",
    "recurring",
  ]
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`
    }
    return v
  }
  const lines = [headers.join(",")]
  for (const a of rows) {
    const dur = defaultDuration(a)
    const endTime = minutesToTime(timeToMinutes(a.time) + dur)
    lines.push(
      [
        a.id,
        a.date,
        a.time,
        endTime,
        a.carrier,
        a.type,
        a.status,
        driverNames[a.driverId] ?? a.driverId,
        a.dockId ?? "",
        a.loadId,
        (a.equipment ?? []).join(" "),
        a.recurring ? a.recurring.frequency : "",
      ]
        .map((v) => escape(String(v)))
        .join(","),
    )
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Appointments() {
  const appointments = useStore((s) => s.appointments)
  const drivers = useStore((s) => s.drivers)
  const facilities = useStore((s) => s.facilities)
  const docks = useStore((s) => s.docks)
  const loads = useStore((s) => s.loads)
  const cancel = useStore((s) => s.cancelAppointment)
  const approve = useStore((s) => s.approveAppointment)
  const decline = useStore((s) => s.declineAppointment)
  const reschedule = useStore((s) => s.rescheduleAppointment)
  const duplicate = useStore((s) => s.duplicateAppointment)
  const markStatus = useStore((s) => s.markAppointmentStatus)

  const [format, setFormat] = useState<"calendar" | "list">("calendar")
  const [range, setRange] = useState<"day" | "week" | "month">("week")
  const [anchor, setAnchor] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10),
  )
  const [openId, setOpenId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [declineTarget, setDeclineTarget] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState(declineReasons[0])
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [reDate, setReDate] = useState("")
  const [reTime, setReTime] = useState("")
  const [reDock, setReDock] = useState("")

  const [search, setSearch] = useState("")
  const [filterFacility, setFilterFacility] = useState<string>("all")
  const [filterCarrier, setFilterCarrier] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterDateFrom, setFilterDateFrom] = useState<string>("")
  const [filterDateTo, setFilterDateTo] = useState<string>("")
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? "—"
  const driverNames = useMemo(() => {
    const m: Record<string, string> = {}
    drivers.forEach((d) => (m[d.id] = d.name))
    return m
  }, [drivers])

  const today = new Date().toISOString().slice(0, 10)
  const carriers = useMemo(
    () => Array.from(new Set(appointments.map((a) => a.carrier))).sort(),
    [appointments],
  )

  const [pageSize, setPageSize] = useState(25)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return appointments.filter((a) => {
      if (filterCarrier !== "all" && a.carrier !== filterCarrier) return false
      if (filterStatus !== "all" && a.status !== filterStatus) return false
      if (filterType !== "all" && a.type !== filterType) return false
      if (filterDateFrom && a.date < filterDateFrom) return false
      if (filterDateTo && a.date > filterDateTo) return false
      if (q) {
        const hay = [
          a.id,
          a.carrier,
          a.loadId,
          a.dockId ?? "",
          driverNames[a.driverId] ?? "",
          a.type,
          a.status,
        ]
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [
    appointments,
    search,
    filterCarrier,
    filterStatus,
    filterType,
    filterDateFrom,
    filterDateTo,
    driverNames,
  ])

  const activeFilterCount =
    (filterFacility !== "all" ? 1 : 0) +
    (filterCarrier !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0) +
    (filterType !== "all" ? 1 : 0) +
    (filterDateFrom ? 1 : 0) +
    (filterDateTo ? 1 : 0)

  const clearFilters = () => {
    setFilterFacility("all")
    setFilterCarrier("all")
    setFilterStatus("all")
    setFilterType("all")
    setFilterDateFrom("")
    setFilterDateTo("")
    setSearch("")
  }

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor])
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + 7)
    return d
  }, [weekStart])

  const inWeek = (a: Appointment) => {
    const d = new Date(a.date)
    return d >= weekStart && d < weekEnd
  }
  const weekAppts = filtered.filter(inWeek)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowIso = tomorrow.toISOString().slice(0, 10)

  const pending = filtered.filter((a) => a.status === "pending")
  const tomorrowConfirmed = filtered.filter(
    (a) => a.date === tomorrowIso && a.status === "confirmed",
  )
  const atRisk = filtered.filter((a) => a.status === "late")
  const capacity = Math.min(100, Math.round((weekAppts.length / 50) * 100))

  const tomorrowSplit = useMemo(() => {
    const inb = tomorrowConfirmed.filter((a) => a.type === "inbound").length
    const out = tomorrowConfirmed.filter((a) => a.type === "outbound").length
    const cd = tomorrowConfirmed.filter((a) => a.type === "cross-dock").length
    return `${inb} in · ${out} out · ${cd} cross`
  }, [tomorrowConfirmed])

  const open = openId ? appointments.find((a) => a.id === openId) : null

  const shiftAnchor = (delta: number) => {
    const d = new Date(anchor)
    if (range === "day") {
      d.setDate(d.getDate() + delta)
      const iso = d.toISOString().slice(0, 10)
      setSelectedDate(iso)
    } else if (range === "week") d.setDate(d.getDate() + delta * 7)
    else if (range === "month") d.setMonth(d.getMonth() + delta)
    setAnchor(d)
  }

  const goToToday = () => {
    setAnchor(new Date())
    setSelectedDate(today)
  }

  const dateRangeLabel = useMemo(() => {
    if (range === "day") {
      return new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }
    if (range === "week") {
      const end = new Date(weekEnd)
      end.setDate(end.getDate() - 1)
      return `${weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} – ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`
    }
    if (range === "month") {
      return anchor.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    }
    return ""
  }, [range, anchor, weekStart, weekEnd, selectedDate])

  const stats = [
    {
      label: "Booked this week",
      value: String(weekAppts.length),
      icon: CalendarClock,
    },
    {
      label: "Tomorrow confirmed",
      value: String(tomorrowConfirmed.length),
      icon: CheckCircle2,
      sub: tomorrowConfirmed.length > 0 ? tomorrowSplit : "",
    },
    {
      label: "Pending approval",
      value: String(pending.length),
      icon: Inbox,
      tone: pending.length > 0 ? "text-amber-600" : "",
    },
    {
      label: "Week capacity",
      value: `${capacity}%`,
      icon: Clock,
    },
    {
      label: "At-risk",
      value: String(atRisk.length),
      icon: AlertTriangle,
      tone: atRisk.length > 0 ? "text-rose-600" : "",
    },
  ]

  const dayAppts = (iso: string) =>
    filtered
      .filter((a) => a.date === iso)
      .sort((a, b) => a.time.localeCompare(b.time))

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      return {
        iso,
        date: d,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        num: d.getDate(),
        today: iso === today,
        appts: dayAppts(iso),
      }
    })
  }, [weekStart, filtered, today]) // eslint-disable-line react-hooks/exhaustive-deps

  const monthGrid = useMemo(() => {
    const first = startOfMonth(anchor)
    const startGrid = startOfWeek(first)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startGrid)
      d.setDate(startGrid.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      return {
        iso,
        date: d,
        sameMonth: d.getMonth() === anchor.getMonth(),
        today: iso === today,
        appts: dayAppts(iso),
      }
    })
  }, [anchor, filtered, today]) // eslint-disable-line react-hooks/exhaustive-deps


  const openReschedule = (a: Appointment) => {
    setRescheduleTarget(a)
    setReDate(a.date)
    setReTime(a.time)
    setReDock(a.dockId ?? "")
  }

  const submitReschedule = () => {
    if (!rescheduleTarget) return
    reschedule(
      rescheduleTarget.id,
      reDate,
      reTime,
      reDock || undefined,
    )
    toast.success(`${rescheduleTarget.id} rescheduled`, {
      description: `${formatLongDate(reDate)} · ${reTime}`,
    })
    setRescheduleTarget(null)
  }

  const handleDuplicate = (id: string) => {
    const newId = duplicate(id)
    if (newId) {
      toast.success(`Duplicated to ${newId}`, {
        description: "Pending review",
      })
    }
  }

  const handleCheckIn = (id: string) => {
    markStatus(id, "checked-in")
    toast.success(`${id} checked in`)
  }

  const copyLink = (id: string) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/appointments?id=${id}`)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Copy failed"))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Plan and approve dock appointments — Bobhaul · Dallas Distribution Hub"
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Download className="mr-1.5 size-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export {filtered.length} bookings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    exportCsv(filtered, driverNames)
                    toast.success(`Exported ${filtered.length} bookings`)
                  }}
                >
                  <Download className="mr-2 size-4" /> Export filtered (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    exportCsv(weekAppts, driverNames)
                    toast.success(`Exported ${weekAppts.length} bookings · this week`)
                  }}
                >
                  <CalendarClock className="mr-2 size-4" /> Export this week
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    exportCsv(appointments, driverNames)
                    toast.success(`Exported ${appointments.length} bookings · all`)
                  }}
                >
                  <ListIcon className="mr-2 size-4" /> Export all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <BookAppointmentDialog defaultDate={selectedDate} />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="size-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold tracking-tight ${s.tone ?? ""}`}>
                {s.value}
              </div>
              {s.sub && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {s.sub}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="size-4 text-amber-600" />
              Pending approval · {pending.length}
            </CardTitle>
            <CardDescription>Review carrier-portal booking requests.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {pending.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-l-4 border-l-amber-500 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.carrier}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {a.id}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {formatLongDate(a.date)} · {formatTimeRange(a)}
                      </span>
                      <Badge variant="outline" className={`capitalize ${typeTone[a.type]}`}>{a.type}</Badge>
                      <span>·</span>
                      <span>{driverName(a.driverId)}</span>
                    </div>
                    {a.equipment && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {a.equipment.map((e) => (
                          <Badge key={e} variant="secondary" className="text-[10px]">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDeclineTarget(a.id)
                        setDeclineReason(declineReasons[0])
                      }}
                    >
                      <XCircle className="mr-1 size-4" /> Decline
                    </Button>
                    <Button size="sm" onClick={() => { approve(a.id); toast.success(`${a.id} approved`) }}>
                      <CheckCircle2 className="mr-1 size-4" /> Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search id, carrier, dock, driver, load…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterFacility} onValueChange={setFilterFacility}>
              <SelectTrigger className="w-[160px]">
                <Building2 className="mr-1 size-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All facilities</SelectItem>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCarrier} onValueChange={setFilterCarrier}>
              <SelectTrigger className="w-[150px]">
                <Truck className="mr-1 size-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All carriers</SelectItem>
                {carriers.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-1 size-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked-in">Checked-in</SelectItem>
                <SelectItem value="loading">Loading</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="cross-dock">Cross-dock</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden items-center gap-1 lg:flex">
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-[140px]"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-[140px]"
              />
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 size-3.5" /> Clear · {activeFilterCount}
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                <TabsList>
                  <TabsTrigger value="calendar">
                    <CalendarIcon className="mr-1 size-3.5" /> Calendar
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <ListIcon className="mr-1 size-3.5" /> List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => shiftAnchor(-1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-2 text-sm font-medium tabular-nums">
                  {dateRangeLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => shiftAnchor(1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <Legend tone="bg-emerald-500" label="Confirmed" />
            <Legend tone="bg-amber-500" label="Pending" />
            <Legend tone="bg-blue-500" label="Checked-in" />
            <Legend tone="bg-violet-500" label="Loading" />
            <Legend tone="bg-rose-500" label="Late" />
            <Legend tone="bg-slate-400" label="Completed" />
            <span className="ml-auto">
              {filtered.length} of {appointments.length} appointments · times in {TIMEZONE}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {format === "calendar" && range === "day" && (
            <DayView
              iso={selectedDate}
              appts={dayAppts(selectedDate)}
              setOpenId={setOpenId}
              driverName={driverName}
            />
          )}

          {format === "calendar" && range === "week" && (
            <WeekView
              days={weekDays}
              setOpenId={setOpenId}
              driverName={driverName}
              setSelectedDate={(iso) => {
                setSelectedDate(iso)
                setRange("day")
              }}
            />
          )}

          {format === "calendar" && range === "month" && (
            <MonthView
              cells={monthGrid}
              setOpenId={setOpenId}
              setSelectedDate={(iso) => {
                setSelectedDate(iso)
                setRange("day")
              }}
            />
          )}

          {format === "list" && (() => {
            const listAppts =
              range === "day"
                ? dayAppts(selectedDate)
                : range === "week"
                ? weekDays.flatMap((d) => d.appts)
                : monthGrid
                    .filter((c) => c.sameMonth)
                    .flatMap((c) => c.appts)
            return (
              <ListView
                key={`${range}-${selectedDate}-${anchor.getMonth()}-${anchor.getFullYear()}-${listAppts.length}`}
                range={range}
                appts={listAppts}
                today={today}
                pageSize={pageSize}
                onPageSize={setPageSize}
                driverName={driverName}
                setOpenId={setOpenId}
                openReschedule={openReschedule}
                handleDuplicate={handleDuplicate}
                handleCheckIn={handleCheckIn}
                copyLink={copyLink}
                setCancelTarget={setCancelTarget}
                setCancelReason={setCancelReason}
              />
            )
          })()}
        </CardContent>
      </Card>

      <DetailSheet
        open={open}
        onClose={() => setOpenId(null)}
        drivers={drivers}
        facilities={facilities}
        docks={docks}
        loads={loads}
        openReschedule={openReschedule}
        handleDuplicate={handleDuplicate}
        handleCheckIn={handleCheckIn}
        copyLink={copyLink}
        setCancelTarget={setCancelTarget}
        setCancelReason={setCancelReason}
      />

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(o) => {
          if (!o) {
            setCancelTarget(null)
            setCancelReason("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget} will be marked canceled. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Reason (optional)</Label>
            <Input
              placeholder="Carrier requested · weather · capacity reallocation"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelTarget) {
                  cancel(cancelTarget, cancelReason || undefined)
                  toast.success(`${cancelTarget} canceled`)
                  setCancelTarget(null)
                  setCancelReason("")
                }
              }}
            >
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!declineTarget}
        onOpenChange={(o) => !o && setDeclineTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline booking</DialogTitle>
            <DialogDescription>
              {declineTarget} will be removed from pending and the carrier notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Reason</Label>
            <div className="grid grid-cols-2 gap-2">
              {declineReasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setDeclineReason(r)}
                  className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    declineReason === r
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (declineTarget) {
                  decline(declineTarget, declineReason)
                  toast.success(`${declineTarget} declined`)
                  setDeclineTarget(null)
                }
              }}
            >
              Send decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={(o) => !o && setRescheduleTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>
              {rescheduleTarget?.id} · {rescheduleTarget?.carrier}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">New date</Label>
              <Input
                type="date"
                value={reDate}
                onChange={(e) => setReDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New time</Label>
              <Input
                type="time"
                value={reTime}
                onChange={(e) => setReTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Dock (optional)</Label>
              <Select value={reDock || "none"} onValueChange={(v) => setReDock(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-assign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auto-assign</SelectItem>
                  {docks.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.id}{" "}
                      {d.capabilities && d.capabilities.length > 0
                        ? `· ${d.capabilities.join(", ")}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={submitReschedule}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", tone)} />
      {label}
    </span>
  )
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function ListView({
  range,
  appts,
  today,
  pageSize,
  onPageSize,
  driverName,
  setOpenId,
  openReschedule,
  handleDuplicate,
  handleCheckIn,
  copyLink,
  setCancelTarget,
  setCancelReason,
}: {
  range: "day" | "week" | "month"
  appts: Appointment[]
  today: string
  pageSize: number
  onPageSize: (n: number) => void
  driverName: (id: string) => string
  setOpenId: (id: string) => void
  openReschedule: (a: Appointment) => void
  handleDuplicate: (id: string) => void
  handleCheckIn: (id: string) => void
  copyLink: (id: string) => void
  setCancelTarget: (id: string | null) => void
  setCancelReason: (s: string) => void
}) {
  const [page, setPage] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sorted = useMemo(
    () =>
      [...appts].sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time) ||
          a.id.localeCompare(b.id),
      ),
    [appts],
  )

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIdx = (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = sorted.slice(startIdx, endIdx)
  const goToPage = (n: number) => {
    const next = Math.min(Math.max(1, n), totalPages)
    if (next === safePage) return
    setPage(next)
    requestAnimationFrame(() => {
      const viewport = scrollRef.current?.querySelector(
        "[data-slot=scroll-area-viewport]",
      ) as HTMLElement | null
      viewport?.scrollTo({ top: 0, behavior: "smooth" })
    })
  }
  const showPagination = total > pageSize || totalPages > 1

  const groupedRows = useMemo(() => {
    const out: { iso: string; rows: Appointment[]; total: number }[] = []
    if (range === "day") {
      out.push({
        iso: pageRows[0]?.date ?? today,
        rows: pageRows,
        total: pageRows.length,
      })
      return out
    }
    let current: { iso: string; rows: Appointment[]; total: number } | null = null
    const dayTotals = new Map<string, number>()
    for (const a of sorted) {
      dayTotals.set(a.date, (dayTotals.get(a.date) ?? 0) + 1)
    }
    for (const r of pageRows) {
      if (!current || current.iso !== r.date) {
        current = { iso: r.date, rows: [], total: dayTotals.get(r.date) ?? 0 }
        out.push(current)
      }
      current.rows.push(r)
    }
    return out
  }, [pageRows, range, sorted, today])

  if (total === 0) {
    return (
      <div className="rounded-md border py-16 text-center text-sm text-muted-foreground">
        No appointments in this range.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <ListColumnHeader />
      <ScrollArea ref={scrollRef} className="h-[70vh]">
        <ol className="flex flex-col">
          {groupedRows.map((g) => (
            <section key={g.iso} className="flex flex-col">
              {range !== "day" && (
                <DaySectionHeader
                  iso={g.iso}
                  pageCount={g.rows.length}
                  dayTotal={g.total}
                  today={today}
                />
              )}
              <ul className="flex flex-col gap-1 py-2">
                {g.rows.map((a) => (
                  <BookingCard
                    key={a.id}
                    a={a}
                    driverName={driverName}
                    setOpenId={setOpenId}
                    openReschedule={openReschedule}
                    handleDuplicate={handleDuplicate}
                    handleCheckIn={handleCheckIn}
                    copyLink={copyLink}
                    setCancelTarget={setCancelTarget}
                    setCancelReason={setCancelReason}
                  />
                ))}
              </ul>
            </section>
          ))}
        </ol>
      </ScrollArea>
      {showPagination && (
        <PaginationBar
          page={safePage}
          pageSize={pageSize}
          total={total}
          startIdx={startIdx}
          endIdx={endIdx}
          totalPages={totalPages}
          onPage={goToPage}
          onPageSize={(n) => {
            onPageSize(n)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}

function ListColumnHeader() {
  return (
    <div
      className={cn(
        "grid items-center gap-2 border-b border-l-4 border-l-transparent bg-muted/40 px-3 py-2",
        "text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
        ROW_GRID,
      )}
    >
      <span className="truncate">Time</span>
      <span className="truncate">Dock</span>
      <span className="truncate">Status</span>
      <span className="truncate">Direction</span>
      <span className="truncate">Carrier</span>
      <span className="truncate">Driver</span>
      <span className="truncate">Load</span>
      <span className="truncate">Reference</span>
      <span className="truncate text-right">Delay</span>
      <span aria-hidden="true" />
    </div>
  )
}

function DaySectionHeader({
  iso,
  pageCount,
  dayTotal,
  today,
}: {
  iso: string
  pageCount: number
  dayTotal: number
  today: string
}) {
  const date = new Date(iso + "T00:00:00")
  const isToday = iso === today
  const isPast = iso < today
  const rel = formatRelativeDate(iso)
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" })
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-muted/70 px-4 py-2 backdrop-blur",
        isToday && "bg-primary/10",
      )}
    >
      <div className="flex items-baseline gap-2">
        <h3
          className={cn(
            "text-sm font-semibold",
            isPast && !isToday && "text-muted-foreground",
          )}
        >
          {weekday}
        </h3>
        <span className="text-xs text-muted-foreground">{monthDay}</span>
        {rel && (
          <Badge
            variant={isToday ? "default" : "secondary"}
            className="h-4 px-1.5 text-[10px]"
          >
            {rel}
          </Badge>
        )}
      </div>
      <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
        {pageCount} of {dayTotal} slot{dayTotal === 1 ? "" : "s"}
      </span>
    </header>
  )
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function delayMinutes(a: Appointment): number | null {
  if (a.status !== "late") return null
  return 5 + (hashId(a.id) % 26)
}

function compactRef(a: Appointment): string {
  const v = a.reference ?? `PO-${(hashId(a.id) % 9000 + 1000).toString()}`
  return v.length > 12 ? v.slice(0, 11) + "…" : v
}

const directionMeta: Record<
  Appointment["type"],
  { Icon: typeof ArrowDownToLine; label: string; badgeClass: string }
> = {
  inbound: {
    Icon: ArrowDownToLine,
    label: "Inbound",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  outbound: {
    Icon: ArrowUpFromLine,
    label: "Outbound",
    badgeClass:
      "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  },
  "cross-dock": {
    Icon: ArrowLeftRight,
    label: "Transfer",
    badgeClass:
      "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
  },
}

const statusBadgeClass: Record<AppointmentStatus, string> = {
  confirmed:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  pending:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  late: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "checked-in":
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  loading:
    "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  completed:
    "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
  canceled:
    "bg-muted text-muted-foreground border-border line-through",
}

function cardAccentClass(s: AppointmentStatus): string {
  if (s === "late") return "border-l-rose-500"
  if (s === "pending") return "border-l-amber-500"
  return "border-l-transparent"
}

const ROW_GRID =
  "grid-cols-[72px_64px_120px_124px_minmax(0,1.2fr)_minmax(0,1.2fr)_96px_minmax(72px,1fr)_64px_72px]"

function BookingCard({
  a,
  driverName,
  setOpenId,
  openReschedule,
  handleDuplicate,
  handleCheckIn,
  copyLink,
  setCancelTarget,
  setCancelReason,
}: {
  a: Appointment
  driverName: (id: string) => string
  setOpenId: (id: string) => void
  openReschedule: (a: Appointment) => void
  handleDuplicate: (id: string) => void
  handleCheckIn: (id: string) => void
  copyLink: (id: string) => void
  setCancelTarget: (id: string | null) => void
  setCancelReason: (s: string) => void
}) {
  const dur = defaultDuration(a)
  const endMin = timeToMinutes(a.time) + dur
  const endTime = minutesToTime(endMin)
  const direction = directionMeta[a.type]
  const delay = delayMinutes(a)
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => setOpenId(a.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setOpenId(a.id)
        }
      }}
      aria-label={`${formatTimeRange(a)} ${a.carrier} ${a.status}`}
      className={cn(
        "group relative grid cursor-pointer items-center gap-2 rounded-md border-y border-r bg-card px-3 py-2",
        "border-l-4",
        cardAccentClass(a.status),
        ROW_GRID,
        "transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        a.status === "canceled" && "opacity-60",
      )}
    >
      <time
        dateTime={`${a.date}T${a.time}`}
        className="flex flex-col font-mono leading-tight tabular-nums"
      >
        <span className="text-sm font-semibold">{a.time}</span>
        <span className="text-[11px] text-muted-foreground">{endTime}</span>
      </time>

      <Badge
        variant="outline"
        className="justify-self-start font-mono text-xs tabular-nums"
      >
        {a.dockId ?? "—"}
      </Badge>

      <Badge
        variant="outline"
        className={cn(
          "h-6 justify-self-start capitalize",
          statusBadgeClass[a.status],
        )}
      >
        {a.status === "late" && <ClockAlert className="mr-1 size-3" />}
        {a.status}
      </Badge>

      <Badge
        variant="outline"
        className={cn(
          "h-6 justify-self-start gap-1",
          directionMeta[a.type].badgeClass,
        )}
      >
        <direction.Icon className="size-3" />
        {direction.label}
      </Badge>

      <div className="min-w-0 truncate text-sm font-medium">{a.carrier}</div>

      <div className="min-w-0 truncate text-sm text-muted-foreground">
        {driverName(a.driverId)}
      </div>

      <div className="min-w-0 truncate font-mono text-xs">{a.loadId}</div>

      <div className="min-w-0 truncate font-mono text-xs text-muted-foreground">
        {compactRef(a)}
      </div>

      <span
        className={cn(
          "text-right font-mono text-xs tabular-nums",
          delay != null ? "text-rose-600 dark:text-rose-400" : "text-transparent",
        )}
        aria-label={delay != null ? `${delay} minutes late` : undefined}
      >
        {delay != null ? `+${delay}m` : ""}
      </span>

      <div className="flex items-center justify-end gap-1">
        {a.status === "pending" && (
          <Button
            size="icon"
            variant="outline"
            className="hidden size-7 group-hover:inline-flex"
            onClick={(e) => {
              e.stopPropagation()
              useStore.getState().approveAppointment(a.id)
              toast.success(`${a.id} approved`)
            }}
            aria-label="Approve"
            title="Approve"
          >
            <CheckCircle2 className="size-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => e.stopPropagation()}
              aria-label="Booking actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => setOpenId(a.id)}>
              <Eye className="mr-2 size-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openReschedule(a)}
              disabled={a.status === "completed" || a.status === "canceled"}
            >
              <Pencil className="mr-2 size-4" /> Reschedule
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(a.id)}>
              <Copy className="mr-2 size-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCheckIn(a.id)}
              disabled={
                a.status === "checked-in" ||
                a.status === "loading" ||
                a.status === "completed" ||
                a.status === "canceled"
              }
            >
              <LogIn className="mr-2 size-4" /> Mark checked-in
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyLink(a.id)}>
              <Copy className="mr-2 size-4" /> Copy link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={a.status === "completed" || a.status === "canceled"}
              onClick={() => {
                setCancelTarget(a.id)
                setCancelReason("")
              }}
            >
              <X className="mr-2 size-4" /> Cancel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

function getPageItems(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const items: (number | "...")[] = [1]
  const window = 1
  const start = Math.max(2, page - window)
  const end = Math.min(totalPages - 1, page + window)
  if (start > 2) items.push("...")
  for (let i = start; i <= end; i++) items.push(i)
  if (end < totalPages - 1) items.push("...")
  items.push(totalPages)
  return items
}

function PaginationBar({
  page,
  pageSize,
  total,
  startIdx,
  endIdx,
  totalPages,
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: number
  total: number
  startIdx: number
  endIdx: number
  totalPages: number
  onPage: (n: number) => void
  onPageSize: (n: number) => void
}) {
  const atFirst = page <= 1
  const atLast = page >= totalPages
  const items = getPageItems(page, totalPages)
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t bg-muted/30 px-4 py-2.5">
      <div className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium tabular-nums text-foreground">
          {total === 0 ? 0 : startIdx + 1}
        </span>
        –
        <span className="font-medium tabular-nums text-foreground">{endIdx}</span>{" "}
        of{" "}
        <span className="font-medium tabular-nums text-foreground">{total}</span>{" "}
        bookings
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-[78px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={atFirst}
            aria-label="First page"
            onClick={() => onPage(1)}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={atFirst}
            aria-label="Previous page"
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-1 px-1">
            {items.map((it, idx) =>
              it === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex size-8 items-center justify-center text-xs text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <Button
                  key={it}
                  size="icon"
                  variant={it === page ? "default" : "outline"}
                  className="size-8 text-xs tabular-nums"
                  onClick={() => onPage(it)}
                  aria-current={it === page ? "page" : undefined}
                  aria-label={`Page ${it}`}
                >
                  {it}
                </Button>
              ),
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={atLast}
            aria-label="Next page"
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={atLast}
            aria-label="Last page"
            onClick={() => onPage(totalPages)}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function EventHover({
  appt,
  driverName,
  children,
}: {
  appt: Appointment
  driverName: (id: string) => string
  children: React.ReactNode
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{appt.carrier}</span>
              {appt.recurring && (
                <Repeat2 className="size-3 text-muted-foreground" />
              )}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {appt.id} · {appt.loadId}
            </div>
          </div>
          <Badge variant="secondary" className={`capitalize ${statusTone[appt.status]}`}>
            {appt.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <span className="text-muted-foreground">When</span>
          <span className="font-mono">{formatTimeRange(appt)}</span>
          <span className="text-muted-foreground">Date</span>
          <span>{formatLongDate(appt.date)}</span>
          <span className="text-muted-foreground">Type</span>
          <span>
            <Badge variant="outline" className={`capitalize ${typeTone[appt.type]}`}>
              {appt.type}
            </Badge>
          </span>
          <span className="text-muted-foreground">Dock</span>
          <span className="font-mono">{appt.dockId ?? "Unassigned"}</span>
          <span className="text-muted-foreground">Driver</span>
          <span>{driverName(appt.driverId)}</span>
          {appt.equipment && appt.equipment.length > 0 && (
            <>
              <span className="text-muted-foreground">Equipment</span>
              <span className="flex flex-wrap gap-1">
                {appt.equipment.map((e) => (
                  <Badge key={e} variant="secondary" className="text-[9px]">
                    {e}
                  </Badge>
                ))}
              </span>
            </>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground">
          Click for full details
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function DayView({
  iso,
  appts,
  setOpenId,
  driverName,
}: {
  iso: string
  appts: Appointment[]
  setOpenId: (id: string) => void
  driverName: (id: string) => string
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => i + HOUR_START)
  const totalHeight = hours.length * HOUR_PX
  const lanes = useMemo(() => assignLanes(appts), [appts])
  if (appts.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No appointments on{" "}
        {new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        .
      </div>
    )
  }
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[64px_1fr]">
        <div className="border-r">
          {hours.map((h) => (
            <div
              key={h}
              className="border-b px-2 text-right text-[10px] font-medium tabular-nums text-muted-foreground"
              style={{ height: HOUR_PX }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-b"
              style={{ top: i * HOUR_PX, height: HOUR_PX }}
            />
          ))}
          {lanes.map(({ appt: a, lane, lanes: total }) => {
            const startMin = timeToMinutes(a.time) - HOUR_START * 60
            const top = (startMin / 60) * HOUR_PX
            const dur = defaultDuration(a)
            const height = (dur / 60) * HOUR_PX - 4
            const widthPct = 100 / total
            const leftPct = lane * widthPct
            return (
              <EventHover key={a.id} appt={a} driverName={driverName}>
                <button
                  onClick={() => setOpenId(a.id)}
                  className={cn(
                    "group absolute overflow-hidden rounded-md border-l-4 p-2 text-left text-xs shadow-sm transition-all hover:z-10 hover:scale-[1.02] hover:shadow-lg",
                    eventTone[a.status],
                  )}
                  style={{
                    top,
                    height,
                    left: `calc(${leftPct}% + 4px)`,
                    width: `calc(${widthPct}% - 8px)`,
                  }}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="font-mono tabular-nums">
                      {formatTimeRange(a)}
                    </span>
                    {a.dockId && (
                      <Badge variant="outline" className="font-mono text-[9px]">
                        {a.dockId}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[9px] capitalize ${typeTone[a.type]}`}
                    >
                      {a.type}
                    </Badge>
                    <span className="truncate font-medium">{a.carrier}</span>
                  </div>
                  {height > 60 && (
                    <div className="mt-1 truncate text-[10px] text-muted-foreground">
                      {a.id} · {driverName(a.driverId)}
                    </div>
                  )}
                </button>
              </EventHover>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function WeekView({
  days,
  setOpenId,
  driverName,
  setSelectedDate,
}: {
  days: {
    iso: string
    date: Date
    label: string
    num: number
    today: boolean
    appts: Appointment[]
  }[]
  setOpenId: (id: string) => void
  driverName: (id: string) => string
  setSelectedDate: (iso: string) => void
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => i + HOUR_START)
  const totalHeight = hours.length * HOUR_PX
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px] rounded-md border">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b bg-muted/30">
          <div />
          {days.map((d) => (
            <button
              key={d.iso}
              onClick={() => setSelectedDate(d.iso)}
              className={cn(
                "border-l px-3 py-2 text-left transition-colors hover:bg-muted/50",
                d.today && "bg-primary/5",
              )}
            >
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {d.label}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  d.today && "text-primary",
                )}
              >
                {d.num}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {d.appts.length} slots
              </div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[64px_repeat(7,1fr)]">
          <div className="border-r">
            {hours.map((h) => (
              <div
                key={h}
                className="border-b px-2 text-right text-[10px] font-medium tabular-nums text-muted-foreground"
                style={{ height: HOUR_PX }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((d) => (
            <WeekDayCol
              key={d.iso}
              day={d}
              hours={hours}
              totalHeight={totalHeight}
              setOpenId={setOpenId}
              driverName={driverName}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function WeekDayCol({
  day,
  hours,
  totalHeight,
  setOpenId,
  driverName,
}: {
  day: {
    iso: string
    today: boolean
    appts: Appointment[]
  }
  hours: number[]
  totalHeight: number
  setOpenId: (id: string) => void
  driverName: (id: string) => string
}) {
  const lanes = useMemo(() => assignLanes(day.appts), [day.appts])
  return (
    <div
      className={cn("relative border-l", day.today && "bg-primary/[0.02]")}
      style={{ height: totalHeight }}
    >
      {hours.map((h, i) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-b"
          style={{ top: i * HOUR_PX, height: HOUR_PX }}
        />
      ))}
      {lanes.map(({ appt: a, lane, lanes: total }) => {
        const startMin = timeToMinutes(a.time) - HOUR_START * 60
        const top = Math.max(0, (startMin / 60) * HOUR_PX)
        const dur = defaultDuration(a)
        const height = (dur / 60) * HOUR_PX - 2
        const widthPct = 100 / total
        const leftPct = lane * widthPct
        return (
          <EventHover key={a.id} appt={a} driverName={driverName}>
            <button
              onClick={() => setOpenId(a.id)}
              className={cn(
                "group absolute overflow-hidden rounded-md border-l-4 p-1.5 text-left text-[11px] shadow-sm transition-all hover:z-10 hover:scale-[1.02] hover:shadow-lg",
                eventTone[a.status],
              )}
              style={{
                top,
                height,
                left: `calc(${leftPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
              }}
            >
              <div className="flex items-center gap-1 font-semibold">
                <span className="font-mono tabular-nums">{a.time}</span>
                {a.dockId && (
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {a.dockId}
                  </span>
                )}
              </div>
              <div className="truncate">{a.carrier}</div>
              {height > 40 && (
                <div className="mt-0.5 flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className={`text-[8px] capitalize ${typeTone[a.type]}`}
                  >
                    {a.type}
                  </Badge>
                </div>
              )}
            </button>
          </EventHover>
        )
      })}
    </div>
  )
}

function MonthView({
  cells,
  setOpenId,
  setSelectedDate,
}: {
  cells: {
    iso: string
    date: Date
    sameMonth: boolean
    today: boolean
    appts: Appointment[]
  }[]
  setOpenId: (id: string) => void
  setSelectedDate: (iso: string) => void
}) {
  const headers = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {headers.map((h) => (
          <div
            key={h}
            className="px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c) => (
          <button
            key={c.iso}
            onClick={() => setSelectedDate(c.iso)}
            className={cn(
              "min-h-[110px] border-b border-r p-1.5 text-left transition-colors hover:bg-muted/30",
              !c.sameMonth && "bg-muted/20 text-muted-foreground",
              c.today && "bg-primary/5 ring-1 ring-inset ring-primary/30",
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  c.today && "text-primary",
                )}
              >
                {c.date.getDate()}
              </span>
              {c.appts.length > 0 && (
                <span className="text-[9px] text-muted-foreground">
                  {c.appts.length}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {c.appts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenId(a.id)
                  }}
                  className={cn(
                    "truncate rounded border-l-2 px-1 py-0.5 text-[10px]",
                    eventTone[a.status],
                  )}
                >
                  <span className="font-mono tabular-nums">{a.time}</span>{" "}
                  {a.carrier}
                </div>
              ))}
              {c.appts.length > 3 && (
                <div className="text-[9px] text-muted-foreground">
                  +{c.appts.length - 3} more
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const lifecycle: { key: AppointmentStatus | "loaded"; label: string }[] = [
  { key: "pending", label: "Requested" },
  { key: "confirmed", label: "Confirmed" },
  { key: "checked-in", label: "Checked in" },
  { key: "loading", label: "Loading" },
  { key: "loaded", label: "Loaded" },
  { key: "completed", label: "Released" },
]

function lifecycleIndex(status: AppointmentStatus): number {
  switch (status) {
    case "pending": return 0
    case "confirmed": return 1
    case "checked-in": return 2
    case "loading": return 3
    case "completed": return 5
    case "late": return 1
    case "canceled": return -1
  }
}

type Driver = ReturnType<typeof useStore.getState>["drivers"][number]
type Facility = ReturnType<typeof useStore.getState>["facilities"][number]
type Dock = ReturnType<typeof useStore.getState>["docks"][number]
type Load = ReturnType<typeof useStore.getState>["loads"][number]

function DetailSheet({
  open,
  onClose,
  drivers,
  facilities,
  docks,
  loads,
  openReschedule,
  handleDuplicate,
  handleCheckIn,
  copyLink,
  setCancelTarget,
  setCancelReason,
}: {
  open: Appointment | null | undefined
  onClose: () => void
  drivers: Driver[]
  facilities: Facility[]
  docks: Dock[]
  loads: Load[]
  openReschedule: (a: Appointment) => void
  handleDuplicate: (id: string) => void
  handleCheckIn: (id: string) => void
  copyLink: (id: string) => void
  setCancelTarget: (id: string | null) => void
  setCancelReason: (s: string) => void
}) {
  const driver = open ? drivers.find((d) => d.id === open.driverId) : null
  const dock = open?.dockId ? docks.find((d) => d.id === open.dockId) : null
  const load = open ? loads.find((l) => l.id === open.loadId) : null
  const facility = open?.facilityId
    ? facilities.find((f) => f.id === open.facilityId)
    : facilities[0]
  const canCheckIn =
    open &&
    open.status !== "checked-in" &&
    open.status !== "loading" &&
    open.status !== "completed" &&
    open.status !== "canceled"
  const canReschedule = open && open.status !== "completed" && open.status !== "canceled"
  const canCancel = canReschedule
  return (
    <Sheet
      open={open != null}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      {open != null && (
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
            <SheetHeader className="space-y-3 border-b px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="font-mono text-lg">
                      {open.id}
                    </SheetTitle>
                    <Badge variant="secondary" className={`capitalize ${statusTone[open.status]}`}>
                      {open.status === "late" && <ClockAlert className="mr-1 size-3" />}
                      {open.status}
                    </Badge>
                    <Badge variant="outline" className={`capitalize ${typeTone[open.type]}`}>
                      {open.type}
                    </Badge>
                    {open.recurring && (
                      <Badge variant="outline" className="text-[10px]">
                        <Repeat2 className="mr-1 size-3" />{" "}
                        {open.recurring.frequency}
                      </Badge>
                    )}
                  </div>
                  <SheetDescription>
                    {open.carrier} · {formatLongDate(open.date)} ·{" "}
                    <span className="font-mono">{formatTimeRange(open)}</span>
                    {dock && <> · Dock {dock.id}</>}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canReschedule}
                  onClick={() => openReschedule(open)}
                >
                  <Pencil className="mr-1 size-3.5" /> Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canCheckIn}
                  onClick={() => handleCheckIn(open.id)}
                >
                  <LogIn className="mr-1 size-3.5" /> Check-in
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicate(open.id)}
                >
                  <Copy className="mr-1 size-3.5" /> Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyLink(open.id)}
                >
                  <Copy className="mr-1 size-3.5" /> Copy link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                  disabled={!canCancel}
                  onClick={() => {
                    setCancelTarget(open.id)
                    setCancelReason("")
                  }}
                >
                  <X className="mr-1 size-3.5" /> Cancel
                </Button>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b px-6">
                <TabsList className="h-10 bg-transparent p-0">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">Overview</TabsTrigger>
                  <TabsTrigger value="lifecycle" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">Lifecycle</TabsTrigger>
                  <TabsTrigger value="audit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">History</TabsTrigger>
                  <TabsTrigger value="docs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">Docs & comms</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6 py-4">
                <TabsContent value="overview" className="m-0 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoCard icon={CalendarIcon} title="Schedule">
                      <KV label="Date" value={formatLongDate(open.date)} />
                      <KV label="Time" value={
                        <span className="font-mono">{formatTimeRange(open)}</span>
                      } />
                      <KV label="Duration" value={`${defaultDuration(open)} min`} />
                      <KV label="Timezone" value={TIMEZONE} />
                      {open.recurring && (
                        <KV
                          label="Recurring"
                          value={`${open.recurring.frequency} until ${open.recurring.until ?? "—"}`}
                        />
                      )}
                    </InfoCard>

                    <InfoCard icon={Truck} title="Carrier & driver">
                      <KV label="Carrier" value={open.carrier} />
                      <KV label="Driver" value={driver?.name ?? "—"} />
                      <KV
                        label="License"
                        value={driver?.license ? <span className="font-mono text-xs">{driver.license}</span> : "—"}
                      />
                      <KV
                        label="Status"
                        value={driver?.status ?? "—"}
                      />
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        <Phone className="mr-1.5 size-3.5" /> Contact driver
                      </Button>
                    </InfoCard>

                    <InfoCard icon={Building2} title="Facility & dock">
                      <KV label="Facility" value={facility?.name ?? "—"} />
                      <KV
                        label="Location"
                        value={
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" />
                            {facility?.city ?? "—"}
                          </span>
                        }
                      />
                      <KV
                        label="Dock"
                        value={
                          dock ? (
                            <span className="font-mono">{dock.id}</span>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )
                        }
                      />
                      {dock && (
                        <KV
                          label="Capabilities"
                          value={
                            <div className="flex flex-wrap justify-end gap-1">
                              {dock.capabilities?.map((c) => (
                                <Badge key={c} variant="secondary" className="text-[9px]">
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          }
                        />
                      )}
                    </InfoCard>

                    <InfoCard icon={FileText} title="Load">
                      <KV label="Load ID" value={<span className="font-mono text-xs">{open.loadId}</span>} />
                      {load && (
                        <>
                          <KV label="Origin" value={load.origin} />
                          <KV label="Destination" value={load.destination} />
                          <KV label="Weight" value={`${load.weight.toLocaleString()} lb`} />
                          <KV label="Pieces" value={String(load.pieces)} />
                        </>
                      )}
                      {open.reference && (
                        <KV
                          label="Reference"
                          value={<span className="font-mono text-xs">{open.reference}</span>}
                        />
                      )}
                    </InfoCard>
                  </div>

                  {open.equipment && open.equipment.length > 0 && (
                    <InfoCard icon={Truck} title="Equipment">
                      <div className="flex flex-wrap gap-1.5">
                        {open.equipment.map((e) => (
                          <Badge key={e} variant="secondary">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </InfoCard>
                  )}

                  {open.notes && (
                    <InfoCard icon={MessageSquare} title="Notes for warehouse team">
                      <p className="text-sm text-muted-foreground">{open.notes}</p>
                    </InfoCard>
                  )}
                </TabsContent>

                <TabsContent value="lifecycle" className="m-0">
                  <div className="space-y-3">
                    {lifecycle.map((step, i) => {
                      const currentIdx = lifecycleIndex(open.status)
                      const reached = i <= currentIdx
                      const active = i === currentIdx
                      return (
                        <div key={step.key} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                                reached
                                  ? active
                                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                    : "bg-primary/15 text-primary"
                                  : "border bg-muted text-muted-foreground"
                              }`}
                            >
                              {reached ? "✓" : i + 1}
                            </div>
                            {i < lifecycle.length - 1 && (
                              <div
                                className={`mt-1 h-8 w-px ${reached ? "bg-primary/40" : "bg-border"}`}
                              />
                            )}
                          </div>
                          <div className="flex-1 pb-3">
                            <div className={`text-sm font-medium ${active ? "" : reached ? "" : "text-muted-foreground"}`}>
                              {step.label}
                            </div>
                            {active && (
                              <div className="text-xs text-muted-foreground">
                                In progress
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="audit" className="m-0">
                  <div className="space-y-3">
                    {open.audit.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No history events.
                      </div>
                    ) : (
                      open.audit.map((e) => (
                        <div key={e.id} className="rounded-lg border bg-card p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm">
                              <span className="font-medium">{e.actor}</span>{" "}
                              <span className="text-muted-foreground">{e.action}</span>
                            </div>
                            <span className="shrink-0 text-[11px] text-muted-foreground">{e.time}</span>
                          </div>
                          {e.detail && (
                            <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>
                          )}
                          {e.source && (
                            <Badge
                              variant="outline"
                              className="mt-2 font-mono text-[9px] uppercase"
                            >
                              {e.source}
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="docs" className="m-0">
                  <div className="space-y-3">
                    <InfoCard icon={FileText} title="Documents">
                      <div className="space-y-2">
                        <DocRow name={`BOL_${open.loadId}.pdf`} kind="BOL" status="pending" />
                        <DocRow name={`Manifest_${open.loadId}.pdf`} kind="Manifest" status="pending" />
                        <DocRow name={`Seal_${open.loadId}.jpg`} kind="Seal" status="pending" />
                      </div>
                    </InfoCard>
                    <InfoCard icon={MessageSquare} title="Communication">
                      <div className="space-y-2 text-sm">
                        <div className="rounded-md border bg-card p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{open.carrier} dispatch</span>
                            <span className="text-[11px] text-muted-foreground">2h ago</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Booking confirmation sent via carrier portal.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <MessageSquare className="mr-1.5 size-3.5" /> Message carrier
                        </Button>
                      </div>
                    </InfoCard>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
        </SheetContent>
      )}
    </Sheet>
  )
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-2 p-3 text-sm">{children}</div>
    </div>
  )
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  )
}

function DocRow({
  name,
  kind,
  status,
}: {
  name: string
  kind: string
  status: "pending" | "verified" | "failed"
}) {
  const tone =
    status === "verified"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : status === "failed"
      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5">
      <div className="flex items-center gap-2">
        <FileText className="size-3.5 text-muted-foreground" />
        <span className="text-xs">{name}</span>
        <Badge variant="outline" className="text-[9px]">
          {kind}
        </Badge>
      </div>
      <Badge variant="secondary" className={`text-[10px] capitalize ${tone}`}>
        {status}
      </Badge>
    </div>
  )
}

