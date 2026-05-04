import { useMemo, useState } from "react"
import { AlertTriangle, CalendarDays, CheckCircle2, FileBadge, Shield, ShieldCheck, Umbrella } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/store"

type ExpiryRow = {
  id: string
  driverId: string
  name: string
  license: string
  expiry: string
  daysOut: number
}

export default function Compliance() {
  const drivers = useStore((s) => s.drivers)
  const vehicles = useStore((s) => s.vehicles)
  const exceptions = useStore((s) => s.exceptions)
  const renew = useStore((s) => s.renewLicense)
  const [refreshing, setRefreshing] = useState(false)
  const [renewTarget, setRenewTarget] = useState<ExpiryRow | null>(null)
  const [renewDate, setRenewDate] = useState("")

  const expiries = useMemo<ExpiryRow[]>(() => {
    return drivers
      .map((d) => {
        const ts = new Date(d.licenseExp).getTime()
        const days = Math.round((ts - Date.now()) / 86400000)
        return {
          id: d.id,
          driverId: d.id,
          name: d.name,
          license: d.license,
          expiry: d.licenseExp,
          daysOut: days,
        }
      })
      .sort((a, b) => a.daysOut - b.daysOut)
  }, [drivers])

  const calendarBuckets = useMemo(() => {
    const buckets: Record<string, ExpiryRow[]> = {
      "Within 30d": [],
      "30–60d": [],
      "60–90d": [],
      "90d+": [],
      Expired: [],
    }
    for (const e of expiries) {
      if (e.daysOut < 0) buckets.Expired.push(e)
      else if (e.daysOut <= 30) buckets["Within 30d"].push(e)
      else if (e.daysOut <= 60) buckets["30–60d"].push(e)
      else if (e.daysOut <= 90) buckets["60–90d"].push(e)
      else buckets["90d+"].push(e)
    }
    return buckets
  }, [expiries])

  const expiringDrivers = drivers.filter((d) => d.status === "expiring").length
  const hosOverrun = drivers.filter((d) => d.hours.used > 10).length
  const maintVehicles = vehicles.filter((v) => v.status === "maintenance").length
  const complianceExceptions = exceptions.filter(
    (e) => e.status === "open" && (e.title.toLowerCase().includes("license") || e.title.toLowerCase().includes("hos")),
  ).length

  const score = Math.max(0, Math.min(100, 100 - expiringDrivers * 3 - hosOverrun * 4 - complianceExceptions * 5))

  const checks = [
    {
      label: "DOT inspections current",
      value: `${vehicles.length - maintVehicles} / ${vehicles.length}`,
      ok: maintVehicles === 0,
      icon: ShieldCheck,
    },
    {
      label: "HOS log compliance",
      value: hosOverrun === 0 ? "100%" : `${Math.round(((drivers.length - hosOverrun) / drivers.length) * 100)}%`,
      ok: hosOverrun === 0,
      icon: Shield,
    },
    {
      label: "Driver license expiry < 30d",
      value: String(expiringDrivers),
      ok: expiringDrivers === 0,
      icon: FileBadge,
    },
    {
      label: "Insurance certificates",
      value: "All valid",
      ok: true,
      icon: Umbrella,
    },
    {
      label: "Hazmat permits",
      value: "12 active",
      ok: true,
      icon: AlertTriangle,
    },
  ]

  const audit = [
    { actor: "R. Diaz", action: "Cleared DOT inspection", target: "TR-088", time: "12m ago" },
    { actor: "System", action: "Flagged license expiry", target: "DR-1240", time: "1h ago" },
    { actor: "A. Patel", action: "Approved hazmat permit", target: "HM-2284", time: "3h ago" },
    { actor: "System", action: "HOS overrun warning", target: "DR-1212", time: "5h ago" },
    { actor: "K. Nakamura", action: "Updated insurance cert", target: "BR-02", time: "1d ago" },
  ]

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      toast.success("Compliance scan complete")
      setRefreshing(false)
    }, 600)
  }

  const handleExport = () => {
    toast.success("Compliance report queued", { description: "Will email to ops@bobhaul.io" })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Hub"
        description="Audit trail, DOT, HOS, permits, insurance."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Scanning…" : "Run scan"}
            </Button>
            <Button size="sm" onClick={handleExport}>
              Export report
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Compliance score</CardTitle>
            <CardDescription>Rolling 30-day window</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-5xl font-semibold tabular-nums">{score}</div>
              <div className="text-sm text-muted-foreground">/ 100</div>
            </div>
            <Progress value={score} className="mt-3 h-2" />
            <div
              className={`mt-3 flex items-center gap-2 text-sm ${
                score >= 85 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {score >= 85 ? (
                <>
                  <CheckCircle2 className="size-4" /> Above target (85)
                </>
              ) : (
                <>
                  <AlertTriangle className="size-4" /> Below target — review checks
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active checks</CardTitle>
            <CardDescription>Auto-monitored compliance items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {checks.map((c) => (
                <div
                  key={c.label}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${
                      c.ok ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                    }`}
                  >
                    <c.icon className="size-4" />
                  </div>
                  <div className="text-sm font-medium">{c.label}</div>
                  <span className="text-sm text-muted-foreground">{c.value}</span>
                  <Badge
                    variant="secondary"
                    className={
                      c.ok ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                    }
                  >
                    {c.ok ? "OK" : "Action"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4" /> License expiry calendar
            </CardTitle>
            <CardDescription>Driver CDL expiry buckets · click to renew</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-5">
            {(Object.keys(calendarBuckets) as Array<keyof typeof calendarBuckets>).map((bucket) => {
              const items = calendarBuckets[bucket]
              const tone =
                bucket === "Expired"
                  ? "border-rose-500/40 bg-rose-500/5"
                  : bucket === "Within 30d"
                  ? "border-rose-500/30 bg-rose-500/5"
                  : bucket === "30–60d"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border bg-muted/10"
              return (
                <div key={bucket} className={`rounded-lg border p-3 ${tone}`}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium">{bucket}</span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {items.length === 0 && (
                      <div className="py-2 text-center text-[10px] text-muted-foreground">—</div>
                    )}
                    {items.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          setRenewTarget(e)
                          setRenewDate("")
                        }}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-medium">{e.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {e.daysOut < 0 ? `${Math.abs(e.daysOut)}d ago` : `${e.daysOut}d`}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {e.license} · {e.expiry}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Last 24 hours</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {audit.map((a, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="text-sm">
                <span className="font-medium">{a.actor}</span>{" "}
                <span className="text-muted-foreground">{a.action}</span>{" "}
                <span className="font-mono text-xs text-muted-foreground">{a.target}</span>
              </div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!renewTarget} onOpenChange={(o) => !o && setRenewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew license · {renewTarget?.name}</DialogTitle>
            <DialogDescription>
              Current expiry: {renewTarget?.expiry} ({renewTarget?.license})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">New expiry date</Label>
            <Input
              type="date"
              value={renewDate}
              onChange={(e) => setRenewDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!renewTarget || !renewDate) {
                  toast.error("Pick new expiry")
                  return
                }
                renew(renewTarget.driverId, renewDate)
                setRenewTarget(null)
                setRenewDate("")
              }}
            >
              Confirm renewal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
