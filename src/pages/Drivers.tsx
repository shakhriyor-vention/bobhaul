import { useState } from "react"
import { CalendarClock, FileBadge, IdCard, Phone, Truck } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import { AddDriverDialog } from "@/components/dialogs/add-driver-dialog"
import { useStore, type DriverStatus } from "@/store"

const statusTone: Record<DriverStatus, string> = {
  "on-duty": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rest: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  off: "bg-muted text-muted-foreground",
  expiring: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
}

type Filter = "all" | DriverStatus

export default function Drivers() {
  const drivers = useStore((s) => s.drivers)
  const vehicles = useStore((s) => s.vehicles)
  const loads = useStore((s) => s.loads)
  const update = useStore((s) => s.updateDriver)
  const renew = useStore((s) => s.renewLicense)
  const [filter, setFilter] = useState<Filter>("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const [renewDate, setRenewDate] = useState("")
  const open = drivers.find((d) => d.id === openId)
  const openVehicle = open ? vehicles.find((v) => v.driverId === open.id) : undefined
  const openLoad = open?.loadId ? loads.find((l) => l.id === open.loadId) : undefined
  const daysToExpiry = open
    ? Math.round((new Date(open.licenseExp).getTime() - Date.now()) / 86400000)
    : 0

  const counts = {
    all: drivers.length,
    "on-duty": drivers.filter((d) => d.status === "on-duty").length,
    rest: drivers.filter((d) => d.status === "rest").length,
    off: drivers.filter((d) => d.status === "off").length,
    expiring: drivers.filter((d) => d.status === "expiring").length,
  }

  const visible = filter === "all" ? drivers : drivers.filter((d) => d.status === filter)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Drivers"
        description="Roster, HOS, and license compliance."
        actions={<AddDriverDialog />}
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All · {counts.all}</TabsTrigger>
          <TabsTrigger value="on-duty">On-duty · {counts["on-duty"]}</TabsTrigger>
          <TabsTrigger value="rest">Rest · {counts.rest}</TabsTrigger>
          <TabsTrigger value="off">Off · {counts.off}</TabsTrigger>
          <TabsTrigger value="expiring">Expiring · {counts.expiring}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>License</TableHead>
                <TableHead>HOS today</TableHead>
                <TableHead>Current load</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((d) => (
                <TableRow
                  key={d.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(d.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {d.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.license} · exp {d.licenseExp.slice(0, 7)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {d.hours.used.toFixed(1)} / {d.hours.max}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{d.loadId ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusTone[d.status]}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info(`Calling ${d.phone}`)}>
                          <Phone className="mr-2 size-4" /> Call driver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            update(d.id, { status: d.status === "on-duty" ? "rest" : "on-duty" })
                            toast.success(
                              `${d.name} marked ${d.status === "on-duty" ? "rest" : "on-duty"}`,
                            )
                          }}
                        >
                          Toggle duty
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            update(d.id, { hours: { used: 0, max: d.hours.max } })
                            toast.success("HOS reset")
                          }}
                        >
                          Reset HOS
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!open} onOpenChange={(o) => { if (!o) { setOpenId(null); setRenewDate("") } }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {open.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{open.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{open.id}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  {open.license} · expires {open.licenseExp}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className={statusTone[open.status]}>
                    {open.status}
                  </Badge>
                  {daysToExpiry < 60 && (
                    <Badge
                      variant="secondary"
                      className={
                        daysToExpiry < 30
                          ? "bg-rose-500/15 text-rose-700"
                          : "bg-amber-500/15 text-amber-700"
                      }
                    >
                      License {daysToExpiry < 0 ? "expired" : `${daysToExpiry}d to expiry`}
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Hours of service</span>
                    <span className="font-mono">{open.hours.used.toFixed(1)} / {open.hours.max}h</span>
                  </div>
                  <Progress value={(open.hours.used / open.hours.max) * 100} className="h-2" />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <DetailRow icon={Phone} label="Phone" value={open.phone} />
                  <DetailRow icon={IdCard} label="License" value={open.license} />
                  <DetailRow icon={CalendarClock} label="License expiry" value={open.licenseExp} />
                  <DetailRow icon={Truck} label="Vehicle" value={openVehicle ? `${openVehicle.id} · ${openVehicle.model}` : "—"} />
                </div>

                {openLoad && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Current load
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
                    <FileBadge className="size-3.5" /> Renew license
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={renewDate}
                      onChange={(e) => setRenewDate(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!renewDate) {
                          toast.error("Pick new expiry date")
                          return
                        }
                        renew(open.id, renewDate)
                        setRenewDate("")
                      }}
                    >
                      Renew
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info(`Calling ${open.phone}`)}
                  >
                    <Phone className="mr-1.5 size-4" /> Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      update(open.id, {
                        status: open.status === "on-duty" ? "rest" : "on-duty",
                      })
                      toast.success(
                        `${open.name} marked ${open.status === "on-duty" ? "rest" : "on-duty"}`,
                      )
                    }}
                  >
                    Toggle duty
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      update(open.id, { hours: { used: 0, max: open.hours.max } })
                      toast.success("HOS reset")
                    }}
                  >
                    Reset HOS
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
