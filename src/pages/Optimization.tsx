import { useMemo, useState } from "react"
import { ArrowRight, CheckCircle2, Flame, Map as MapIcon, Route, Sparkles, TrendingUp, Wand2, X } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { Heatmap } from "@/components/charts"
import { useStore } from "@/store"

const settings = [
  { id: "auto", label: "Auto-apply high-confidence", desc: ">90% confidence", default: true },
  { id: "hos", label: "Respect HOS limits", desc: "Driver hours of service", default: true },
  { id: "cargo", label: "Cargo compatibility", desc: "Door equipment match", default: true },
  { id: "carrier", label: "Carrier priority", desc: "SLA tier weighting", default: false },
  { id: "fuel", label: "Minimize idle fuel", desc: "Cost-optimize moves", default: true },
] as const

export default function Optimization() {
  const suggestions = useStore((s) => s.suggestions)
  const loads = useStore((s) => s.loads)
  const apply = useStore((s) => s.applySuggestion)
  const dismiss = useStore((s) => s.dismissSuggestion)
  const run = useStore((s) => s.runOptimizer)
  const [accepted, setAccepted] = useState(34)
  const [running, setRunning] = useState(false)

  const lanes = useMemo(() => {
    const map = new Map<string, { lane: string; count: number; totalWeight: number; carriers: Set<string> }>()
    for (const l of loads) {
      const lane = `${l.origin.split(",")[0]} → ${l.destination.split(",")[0]}`
      const cur = map.get(lane) ?? { lane, count: 0, totalWeight: 0, carriers: new Set<string>() }
      cur.count++
      cur.totalWeight += l.weight
      cur.carriers.add(l.carrier)
      map.set(lane, cur)
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((x) => ({
        lane: x.lane,
        loads: x.count,
        avgWeight: Math.round(x.totalWeight / x.count),
        carriers: [...x.carriers],
        utilization: Math.min(100, x.count * 18 + 30),
      }))
  }, [loads])

  const carrierScores = useMemo(() => {
    const m = new Map<string, { carrier: string; loads: number; onTime: number; delayed: number }>()
    for (const l of loads) {
      const cur = m.get(l.carrier) ?? { carrier: l.carrier, loads: 0, onTime: 0, delayed: 0 }
      cur.loads++
      if (l.status === "delayed") cur.delayed++
      else cur.onTime++
      m.set(l.carrier, cur)
    }
    return [...m.values()]
      .map((c) => ({
        ...c,
        score: Math.round((c.onTime / Math.max(c.loads, 1)) * 100),
      }))
      .sort((a, b) => b.score - a.score)
  }, [loads])

  const heatmapData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const hours = ["6", "8", "10", "12", "14", "16", "18"]
    const data = days.map((_, di) =>
      hours.map((_, hi) => {
        const seed = ((di * 7 + hi) * 9301 + 49297) % 233280
        const peak = hi >= 1 && hi <= 4 && di < 5 ? 60 : 10
        return Math.round(peak + (seed / 233280) * 40)
      }),
    )
    return { days, hours, data }
  }, [])

  const stats = [
    { label: "Suggestions today", value: String(suggestions.length + accepted) },
    { label: "Accepted", value: String(accepted), tone: "text-emerald-600" },
    { label: "Time saved (est.)", value: `${Math.floor(accepted * 4 / 60)}h ${(accepted * 4) % 60}m` },
    { label: "Throughput gain", value: "+12%", tone: "text-emerald-600" },
  ]

  const handleRun = async () => {
    setRunning(true)
    setTimeout(() => {
      const n = run()
      toast.success(`Optimizer complete · ${n} new suggestions`)
      setRunning(false)
    }, 700)
  }

  const handleApply = (id: string) => {
    apply(id)
    setAccepted((a) => a + 1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Optimization"
        description="AI-assisted dock sequencing and slot smart-fit."
        actions={
          <Button size="sm" onClick={handleRun} disabled={running}>
            <Wand2 className="mr-1.5 size-4" /> {running ? "Running…" : "Run optimizer"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold tracking-tight ${s.tone ?? ""}`}>
                {s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle>Pending suggestions</CardTitle>
            </div>
            <CardDescription>{suggestions.length} ready to apply</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Queue clear. Run optimizer to refresh.
              </div>
            ) : (
              suggestions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="size-4 text-primary" />
                        <span className="font-medium">{s.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.reason}</p>
                      <div className="flex items-center gap-3 pt-1">
                        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          {s.saving}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Confidence {s.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => dismiss(s.id)}>
                        <X className="size-4" />
                      </Button>
                      <Button size="sm" onClick={() => handleApply(s.id)}>
                        <CheckCircle2 className="mr-1.5 size-4" /> Apply
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engine settings</CardTitle>
            <CardDescription>What the optimizer considers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((opt) => (
              <div key={opt.id} className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor={opt.id} className="text-sm">{opt.label}</Label>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                <Switch
                  id={opt.id}
                  defaultChecked={opt.default}
                  onCheckedChange={(c) => toast(`${opt.label}: ${c ? "on" : "off"}`)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="size-4" /> Dock demand heatmap
            </CardTitle>
            <CardDescription>Weekly utilization · darker = busier</CardDescription>
          </CardHeader>
          <CardContent>
            <Heatmap
              data={heatmapData.data}
              rowLabels={heatmapData.days}
              colLabels={heatmapData.hours}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="size-4" /> Top lanes
            </CardTitle>
            <CardDescription>By load volume this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lanes.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No lane data.</div>
            ) : (
              lanes.map((l) => (
                <div key={l.lane} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{l.lane}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {l.carriers.join(", ")} · avg {l.avgWeight.toLocaleString()} lb
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{l.loads} loads</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={l.utilization} className="h-1.5 flex-1" />
                    <span className="text-[10px] tabular-nums text-muted-foreground">{l.utilization}%</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4" /> Carrier scorecard
          </CardTitle>
          <CardDescription>On-time score derived from live load status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {carrierScores.map((c) => {
              const tone =
                c.score >= 90
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : c.score >= 75
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-rose-500/30 bg-rose-500/5"
              const scoreColor =
                c.score >= 90
                  ? "text-emerald-600"
                  : c.score >= 75
                  ? "text-amber-600"
                  : "text-rose-600"
              return (
                <div key={c.carrier} className={`rounded-lg border p-3 ${tone}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.carrier}</div>
                    <Flame className={`size-4 ${c.score >= 90 ? "text-emerald-500" : "text-muted-foreground"}`} />
                  </div>
                  <div className={`mt-2 text-2xl font-semibold tabular-nums ${scoreColor}`}>
                    {c.score}%
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {c.onTime}/{c.loads} on-time · {c.delayed} delayed
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
