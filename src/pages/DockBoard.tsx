import { useMemo, useState } from "react"
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Flame,
  RefreshCw,
  Truck,
  Wand2,
  Wrench,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useShallow } from "zustand/react/shallow"
import { PageHeader } from "@/components/page-header"
import { AssignDockDialog } from "@/components/dialogs/assign-dock-dialog"
import { useStore, type DockStatus, type DockCapability } from "@/store"

const tone: Record<DockStatus, { card: string; badge: string; dot: string }> = {
  free: {
    card: "border-dashed bg-muted/20",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  loading: {
    card: "border-amber-500/30 bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  unloading: {
    card: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  blocked: {
    card: "border-rose-500/30 bg-rose-500/5",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  reserved: {
    card: "border-violet-500/30 bg-violet-500/5",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
}

const capLabel: Record<DockCapability, string> = {
  reefer: "Reefer",
  hazmat: "Hazmat",
  leveler: "Leveler",
  food: "Food grade",
  oversize: "Oversize",
  liftgate: "Liftgate",
}

const priorityTone = {
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  med: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
} as const

export default function DockBoard() {
  const docks = useStore((s) => s.docks)
  const loads = useStore((s) => s.loads)
  const drivers = useStore((s) => s.drivers)
  const free = useStore((s) => s.freeDock)
  const block = useStore((s) => s.blockDock)
  const assign = useStore((s) => s.assignDock)
  const queue = useStore(
    useShallow((s) => s.loads.filter((l) => l.status === "scheduled" && !l.dockId)),
  )
  const [filter, setFilter] = useState<DockStatus | "all">("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const [view, setView] = useState<"live" | "schedule" | "yard">("live")

  const filtered = useMemo(
    () => (filter === "all" ? docks : docks.filter((d) => d.status === filter)),
    [docks, filter],
  )

  const counts = {
    all: docks.length,
    loading: docks.filter((d) => d.status === "loading").length,
    unloading: docks.filter((d) => d.status === "unloading").length,
    free: docks.filter((d) => d.status === "free").length,
    blocked: docks.filter((d) => d.status === "blocked").length,
    reserved: docks.filter((d) => d.status === "reserved").length,
  }

  const active = counts.loading + counts.unloading

  const stats = [
    { label: "Total docks", value: String(counts.all), icon: Truck },
    { label: "Active now", value: String(active), tone: "text-emerald-600", icon: CheckCircle2 },
    { label: "Available", value: String(counts.free), icon: Truck },
    { label: "In queue", value: String(queue.length), tone: queue.length > 3 ? "text-amber-600" : "", icon: Clock },
    { label: "SLA risk", value: String(loads.filter((l) => l.status === "delayed").length), tone: "text-rose-600", icon: AlertOctagon },
  ]

  const loadById = (id?: string) => loads.find((l) => l.id === id)
  const driverName = (id?: string) => drivers.find((d) => d.id === id)?.name ?? "—"

  const autoAssign = () => {
    const freeDocks = docks.filter((d) => d.status === "free")
    let assigned = 0
    for (let i = 0; i < Math.min(freeDocks.length, queue.length); i++) {
      assign(queue[i].id, freeDocks[i].id)
      assigned += 1
    }
    if (assigned === 0) {
      toast.info("Nothing to auto-assign")
    } else {
      toast.success(`Auto-assigned ${assigned} load${assigned === 1 ? "" : "s"}`)
    }
  }

  const open = openId ? docks.find((d) => d.id === openId) : null
  const openLoad = open ? loadById(open.loadId) : null

  // Schedule view: 12-hour Gantt-lite
  const hours = Array.from({ length: 12 }, (_, i) => `${(i + 6).toString().padStart(2, "0")}:00`)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dock Board"
        description="Live state of all doors · North Hub."
        actions={
          <>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-1.5 size-4" /> Auto-refresh 30s
            </Button>
            <Button size="sm" onClick={autoAssign}>
              <Wand2 className="mr-1.5 size-4" /> Auto-assign all
            </Button>
          </>
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
              <div className={`text-2xl font-semibold tabular-nums ${s.tone ?? ""}`}>
                {s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="live">Live board</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="yard">Yard & queue · {queue.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-6 space-y-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">All · {counts.all}</TabsTrigger>
              <TabsTrigger value="loading">Loading · {counts.loading}</TabsTrigger>
              <TabsTrigger value="unloading">Unloading · {counts.unloading}</TabsTrigger>
              <TabsTrigger value="free">Free · {counts.free}</TabsTrigger>
              <TabsTrigger value="reserved">Reserved · {counts.reserved}</TabsTrigger>
              <TabsTrigger value="blocked">Blocked · {counts.blocked}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((d) => {
              const load = loadById(d.loadId)
              const t = tone[d.status]
              return (
                <Card
                  key={d.id}
                  className={`${t.card} cursor-pointer transition-all hover:shadow-sm`}
                  onClick={() => setOpenId(d.id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="size-4 text-muted-foreground" />
                        {d.id}
                      </CardTitle>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {d.direction}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant="secondary"
                          className={`cursor-pointer capitalize ${t.badge}`}
                        >
                          <span className={`mr-1 size-1.5 rounded-full ${t.dot}`} />
                          {d.status}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {d.status === "free" && queue.length > 0 && (
                          <DropdownMenuItem
                            onClick={() => {
                              assign(queue[0].id, d.id)
                              toast.success(`${queue[0].id} → ${d.id}`)
                            }}
                          >
                            Assign next ({queue[0].id})
                          </DropdownMenuItem>
                        )}
                        {d.status !== "free" && d.status !== "blocked" && (
                          <DropdownMenuItem
                            onClick={() => {
                              free(d.id)
                              toast.success(`${d.id} freed`)
                            }}
                          >
                            Mark free
                          </DropdownMenuItem>
                        )}
                        {d.status !== "blocked" && (
                          <DropdownMenuItem
                            onClick={() => {
                              block(d.id, "Maintenance")
                              toast.success(`${d.id} blocked`)
                            }}
                          >
                            Block
                          </DropdownMenuItem>
                        )}
                        {d.status === "blocked" && (
                          <DropdownMenuItem
                            onClick={() => {
                              free(d.id)
                              toast.success(`${d.id} reopened`)
                            }}
                          >
                            Reopen
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setOpenId(d.id)}>
                          View details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    {d.capabilities.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {d.capabilities.map((c) => (
                          <Badge key={c} variant="outline" className="text-[9px] uppercase">
                            {capLabel[c]}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {d.status === "free" ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        Available
                      </div>
                    ) : d.status === "blocked" ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                        <Wrench className="size-4" /> {d.blockReason ?? "Maintenance"}
                      </div>
                    ) : d.status === "reserved" ? (
                      <div className="py-4 text-sm text-muted-foreground">{d.since}</div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div>
                          <div className="font-mono text-xs text-muted-foreground">{d.loadId}</div>
                          <div className="font-medium">{driverName(load?.driverId)}</div>
                          <div className="text-xs text-muted-foreground">{load?.carrier}</div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {d.palletsDone ?? 0} / {d.palletsTotal ?? 0} pallets
                          </span>
                          <span className="font-medium">{d.progress ?? 0}%</span>
                        </div>
                        <Progress value={d.progress ?? 0} className="h-1.5" />
                        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> Since {d.since}
                          </span>
                          {d.etaFinish && <span>ETA {d.etaFinish}</span>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's schedule</CardTitle>
              <CardDescription>06:00 – 18:00 · per door</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[100px_repeat(12,1fr)] border-b text-xs text-muted-foreground">
                    <div className="p-2"></div>
                    {hours.map((h) => (
                      <div key={h} className="border-l p-2 text-center font-mono">
                        {h}
                      </div>
                    ))}
                  </div>
                  {docks.map((d) => {
                    const tDock = tone[d.status]
                    let blockStart = 0
                    let blockSpan = 0
                    if (d.status !== "free" && d.since) {
                      const sinceHour = parseInt(d.since.split(":")[0] || "10", 10)
                      blockStart = Math.max(0, sinceHour - 6)
                      blockSpan = 2
                    }
                    return (
                      <div
                        key={d.id}
                        className="grid grid-cols-[100px_repeat(12,1fr)] border-b text-xs"
                      >
                        <div className="flex flex-col justify-center p-2">
                          <span className="font-mono font-medium">{d.id}</span>
                          <span className="text-[9px] uppercase text-muted-foreground">
                            {d.direction}
                          </span>
                        </div>
                        {hours.map((h, i) => {
                          const inBlock = i >= blockStart && i < blockStart + blockSpan
                          return (
                            <div key={h} className="relative h-12 border-l">
                              {inBlock && i === blockStart && (
                                <div
                                  className={`absolute inset-1 flex items-center justify-center rounded-md text-[10px] font-medium ${tDock.badge}`}
                                  style={{ width: `calc(${blockSpan} * 100% - 8px)` }}
                                >
                                  {d.loadId ?? d.status}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yard" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inbound queue · {queue.length}</CardTitle>
              <CardDescription>Drivers waiting in yard for dock assignment</CardDescription>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Queue empty.
                </div>
              ) : (
                <div className="divide-y">
                  {queue.map((l) => (
                    <div
                      key={l.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        {l.priority === "high" && <Flame className="size-4 text-rose-600" />}
                        <div>
                          <div className="text-sm">
                            <span className="font-mono">{l.id}</span> ·{" "}
                            <span className="font-medium">{l.carrier}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {l.origin} → {l.destination} · {driverName(l.driverId)}
                          </div>
                        </div>
                      </div>
                      {l.priority && (
                        <Badge
                          variant="secondary"
                          className={`capitalize ${priorityTone[l.priority]}`}
                        >
                          {l.priority}
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">{l.status}</Badge>
                      <AssignDockDialog loadId={l.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-mono">
                  {open.id}
                  <Badge variant="secondary" className={`capitalize ${tone[open.status].badge}`}>
                    {open.status}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="capitalize">
                  {open.direction} dock
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4 px-4 text-sm">
                {open.capabilities.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-xs text-muted-foreground">Capabilities</div>
                    <div className="flex flex-wrap gap-1">
                      {open.capabilities.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px]">
                          {capLabel[c]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {open.status === "free" ? (
                  <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                    Door is free. Assign a load from the queue.
                  </div>
                ) : open.status === "blocked" ? (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 text-sm">
                    <div className="flex items-center gap-2 font-medium text-rose-600">
                      <Wrench className="size-4" /> Maintenance
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {open.blockReason ?? "Blocked"}
                    </p>
                  </div>
                ) : open.status === "reserved" ? (
                  <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 text-sm">
                    Reserved · {open.since}
                  </div>
                ) : (
                  <>
                    <Field label="Load" value={open.loadId ?? "—"} mono />
                    <Field label="Carrier" value={openLoad?.carrier ?? "—"} />
                    <Field label="Driver" value={driverName(openLoad?.driverId)} />
                    <Field
                      label="Pallets"
                      value={`${open.palletsDone ?? 0} / ${open.palletsTotal ?? 0}`}
                    />
                    <Field label="Started" value={open.since ?? "—"} />
                    <Field label="ETA finish" value={open.etaFinish ?? "—"} />
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{open.progress ?? 0}%</span>
                      </div>
                      <Progress value={open.progress ?? 0} className="h-2" />
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          if (open.loadId) {
                            free(open.id)
                            toast.success("Marked complete · door freed")
                            setOpenId(null)
                          }
                        }}
                      >
                        Mark complete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.info(`Reassign requested for ${open.id}`)}
                      >
                        Reassign loader
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
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
