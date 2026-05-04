import { useState } from "react"
import { Activity, CalendarClock, Fuel, Gauge, IdCard, Truck, User2, Wrench } from "lucide-react"
import { toast } from "sonner"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { AddVehicleDialog } from "@/components/dialogs/add-vehicle-dialog"
import { useStore, type VehicleStatus } from "@/store"

const statusTone: Record<VehicleStatus, string> = {
  "on-route": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  idle: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  maintenance: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
}

export default function Fleet() {
  const vehicles = useStore((s) => s.vehicles)
  const drivers = useStore((s) => s.drivers)
  const loads = useStore((s) => s.loads)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = vehicles.find((v) => v.id === openId)
  const openDriver = open?.driverId ? drivers.find((d) => d.id === open.driverId) : undefined
  const openLoad = openDriver?.loadId ? loads.find((l) => l.id === openDriver.loadId) : undefined

  const driverName = (id?: string) => drivers.find((d) => d.id === id)?.name ?? "—"

  const kpis = [
    {
      label: "Active vehicles",
      value: `${vehicles.filter((v) => v.status === "on-route").length} / ${vehicles.length}`,
      icon: Truck,
    },
    {
      label: "In maintenance",
      value: String(vehicles.filter((v) => v.status === "maintenance").length),
      icon: Wrench,
    },
    { label: "Avg fuel use", value: "6.7 mpg", icon: Fuel },
    { label: "Idle time", value: "11%", icon: Activity },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Management"
        description="Vehicles, maintenance, telematics."
        actions={<AddVehicleDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>Live fleet snapshot</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Next service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow
                  key={v.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(v.id)}
                >
                  <TableCell className="font-mono text-xs">{v.id}</TableCell>
                  <TableCell className="font-medium">{v.model}</TableCell>
                  <TableCell>{v.year}</TableCell>
                  <TableCell>{driverName(v.driverId)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {v.odometer.toLocaleString()} mi
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.nextService}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusTone[v.status]}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info(`Diagnostic pulled for ${v.id}`)}
                    >
                      Diagnostics
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Truck className="size-5" />
                  </div>
                  <div>
                    <div className="font-mono">{open.id}</div>
                    <div className="text-sm font-normal text-muted-foreground">{open.model}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  {open.year} · {open.odometer.toLocaleString()} mi
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className={statusTone[open.status]}>
                    {open.status}
                  </Badge>
                  <Badge variant="outline">{open.nextService}</Badge>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Service interval</span>
                    <span className="font-mono">{(open.odometer % 25000).toLocaleString()} / 25,000 mi</span>
                  </div>
                  <Progress value={((open.odometer % 25000) / 25000) * 100} className="h-2" />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <DetailRow icon={IdCard} label="VIN (last 6)" value={`••••${open.id.slice(-6)}`} />
                  <DetailRow icon={Gauge} label="Odometer" value={`${open.odometer.toLocaleString()} mi`} />
                  <DetailRow icon={Wrench} label="Next service" value={open.nextService} />
                  <DetailRow icon={CalendarClock} label="Year" value={String(open.year)} />
                  <DetailRow icon={User2} label="Assigned driver" value={openDriver?.name ?? "—"} />
                  <DetailRow icon={Fuel} label="Avg MPG" value="6.7 mpg" />
                </div>

                {openLoad && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        On load
                      </div>
                      <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{openLoad.id}</span>
                          <Badge variant="secondary" className="capitalize">{openLoad.status}</Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {openLoad.origin} → {openLoad.destination}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Activity className="size-3.5" /> Telematics (last 24h)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <Stat label="Avg speed" value="58 mph" />
                    <Stat label="Idle" value="11%" />
                    <Stat label="Hard brakes" value="2" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info(`Diagnostic pulled for ${open.id}`)}>
                    <Wrench className="mr-1.5 size-4" /> Diagnostics
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success(`Service scheduled for ${open.id}`)}>
                    Schedule service
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm">{value}</div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <div className="text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}
