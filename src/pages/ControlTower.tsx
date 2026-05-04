import { useState } from "react"
import { AlertOctagon, AlertTriangle, Clock, Flag, Radar, ShieldAlert } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/page-header"
import { useStore, type ExceptionSeverity } from "@/store"

const severityTone: Record<
  ExceptionSeverity,
  { card: string; badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  critical: {
    card: "border-l-rose-500",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    icon: AlertOctagon,
  },
  warning: {
    card: "border-l-amber-500",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    icon: AlertTriangle,
  },
  info: {
    card: "border-l-blue-500",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    icon: Flag,
  },
}

type Filter = "all" | ExceptionSeverity | "mine"

export default function ControlTower() {
  const exceptions = useStore((s) => s.exceptions)
  const oncall = useStore((s) => s.oncall)
  const resolve = useStore((s) => s.resolveException)
  const snooze = useStore((s) => s.snoozeException)
  const [filter, setFilter] = useState<Filter>("all")
  const [running, setRunning] = useState(false)

  const open = exceptions.filter((e) => e.status === "open")
  const counts = {
    all: open.length,
    critical: open.filter((e) => e.severity === "critical").length,
    warning: open.filter((e) => e.severity === "warning").length,
    info: open.filter((e) => e.severity === "info").length,
    mine: open.filter((e) => e.owner === oncall).length,
  }

  const visible = open.filter((e) => {
    if (filter === "all") return true
    if (filter === "mine") return e.owner === oncall
    return e.severity === filter
  })

  const resolved = exceptions.filter((e) => e.status === "resolved").length

  const summary = [
    { label: "Open exceptions", value: String(open.length) },
    { label: "Critical", value: String(counts.critical), tone: counts.critical > 0 ? "text-rose-600" : "" },
    { label: "Avg resolution", value: "18m" },
    { label: "Resolved today", value: String(resolved + 34), tone: "text-emerald-600" },
  ]

  const handleSweep = () => {
    setRunning(true)
    setTimeout(() => {
      toast.success("Sweep complete · no new issues found")
      setRunning(false)
    }, 700)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control Tower"
        description="Exception queue, escalations, oncall handoff."
        actions={
          <>
            <Button variant="outline" size="sm">
              <ShieldAlert className="mr-1.5 size-4" /> Oncall: {oncall}
            </Button>
            <Button size="sm" onClick={handleSweep} disabled={running}>
              <Radar className="mr-1.5 size-4" /> {running ? "Sweeping…" : "Run sweep"}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((s) => (
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

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All · {counts.all}</TabsTrigger>
          <TabsTrigger value="critical">Critical · {counts.critical}</TabsTrigger>
          <TabsTrigger value="warning">Warning · {counts.warning}</TabsTrigger>
          <TabsTrigger value="info">Info · {counts.info}</TabsTrigger>
          <TabsTrigger value="mine">Mine · {counts.mine}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Exception queue</CardTitle>
          <CardDescription>Sorted by severity, then age</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visible.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nothing here. All clear.
            </div>
          ) : (
            visible.map((e) => {
              const t = severityTone[e.severity]
              return (
                <div
                  key={e.id}
                  className={`group rounded-lg border border-l-4 bg-card p-4 transition-colors hover:bg-muted/30 ${t.card}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <t.icon className="size-4" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{e.title}</span>
                        <Badge variant="secondary" className={`capitalize ${t.badge}`}>
                          {e.severity}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {e.id}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{e.detail}</p>
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {e.age} ago
                        </span>
                        {e.loadId && <span className="font-mono">{e.loadId}</span>}
                        {e.driverId && <span>{e.driverId}</span>}
                        {e.owner && (
                          <span className="flex items-center gap-1.5">
                            Owner:
                            <Avatar className="size-4">
                              <AvatarFallback className="bg-primary/10 text-[8px] text-primary">
                                {e.owner.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            {e.owner}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          snooze(e.id)
                          toast(`${e.id} snoozed`)
                        }}
                      >
                        Snooze
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          resolve(e.id)
                          toast.success(`${e.id} resolved`)
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
