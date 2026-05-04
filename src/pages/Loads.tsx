import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertOctagon,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  Package,
  PauseCircle,
  Search,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { useShallow } from "zustand/react/shallow"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import { AssignDockDialog } from "@/components/dialogs/assign-dock-dialog"
import { useStore, type LoadStatus, type LoadPriority } from "@/store"

const statusTone: Record<LoadStatus, string> = {
  loading: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  unloading: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "in-transit": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  delayed: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  scheduled: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  draft: "bg-muted text-muted-foreground",
  delivered: "bg-muted text-muted-foreground",
  "awaiting-paperwork": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
}

const priorityTone: Record<LoadPriority, string> = {
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  med: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
}

const filterMap = {
  all: () => true,
  active: (s: LoadStatus) => s === "loading" || s === "unloading",
  scheduled: (s: LoadStatus) => s === "scheduled",
  paperwork: (s: LoadStatus) => s === "awaiting-paperwork",
  delivered: (s: LoadStatus) => s === "delivered" || s === "in-transit",
  exceptions: (s: LoadStatus) => s === "delayed",
} as const

const loaderTone: Record<string, string> = {
  loading: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  break: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  covering: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
}

export default function Loads() {
  const navigate = useNavigate()
  const loads = useStore((s) => s.loads)
  const drivers = useStore((s) => s.drivers)
  const documents = useStore((s) => s.documents)
  const shift = useStore((s) => s.shift)
  const loaders = useStore(useShallow((s) => s.loaders))
  const generate = useStore((s) => s.generateDocument)
  const setPriority = useStore((s) => s.setLoadPriority)
  const completeLoad = useStore((s) => s.completeLoad)
  const advanceProgress = useStore((s) => s.advanceLoadProgress)

  const [filter, setFilter] = useState<keyof typeof filterMap>("active")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)

  const counts = {
    all: loads.length,
    active: loads.filter((l) => filterMap.active(l.status)).length,
    scheduled: loads.filter((l) => filterMap.scheduled(l.status)).length,
    paperwork: loads.filter((l) => filterMap.paperwork(l.status)).length,
    delivered: loads.filter((l) => filterMap.delivered(l.status)).length,
    exceptions: loads.filter((l) => filterMap.exceptions(l.status)).length,
  }

  const activeLoads = useMemo(
    () => loads.filter((l) => filterMap.active(l.status)),
    [loads],
  )
  const filtered = useMemo(() => {
    return loads
      .filter((l) => filterMap[filter](l.status))
      .filter((l) => {
        if (!query) return true
        const q = query.toLowerCase()
        return (
          l.id.toLowerCase().includes(q) ||
          l.origin.toLowerCase().includes(q) ||
          l.destination.toLowerCase().includes(q) ||
          l.carrier.toLowerCase().includes(q)
        )
      })
  }, [loads, filter, query])

  const driverName = (id?: string) => drivers.find((d) => d.id === id)?.name ?? "—"
  const open = openId ? loads.find((l) => l.id === openId) : null
  const openDocs = open ? documents.filter((d) => d.loadId === open.id) : []

  const handleGenerateBol = (loadId: string) => {
    generate({ kind: "BOL", loadId })
    toast.success("BOL generated", { description: `Signature requested for ${loadId}` })
  }

  const stats = [
    {
      label: "Active loads",
      value: String(activeLoads.length),
      icon: Package,
    },
    {
      label: "Pallets moved",
      value: String(shift.palletsMoved),
      icon: Package,
      sub: "▲38 vs same time yesterday",
      tone: "text-emerald-600",
    },
    {
      label: "Avg load time",
      value: "47m",
      icon: Clock,
      sub: "target 50m",
    },
    {
      label: "Loaders on shift",
      value: `${loaders.filter((l) => l.status !== "break").length} / ${loaders.length}`,
      icon: Users,
    },
    {
      label: "Backlog",
      value: String(counts.scheduled),
      icon: PauseCircle,
      tone: counts.scheduled > 5 ? "text-amber-600" : "",
    },
  ]

  const remaining = (() => {
    const [eh, em] = shift.endTime.split(":").map(Number)
    const now = new Date()
    const end = new Date()
    end.setHours(eh, em, 0, 0)
    const diffMs = end.getTime() - now.getTime()
    if (diffMs <= 0) return "ended"
    const h = Math.floor(diffMs / 3600000)
    const m = Math.floor((diffMs % 3600000) / 60000)
    return `${h}h ${m.toString().padStart(2, "0")}m`
  })()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loads"
        description="BOL, manifests, cargo, seals."
      />

      <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{shift.name} shift</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {shift.startTime} – {shift.endTime}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Supervisor {shift.supervisor} · {remaining} remaining
              </div>
            </div>
          </div>
          <Separator orientation="vertical" className="hidden h-10 sm:block" />
          <div className="flex items-center gap-6 text-xs">
            <Stat label="Loads completed" value={String(shift.loadsCompleted)} />
            <Stat label="Pallets moved" value={String(shift.palletsMoved)} />
            <Stat label="Crew" value={String(shift.crewSize)} />
            <Stat
              label="Issues"
              value={String(shift.issues)}
              tone={shift.issues > 0 ? "text-rose-600" : ""}
            />
          </div>
          <div className="ml-auto flex -space-x-2">
            {loaders.slice(0, 5).map((l) => (
              <Avatar key={l.id} className="size-7 border-2 border-background">
                <AvatarFallback className="bg-muted text-[10px]">
                  {l.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            ))}
            {loaders.length > 5 && (
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +{loaders.length - 5}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              <div className={`text-2xl font-semibold tabular-nums ${s.tone ?? ""}`}>
                {s.value}
              </div>
              {s.sub && <div className="text-[11px] text-muted-foreground">{s.sub}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active loads</CardTitle>
              <CardDescription>
                {activeLoads.length} in progress · live progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeLoads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No active loads.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLoads.map((l) => {
                    const pct = l.palletsTotal
                      ? Math.round(((l.palletsDone ?? 0) / l.palletsTotal) * 100)
                      : 0
                    const isOverrun = l.status === "delayed"
                    return (
                      <button
                        key={l.id}
                        onClick={() => setOpenId(l.id)}
                        className={`w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/30 ${
                          isOverrun ? "border-l-4 border-l-rose-500" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {l.priority === "high" && <Flame className="size-4 text-rose-600" />}
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {l.dockId ?? "—"}
                              </Badge>
                              <span className="font-medium">{l.carrier}</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {l.id}
                              </span>
                              <Badge variant="secondary" className={`capitalize ${statusTone[l.status]}`}>
                                {l.status}
                              </Badge>
                              {l.priority && (
                                <Badge variant="secondary" className={`capitalize ${priorityTone[l.priority]}`}>
                                  {l.priority}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Loader {l.loaderName ?? "—"} · started {l.startedAt ?? "—"} ·{" "}
                              {driverName(l.driverId)}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {l.palletsDone ?? 0} / {l.palletsTotal ?? 0} pallets
                              </span>
                              <span className="font-medium">{pct}%</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <CardTitle>All loads</CardTitle>
                <CardDescription>Filter and search</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search load #, origin, dest…"
                  className="h-9 pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as keyof typeof filterMap)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All · {counts.all}</TabsTrigger>
                  <TabsTrigger value="active">Active · {counts.active}</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled · {counts.scheduled}</TabsTrigger>
                  <TabsTrigger value="paperwork">Paperwork · {counts.paperwork}</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered · {counts.delivered}</TabsTrigger>
                  <TabsTrigger value="exceptions">Exceptions · {counts.exceptions}</TabsTrigger>
                </TabsList>
              </Tabs>

              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No loads match.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead>
                      <TableHead>Lane</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="text-right">Pieces</TableHead>
                      <TableHead>Seal</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow
                        key={l.id}
                        className="cursor-pointer"
                        onClick={() => setOpenId(l.id)}
                      >
                        <TableCell className="font-mono text-xs">{l.id}</TableCell>
                        <TableCell className="text-sm">
                          {l.origin} → {l.destination}
                        </TableCell>
                        <TableCell className="text-sm">{driverName(l.driverId)}</TableCell>
                        <TableCell className="text-right">{l.pieces}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {l.seal ?? "—"}
                        </TableCell>
                        <TableCell>
                          {l.priority ? (
                            <Badge variant="secondary" className={`capitalize ${priorityTone[l.priority]}`}>
                              {l.priority}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`capitalize ${statusTone[l.status]}`}>
                            {l.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loader roster</CardTitle>
            <CardDescription>{shift.name} shift · {loaders.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px]">
              <div className="divide-y">
                {loaders.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-muted text-xs">
                        {l.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{l.name}</span>
                        {l.isMe && (
                          <Badge variant="outline" className="text-[9px]">you</Badge>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {l.task ?? "Idle"}
                      </div>
                    </div>
                    <Badge variant="secondary" className={`capitalize ${loaderTone[l.status]}`}>
                      {l.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-mono">
                  {open.id}
                  <Badge variant="secondary" className={`capitalize ${statusTone[open.status]}`}>
                    {open.status}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  {open.origin} → {open.destination}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100svh-160px)]">
                <div className="space-y-5 px-4 py-4 text-sm">
                  <Field label="Carrier" value={open.carrier} />
                  <Field label="Driver" value={driverName(open.driverId)} />
                  <Field label="Dock" value={open.dockId ?? "—"} />
                  <Field label="Loader" value={open.loaderName ?? "—"} />
                  <Field label="Started" value={open.startedAt ?? "—"} />
                  <Field label="Weight" value={`${open.weight.toLocaleString()} lb`} />
                  <Field label="Pieces" value={open.pieces} />
                  <Field label="Seal" value={open.seal ?? "—"} mono />

                  {open.palletsTotal !== undefined && (
                    <>
                      <Separator />
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Pallets</span>
                          <span className="font-medium">
                            {open.palletsDone ?? 0} / {open.palletsTotal}
                          </span>
                        </div>
                        <Progress
                          value={
                            open.palletsTotal
                              ? Math.round(((open.palletsDone ?? 0) / open.palletsTotal) * 100)
                              : 0
                          }
                          className="h-2"
                        />
                        <div className="mt-3 grid grid-cols-8 gap-1">
                          {Array.from({ length: open.palletsTotal }).map((_, i) => {
                            const done = (open.palletsDone ?? 0) > i
                            const active = (open.palletsDone ?? 0) === i
                            return (
                              <div
                                key={i}
                                className={`flex aspect-square items-center justify-center rounded text-[9px] font-mono ${
                                  done
                                    ? "bg-primary text-primary-foreground"
                                    : active
                                    ? "border-2 border-primary bg-primary/10 text-primary"
                                    : "border bg-muted/30 text-muted-foreground"
                                }`}
                              >
                                {i + 1}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Priority
                    </Label>
                    <div className="flex gap-1">
                      {(["high", "med", "low"] as const).map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant={open.priority === p ? "default" : "outline"}
                          onClick={() => {
                            setPriority(open.id, p)
                            toast.success(`Priority set to ${p}`)
                          }}
                          className="flex-1 capitalize"
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Documents
                    </Label>
                    {openDocs.length === 0 ? (
                      <div className="text-xs text-muted-foreground">None yet.</div>
                    ) : (
                      <div className="space-y-1">
                        {openDocs.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between rounded-md border p-2 text-xs"
                          >
                            <span className="font-mono">{d.name}</span>
                            <Badge variant="outline" className="capitalize">
                              {d.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    {!open.bolGenerated && (
                      <Button onClick={() => handleGenerateBol(open.id)}>
                        <FileText className="mr-1.5 size-4" /> Generate BOL
                      </Button>
                    )}
                    {open.status === "loading" || open.status === "unloading" ? (
                      <>
                        {open.palletsTotal !== undefined &&
                          (open.palletsDone ?? 0) < open.palletsTotal && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                advanceProgress(open.id, (open.palletsDone ?? 0) + 1)
                                toast.success("Pallet logged")
                              }}
                            >
                              Log next pallet
                            </Button>
                          )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            completeLoad(open.id)
                            setOpenId(null)
                          }}
                        >
                          Mark complete
                        </Button>
                      </>
                    ) : null}
                    {!open.dockId && open.status === "scheduled" && (
                      <AssignDockDialog
                        loadId={open.id}
                        trigger={<Button variant="outline">Assign dock</Button>}
                      />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <AlertOctagon className="mr-1.5 size-4" /> Flag issue
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Issue type</DropdownMenuLabel>
                        {[
                          "Pallet damage",
                          "Pallet shortage",
                          "Equipment failure",
                          "Loading overrun",
                        ].map((t) => (
                          <DropdownMenuItem
                            key={t}
                            onClick={() => toast.warning(`Issue: ${t}`)}
                          >
                            {t}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setOpenId(null)
                        navigate("/operations/dock")
                      }}
                    >
                      Open dock board
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${tone ?? ""}`}>{value}</div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "text-sm"}>{value}</span>
    </div>
  )
}
