import { useNavigate } from "react-router-dom"
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  TriangleAlert,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/page-header"
import { useShallow } from "zustand/react/shallow"
import { BookAppointmentDialog } from "@/components/dialogs/book-appointment-dialog"
import { AreaChart, BarChart, Donut, Sparkline } from "@/components/charts"
import { useStore } from "@/store"

const dockTone = {
  loading: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  unloading: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  free: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  blocked: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  reserved: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
} as const

export default function Dashboard() {
  const navigate = useNavigate()
  const docks = useStore((s) => s.docks)
  const loads = useStore((s) => s.loads)
  const drivers = useStore((s) => s.drivers)
  const events = useStore((s) => s.gateEvents)
  const activeLoads = useStore(
    useShallow((s) => s.loads.filter((l) => ["loading", "unloading"].includes(l.status))),
  )
  const exceptions = useStore(
    useShallow((s) => s.exceptions.filter((e) => e.status === "open")),
  )

  const onTime = Math.round(
    (loads.filter((l) => l.status !== "delayed").length / Math.max(loads.length, 1)) * 100 * 10,
  ) / 10

  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id

  const stats = [
    {
      label: "On-time arrivals",
      value: `${onTime}%`,
      delta: "+1.8%",
      trend: "up" as const,
      icon: CheckCircle2,
      spark: [88, 91, 89, 93, 90, 92, 94],
    },
    {
      label: "Active loads",
      value: String(activeLoads.length),
      delta: `+${activeLoads.length}`,
      trend: "up" as const,
      icon: PackageCheck,
      spark: [3, 5, 4, 7, 6, 8, activeLoads.length || 4],
    },
    {
      label: "Avg dwell time",
      value: "47m",
      delta: "-6m",
      trend: "up" as const,
      icon: Clock,
      spark: [62, 58, 60, 55, 51, 49, 47],
    },
    {
      label: "Open exceptions",
      value: String(exceptions.length),
      delta: exceptions.length > 0 ? "Watch" : "Clear",
      trend: exceptions.length > 0 ? "down" as const : "up" as const,
      icon: TriangleAlert,
      spark: [2, 4, 3, 5, 4, 3, exceptions.length],
    },
  ]

  const throughput = [
    { label: "06", value: 4 },
    { label: "07", value: 8 },
    { label: "08", value: 14 },
    { label: "09", value: 22 },
    { label: "10", value: 26 },
    { label: "11", value: 24 },
    { label: "12", value: 19 },
    { label: "13", value: 21 },
    { label: "14", value: 17 },
  ]
  const dwellTrend = [
    { label: "Mon", value: 62 },
    { label: "Tue", value: 58 },
    { label: "Wed", value: 60 },
    { label: "Thu", value: 55 },
    { label: "Fri", value: 51 },
    { label: "Sat", value: 49 },
    { label: "Sun", value: 47 },
  ]

  const utilization = [
    {
      label: "Dock occupancy",
      value: Math.round(
        (docks.filter((d) => d.status !== "free" && d.status !== "blocked").length / docks.length) * 100,
      ),
    },
    { label: "Driver throughput", value: 64 },
    { label: "Doc completion", value: 91 },
    { label: "Optimizer accept rate", value: 72 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Daily ops pulse across your hub."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/control-tower")}>
              View exceptions
            </Button>
            <BookAppointmentDialog
              trigger={<Button size="sm">New Appointment</Button>}
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
              <div
                className={`mt-1 inline-flex items-center gap-1 text-xs ${
                  s.trend === "up" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {s.trend === "up" ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {s.delta} vs yesterday
              </div>
              <Sparkline
                data={s.spark}
                className={s.trend === "up" ? "text-emerald-500" : "text-rose-500"}
                height={36}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Throughput · loads completed by hour</CardTitle>
            <CardDescription>Today · {throughput.reduce((a, b) => a + b.value, 0)} total</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={throughput} height={180} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>SLA score</CardTitle>
            <CardDescription>Rolling 7-day</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Donut value={onTime} size={140} sublabel="on-time" />
            <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-semibold tabular-nums">{activeLoads.length}</div>
                <div className="text-muted-foreground">active</div>
              </div>
              <div>
                <div className="font-semibold tabular-nums">47m</div>
                <div className="text-muted-foreground">dwell</div>
              </div>
              <div>
                <div className="font-semibold tabular-nums">{exceptions.length}</div>
                <div className="text-muted-foreground">excpt.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dwell time trend</CardTitle>
          <CardDescription>Avg minutes per load · last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChart data={dwellTrend} height={180} yLabel="min" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dock status</CardTitle>
              <CardDescription>Live snapshot · {docks.length} doors</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/operations/dock")}>
              View board
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {docks.slice(0, 6).map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate("/operations/dock")}
                  className="rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-muted-foreground" />
                      <span className="font-medium">{d.id}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`capitalize ${dockTone[d.status]}`}
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Load</span>
                      <span className="font-mono text-xs">{d.loadId ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Since</span>
                      <span>{d.since ?? "—"}</span>
                    </div>
                    {d.progress !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{d.progress}%</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hub utilization</CardTitle>
            <CardDescription>Today vs target</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {utilization.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">{m.value}%</span>
                </div>
                <Progress value={m.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Hub-wide event stream</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/operations/gate")}>
            Open gate
          </Button>
        </CardHeader>
        <CardContent className="divide-y">
          {events.slice(0, 6).map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-muted text-xs">
                    {driverName(e.driverId).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm">
                    <span className="font-medium">{driverName(e.driverId)}</span>{" "}
                    <span className="text-muted-foreground">
                      {e.type === "in" ? "checked in" : "departed"} at {e.dockId ?? "gate"}
                    </span>
                  </div>
                </div>
              </div>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{e.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
