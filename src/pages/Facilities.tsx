import { useState } from "react"
import { Building, MapPin, ParkingSquare, User2, Warehouse } from "lucide-react"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { AddFacilityDialog } from "@/components/dialogs/add-facility-dialog"
import { useStore, type Facility } from "@/store"

const tone: Record<Facility["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  pilot: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
}

type TypeFilter = "all" | Facility["type"]

export default function Facilities() {
  const facilities = useStore((s) => s.facilities)
  const [filter, setFilter] = useState<TypeFilter>("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const open = facilities.find((f) => f.id === openId)
  const hash = (s: string) => s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)
  const dockUtil = open ? 40 + (Math.abs(hash(open.id + "d")) % 50) : 0
  const yardUtil = open ? 30 + (Math.abs(hash(open.id + "y")) % 60) : 0

  const counts = {
    all: facilities.length,
    "Cross-dock": facilities.filter((f) => f.type === "Cross-dock").length,
    Warehouse: facilities.filter((f) => f.type === "Warehouse").length,
    "Yard only": facilities.filter((f) => f.type === "Yard only").length,
  }

  const visible = filter === "all" ? facilities : facilities.filter((f) => f.type === filter)

  const totalDocks = facilities.reduce((acc, f) => acc + f.docks, 0)
  const totalYard = facilities.reduce((acc, f) => acc + f.yard, 0)

  const kpis = [
    { label: "Facilities", value: String(facilities.length), icon: Building },
    { label: "Total docks", value: String(totalDocks), icon: Warehouse },
    { label: "Yard slots", value: String(totalYard), icon: ParkingSquare },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        description="Hubs, cross-docks, warehouses, and yards."
        actions={<AddFacilityDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as TypeFilter)}>
        <TabsList>
          <TabsTrigger value="all">All · {counts.all}</TabsTrigger>
          <TabsTrigger value="Cross-dock">Cross-docks · {counts["Cross-dock"]}</TabsTrigger>
          <TabsTrigger value="Warehouse">Warehouses · {counts.Warehouse}</TabsTrigger>
          <TabsTrigger value="Yard only">Yards · {counts["Yard only"]}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Docks</TableHead>
                <TableHead className="text-right">Yard</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((f) => (
                <TableRow
                  key={f.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(f.id)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{f.id}</TableCell>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.type}</TableCell>
                  <TableCell>{f.city}</TableCell>
                  <TableCell>{f.manager}</TableCell>
                  <TableCell className="text-right">{f.docks}</TableCell>
                  <TableCell className="text-right">{f.yard}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={tone[f.status]}>
                      {f.status}
                    </Badge>
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
                    {open.type === "Cross-dock" ? (
                      <Warehouse className="size-5" />
                    ) : open.type === "Warehouse" ? (
                      <Building className="size-5" />
                    ) : (
                      <ParkingSquare className="size-5" />
                    )}
                  </div>
                  <div>
                    <div>{open.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{open.id}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>{open.type} · {open.city}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className={tone[open.status]}>{open.status}</Badge>
                  <Badge variant="outline">{open.docks} doors</Badge>
                  <Badge variant="outline">{open.yard} yard slots</Badge>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Dock utilization</span>
                    <span className="font-mono">{dockUtil}%</span>
                  </div>
                  <Progress value={dockUtil} className="h-2" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Yard utilization</span>
                    <span className="font-mono">{yardUtil}%</span>
                  </div>
                  <Progress value={yardUtil} className="h-2" />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <DetailRow icon={MapPin} label="City" value={open.city} />
                  <DetailRow icon={User2} label="Manager" value={open.manager} />
                  <DetailRow icon={Warehouse} label="Doors" value={String(open.docks)} />
                  <DetailRow icon={ParkingSquare} label="Yard slots" value={String(open.yard)} />
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info(`${open.name} opened on map`)}
                  >
                    <MapPin className="mr-1.5 size-4" /> View on map
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success(`Reassigned manager for ${open.name}`)}
                  >
                    Reassign manager
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
