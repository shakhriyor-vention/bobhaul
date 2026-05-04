import { useMemo, useState } from "react"
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  QrCode,
  ScanLine,
  Truck,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/store"

const dockTone: Record<string, string> = {
  loading: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  unloading: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  free: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  blocked: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  reserved: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
}

export default function Gate() {
  const drivers = useStore((s) => s.drivers)
  const loads = useStore((s) => s.loads)
  const docks = useStore((s) => s.docks)
  const events = useStore((s) => s.gateEvents)
  const checkIn = useStore((s) => s.checkInDriver)
  const checkOut = useStore((s) => s.checkOutDriver)

  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id

  const inboundLoads = useMemo(
    () =>
      loads.filter(
        (l) =>
          l.status === "scheduled" || l.status === "delayed" || l.status === "draft",
      ),
    [loads],
  )
  const outboundLoads = useMemo(
    () =>
      loads.filter(
        (l) => l.status === "loading" || l.status === "unloading" || l.status === "awaiting-paperwork",
      ),
    [loads],
  )

  const lastIn = events.find((e) => e.type === "in")
  const nowServing = lastIn ? loads.find((l) => l.id === lastIn.loadId) : null
  const nowServingDock = nowServing
    ? docks.find((d) => d.id === nowServing.dockId)
    : null

  const todayInCount = events.filter((e) => e.type === "in").length
  const todayOutCount = events.filter((e) => e.type === "out").length
  const inProgress = docks.filter(
    (d) => d.status === "loading" || d.status === "unloading",
  ).length
  const inProgressIn = docks.filter((d) => d.status === "unloading").length
  const inProgressOut = docks.filter((d) => d.status === "loading").length

  const [inForm, setInForm] = useState({
    driverId: drivers[0]?.id ?? "",
    loadId: inboundLoads[0]?.id ?? "",
    trailer: "T-",
  })
  const [outForm, setOutForm] = useState({
    loadId: outboundLoads[0]?.id ?? "",
    seal: "",
    notes: "",
  })

  const handleCheckIn = () => {
    if (!inForm.driverId || !inForm.loadId || !inForm.trailer.trim()) {
      toast.error("Driver, load, and trailer required")
      return
    }
    const { dockId } = checkIn(inForm)
    toast.success(`Checked in ${driverName(inForm.driverId)}`, {
      description: dockId ? `Dock ${dockId} assigned · pass printed` : "Awaiting dock",
    })
    setInForm({ driverId: inForm.driverId, loadId: "", trailer: "T-" })
  }

  const handleCheckOut = () => {
    if (!outForm.loadId || !outForm.seal.trim()) {
      toast.error("Load and seal required")
      return
    }
    checkOut(outForm)
    toast.success(`Departed · ${outForm.loadId}`)
    setOutForm({ loadId: "", seal: "", notes: "" })
  }

  const handleScan = () => {
    const driver = drivers[0]
    const load = inboundLoads[0]
    if (driver && load) {
      setInForm({
        driverId: driver.id,
        loadId: load.id,
        trailer: `T-${Math.floor(40 + Math.random() * 60)}`,
      })
      toast.info("QR scanned · driver auto-filled")
    }
  }

  const stats = [
    {
      label: "Active loads",
      value: String(inProgress),
      icon: Truck,
      sub: `${inProgressIn} in · ${inProgressOut} out`,
    },
    {
      label: "Checked in today",
      value: String(todayInCount),
      icon: ArrowDownToLine,
    },
    {
      label: "Avg wait",
      value: "6m 24s",
      icon: Clock,
      tone: "text-amber-600",
      sub: "+1m vs target",
    },
    {
      label: "Departed today",
      value: String(todayOutCount),
      icon: ArrowUpFromLine,
    },
    {
      label: "Drivers in yard",
      value: String(todayInCount - todayOutCount),
      icon: Users,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate"
        description="Check-in, check-out, kiosk."
        actions={
          <>
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700">
              <span className="mr-1 size-1.5 rounded-full bg-emerald-500" /> Online
            </Badge>
            <Button variant="outline" size="sm">
              Day shift · 06:00–14:00
            </Button>
          </>
        }
      />

      {nowServing && (
        <Card className="overflow-hidden border-primary/40 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Truck className="size-5" />
              </div>
              <span className="absolute -inset-1 animate-ping rounded-full bg-primary/30" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Now serving
              </div>
              <div className="text-sm font-medium">
                {nowServing.carrier} · {driverName(lastIn?.driverId ?? "")} ·{" "}
                <span className="font-mono">{nowServing.id}</span>
                {nowServingDock && <> · Dock {nowServingDock.id}</>}
              </div>
            </div>
            <Badge variant="outline" className="font-mono">
              {lastIn?.time}
            </Badge>
          </CardContent>
        </Card>
      )}

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

      <div className="grid gap-4 xl:grid-cols-[480px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Process driver</CardTitle>
            <CardDescription>Scan QR or enter details</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="in">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="in">
                  <ArrowDownToLine className="mr-1.5 size-4" /> Check-in
                </TabsTrigger>
                <TabsTrigger value="out">
                  <ArrowUpFromLine className="mr-1.5 size-4" /> Check-out
                </TabsTrigger>
              </TabsList>

              <TabsContent value="in" className="mt-4 space-y-4">
                <button
                  type="button"
                  onClick={handleScan}
                  className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50"
                >
                  <div className="text-center">
                    <QrCode className="mx-auto size-12 text-muted-foreground/40" />
                    <p className="mt-2 text-sm font-medium">Tap to scan license / PO</p>
                    <p className="text-xs text-muted-foreground">
                      Synced just now
                    </p>
                  </div>
                </button>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Driver</Label>
                    <Select
                      value={inForm.driverId}
                      onValueChange={(v) => setInForm({ ...inForm, driverId: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                      <SelectContent>
                        {drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name} · {d.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Load</Label>
                    <Select
                      value={inForm.loadId}
                      onValueChange={(v) => setInForm({ ...inForm, loadId: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select scheduled load" /></SelectTrigger>
                      <SelectContent>
                        {inboundLoads.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.id} · {l.origin} → {l.destination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Trailer #</Label>
                    <Input
                      value={inForm.trailer}
                      onChange={(e) => setInForm({ ...inForm, trailer: e.target.value })}
                      placeholder="T-88"
                    />
                  </div>
                  <Button className="w-full" size="lg" onClick={handleCheckIn}>
                    <ScanLine className="mr-2 size-4" /> Check in & print pass
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="out" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Load</Label>
                    <Select
                      value={outForm.loadId}
                      onValueChange={(v) => setOutForm({ ...outForm, loadId: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select active load" /></SelectTrigger>
                      <SelectContent>
                        {outboundLoads.length === 0 ? (
                          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            No active loads
                          </div>
                        ) : (
                          outboundLoads.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.id} · {l.dockId ?? "no dock"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Seal #</Label>
                    <Input
                      value={outForm.seal}
                      onChange={(e) => setOutForm({ ...outForm, seal: e.target.value })}
                      placeholder="SL-88121"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Input
                      value={outForm.notes}
                      onChange={(e) => setOutForm({ ...outForm, notes: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                    Tap to capture driver signature
                  </div>
                  <Button className="w-full" size="lg" onClick={handleCheckOut}>
                    Check out & release
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dock status — right now</CardTitle>
            <CardDescription>{docks.length} doors · live</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {docks.map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border bg-card p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium">{d.id}</span>
                    <Badge variant="secondary" className={`capitalize ${dockTone[d.status]}`}>
                      {d.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {d.status === "free"
                      ? "Available"
                      : d.status === "blocked"
                      ? d.blockReason ?? "Blocked"
                      : d.status === "reserved"
                      ? d.since ?? "Reserved"
                      : `${d.loadId ?? "—"} · ${d.progress ?? 0}%`}
                  </div>
                  {d.etaFinish && d.status !== "free" && d.status !== "blocked" && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      ETA finish {d.etaFinish}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" /> Today's activity
            </CardTitle>
            <CardDescription>{events.length} gate events</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[420px]">
            {events.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No gate activity yet.
              </div>
            ) : (
              <div className="divide-y px-6">
                {events.map((e) => (
                  <div
                    key={e.id}
                    className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-3"
                  >
                    <div
                      className={`flex size-8 items-center justify-center rounded-full ${
                        e.type === "in"
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-blue-500/15 text-blue-700"
                      }`}
                    >
                      {e.type === "in" ? (
                        <ArrowDownToLine className="size-4" />
                      ) : (
                        <ArrowUpFromLine className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm">
                        <span className="font-medium">{driverName(e.driverId)}</span>{" "}
                        <span className="text-muted-foreground">
                          {e.type === "in" ? "checked in" : "departed"} ·{" "}
                          <span className="font-mono">{e.loadId}</span> · {e.trailer}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {e.dockId ? `Dock ${e.dockId}` : "Awaiting dock"}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {e.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
