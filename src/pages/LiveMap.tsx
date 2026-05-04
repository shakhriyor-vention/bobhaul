import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet"
import L from "leaflet"
import { Globe2, Layers, Locate, Map as MapIcon, MapPin, Truck } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/components/theme-provider"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/store"

const GlobeView = lazy(() => import("@/components/globe-view"))

const HUB: [number, number] = [41.853, -87.659]

const cityCoords: Record<string, [number, number]> = {
  "Chicago, IL": [41.853, -87.659],
  "Indianapolis, IN": [39.768, -86.158],
  "St. Louis, MO": [38.627, -90.199],
  "Milwaukee, WI": [43.038, -87.906],
  "Detroit, MI": [42.331, -83.045],
  "Cleveland, OH": [41.499, -81.694],
  "Madison, WI": [43.073, -89.401],
  "Toledo, OH": [41.663, -83.555],
  "Cincinnati, OH": [39.103, -84.512],
  "Columbus, OH": [39.962, -83.001],
}

const dotTone: Record<string, string> = {
  approaching: "bg-amber-500",
  "in-transit": "bg-violet-500",
  idle: "bg-blue-500",
  delivered: "bg-emerald-500",
  loading: "bg-amber-500",
  unloading: "bg-blue-500",
}

const tone: Record<string, string> = {
  approaching: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "in-transit": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  idle: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  loading: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  unloading: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
}

const statusColor: Record<string, string> = {
  approaching: "#f59e0b",
  loading: "#f59e0b",
  unloading: "#3b82f6",
  "in-transit": "#8b5cf6",
  idle: "#3b82f6",
  delivered: "#10b981",
}

function loadStatusToMapStatus(status: string): string {
  if (status === "loading" || status === "unloading") return "loading"
  if (status === "in-transit") return "in-transit"
  if (status === "delivered") return "delivered"
  return "idle"
}

function midpoint(a: [number, number], b: [number, number], t = 0.5): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

// Idle / maintenance trucks parked at regional terminals
const PARKING_LOTS: [number, number][] = [
  [43.073, -89.401], // Madison, WI
  [41.499, -81.694], // Cleveland, OH
  [41.663, -83.555], // Toledo, OH
  [39.103, -84.512], // Cincinnati, OH
  [38.627, -90.199], // St. Louis, MO
  [42.331, -83.045], // Detroit, MI
]

// On-land yard slots near hub (Chicago) — west/south of Lake Michigan
const HUB_YARD_SLOTS: [number, number][] = [
  [41.748, -87.812], // Bedford Park (industrial)
  [41.846, -87.755], // Cicero
  [41.836, -87.658], // Bridgeport
  [41.832, -87.674], // McKinley Park
  [41.812, -87.654], // Stockyards
  [41.793, -87.731], // Marquette Park
  [41.879, -87.768], // West Loop
  [41.733, -87.601], // South Chicago
]

const routeKey = (o: [number, number], d: [number, number]) =>
  `${o[0].toFixed(3)},${o[1].toFixed(3)}|${d[0].toFixed(3)},${d[1].toFixed(3)}`

// Sample polyline at fraction t (0..1) — by index, fast approximation
function sampleAlong(coords: [number, number][], t: number): [number, number] {
  if (coords.length === 0) return [0, 0]
  const idx = Math.min(coords.length - 1, Math.max(0, Math.floor(coords.length * t)))
  return coords[idx]
}

export type TrackedUnit = {
  id: string
  driver: string
  load: string
  loadStatus?: string
  origin?: string
  destination?: string
  status: string
  eta: string
  position: [number, number]
  originCoord?: [number, number]
  destCoord?: [number, number]
  routeCoords?: [number, number][] // [lng, lat] from OSRM
}

function MapController({
  target,
  fitBounds,
}: {
  target?: [number, number]
  fitBounds?: [number, number][]
}) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo(target, 11, { duration: 0.6 })
    } else if (fitBounds && fitBounds.length > 0) {
      map.fitBounds(L.latLngBounds(fitBounds), { padding: [40, 40] })
    }
  }, [target, fitBounds, map])
  return null
}

function truckIcon(color: string, label: string, active: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position: relative; transform: translate(-50%, -100%);">
        <div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: ${color}; color: white;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          ${active ? "outline: 4px solid rgba(10,10,10,0.25);" : ""}
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
        </div>
        ${
          label
            ? `<div style="
          position: absolute; top: 100%; left: 50%;
          transform: translate(-50%, 4px);
          background: white; color: #111;
          font-family: ui-monospace, monospace; font-size: 10px;
          padding: 2px 6px; border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.1);
          white-space: nowrap;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        ">${label}</div>`
            : ""
        }
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [0, 0],
  })
}

function hubIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position: relative; transform: translate(-50%, -50%);">
        <div style="width: 16px; height: 16px; border-radius: 50%;
          background: #0a0a0a; border: 3px solid white;
          box-shadow: 0 0 0 4px rgba(10,10,10,0.2), 0 4px 8px rgba(0,0,0,0.3);
        "></div>
        <div style="position: absolute; top: 100%; left: 50%;
          transform: translate(-50%, 6px);
          background: #0a0a0a; color: white;
          font-size: 10px; font-weight: 600;
          padding: 2px 8px; border-radius: 4px;
          letter-spacing: 0.5px; text-transform: uppercase;
          white-space: nowrap;
        ">North Hub</div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [0, 0],
  })
}

export default function LiveMap() {
  const vehicles = useStore((s) => s.vehicles)
  const drivers = useStore((s) => s.drivers)
  const loads = useStore((s) => s.loads)
  const { resolvedTheme } = useTheme()
  const [active, setActive] = useState<string | null>(null)
  const [view, setView] = useState<"map" | "globe">("map")
  const [tileStyle, setTileStyle] = useState<"streets" | "light" | "dark">("light")
  const [showLabels, setShowLabels] = useState(true)
  const [showArcs, setShowArcs] = useState(true)
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({})
  const mapRef = useRef<L.Map | null>(null)

  const driverName = (id?: string) => drivers.find((d) => d.id === id)?.name ?? "—"
  const driverLoad = (driverId?: string) =>
    loads.find((l) => l.driverId === driverId)

  const tracked = useMemo<TrackedUnit[]>(() => {
    let idleIdx = 0
    let dockIdx = 0
    return vehicles.map((v) => {
      const load = driverLoad(v.driverId)
      const status = load
        ? loadStatusToMapStatus(load.status)
        : v.status === "on-route"
          ? "in-transit"
          : "idle"

      const originCoord = load ? cityCoords[load.origin] : undefined
      const destCoord = load ? cityCoords[load.destination] : undefined
      const routeCoords =
        originCoord && destCoord ? routes[routeKey(originCoord, destCoord)] : undefined

      let pos: [number, number] = HUB
      if (load && originCoord && destCoord) {
        if (status === "in-transit") {
          if (routeCoords && routeCoords.length > 1) {
            const c = sampleAlong(routeCoords, 0.55)
            pos = [c[1], c[0]] // lng,lat → lat,lng
          } else {
            pos = midpoint(originCoord, destCoord, 0.55)
          }
        } else if (status === "delivered") {
          pos = destCoord
        } else if (load.status === "delayed") {
          if (routeCoords && routeCoords.length > 1) {
            const c = sampleAlong(routeCoords, 0.4)
            pos = [c[1], c[0]]
          } else {
            pos = midpoint(originCoord, destCoord, 0.4)
          }
        } else if (status === "loading" || status === "unloading") {
          // Spread across real Chicago industrial yard slots (on land!)
          pos = HUB_YARD_SLOTS[dockIdx % HUB_YARD_SLOTS.length]
          dockIdx++
        } else {
          pos = originCoord
        }
      } else if (v.status === "maintenance") {
        // Service depot at hub yard (also on land)
        pos = HUB_YARD_SLOTS[dockIdx % HUB_YARD_SLOTS.length]
        dockIdx++
      } else {
        // Idle / no load → regional parking lots
        pos = PARKING_LOTS[idleIdx % PARKING_LOTS.length]
        idleIdx++
      }

      return {
        id: v.id,
        driver: driverName(v.driverId),
        load: load?.id ?? "—",
        loadStatus: load?.status,
        origin: load?.origin,
        destination: load?.destination,
        status,
        eta:
          load?.status === "in-transit"
            ? "1h 12m"
            : load?.status === "loading"
              ? "Now"
              : load?.status === "delayed"
                ? "Delayed"
                : "—",
        position: pos,
        originCoord,
        destCoord,
        routeCoords,
      }
    })
  }, [vehicles, loads, drivers, routes]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch real road routes from OSRM for active loads
  useEffect(() => {
    let cancelled = false
    const pairs = new Set<string>()
    const toFetch: { key: string; o: [number, number]; d: [number, number] }[] = []
    for (const t of tracked) {
      if (!t.originCoord || !t.destCoord) continue
      if (t.loadStatus === "delivered") continue
      const key = routeKey(t.originCoord, t.destCoord)
      if (pairs.has(key) || routes[key]) continue
      pairs.add(key)
      toFetch.push({ key, o: t.originCoord, d: t.destCoord })
    }
    for (const { key, o, d } of toFetch) {
      const url = `https://router.project-osrm.org/route/v1/driving/${o[1]},${o[0]};${d[1]},${d[0]}?overview=full&geometries=geojson`
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return
          const coords = data?.routes?.[0]?.geometry?.coordinates as
            | [number, number][]
            | undefined
          if (coords && coords.length > 1) {
            setRoutes((prev) => ({ ...prev, [key]: coords }))
          }
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [tracked, routes])

  const activeUnit = tracked.find((t) => t.id === active) ?? null
  const bounds = useMemo(() => [HUB, ...tracked.map((t) => t.position)], [tracked])

  const tileUrl = {
    streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  }[tileStyle]

  const tileAttribution = {
    streets: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    light:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    dark:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }[tileStyle]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Map"
        description="Fleet positions, geofences, ETAs."
        actions={
          <>
            <Tabs value={view} onValueChange={(v) => setView(v as "map" | "globe")}>
              <TabsList>
                <TabsTrigger value="map">
                  <MapIcon className="mr-1.5 size-4" /> Map
                </TabsTrigger>
                <TabsTrigger value="globe">
                  <Globe2 className="mr-1.5 size-4" /> Globe
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Layers className="mr-1.5 size-4" /> Layers
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {view === "map" && (
                  <>
                    <DropdownMenuLabel>Base map</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={tileStyle === "light"}
                      onCheckedChange={() => setTileStyle("light")}
                    >
                      Light
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={tileStyle === "dark"}
                      onCheckedChange={() => setTileStyle("dark")}
                    >
                      Dark
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={tileStyle === "streets"}
                      onCheckedChange={() => setTileStyle("streets")}
                    >
                      Streets (OSM)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLabel>Overlays</DropdownMenuLabel>
                {view === "map" && (
                  <DropdownMenuCheckboxItem
                    checked={showLabels}
                    onCheckedChange={setShowLabels}
                  >
                    Vehicle labels
                  </DropdownMenuCheckboxItem>
                )}
                <DropdownMenuCheckboxItem
                  checked={showArcs}
                  onCheckedChange={setShowArcs}
                >
                  Route arcs
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              onClick={() => {
                if (view === "map" && mapRef.current) {
                  mapRef.current.flyTo(HUB, 11, { duration: 0.6 })
                }
                setActive(null)
                toast.success("Centered on North Hub")
              }}
            >
              <Locate className="mr-1.5 size-4" /> Center on hub
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
            {view === "map" ? (
              <MapContainer
                center={HUB}
                zoom={6}
                scrollWheelZoom
                zoomControl={false}
                className="h-full w-full"
                ref={(m) => {
                  mapRef.current = m as L.Map | null
                }}
              >
                <TileLayer attribution={tileAttribution} url={tileUrl} />
                <ZoomControl position="bottomright" />
                <MapController
                  target={activeUnit?.position}
                  fitBounds={!activeUnit ? bounds : undefined}
                />

                {showArcs &&
                  tracked
                    .filter((t) => t.routeCoords && t.loadStatus !== "delivered")
                    .map((t) => (
                      <Polyline
                        key={`route-${t.id}`}
                        positions={t.routeCoords!.map(
                          (c) => [c[1], c[0]] as [number, number],
                        )}
                        pathOptions={{
                          color: statusColor[t.status] ?? "#3b82f6",
                          weight: active === t.id ? 4 : 2.5,
                          opacity: active === t.id ? 0.9 : 0.65,
                          dashArray: active === t.id ? undefined : "6 6",
                        }}
                      />
                    ))}

                <Marker position={HUB} icon={hubIcon()}>
                  <Popup>
                    <div className="text-xs">
                      <div className="font-semibold">North Hub</div>
                      <div className="text-muted-foreground">Chicago, IL · BR-01</div>
                    </div>
                  </Popup>
                </Marker>

                {tracked.map((t) => (
                  <Marker
                    key={t.id}
                    position={t.position}
                    icon={truckIcon(
                      statusColor[t.status] ?? "#3b82f6",
                      showLabels ? t.id : "",
                      active === t.id,
                    )}
                    eventHandlers={{
                      click: () => setActive(t.id),
                    }}
                  >
                    <Popup>
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold">{t.id}</div>
                        <div>{t.driver}</div>
                        {t.load !== "—" && (
                          <div className="font-mono text-muted-foreground">{t.load}</div>
                        )}
                        {t.origin && t.destination && (
                          <div className="text-muted-foreground">
                            {t.origin} → {t.destination}
                          </div>
                        )}
                        <div className="capitalize">{t.status}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <Suspense fallback={<GlobeFallback />}>
                <GlobeView
                  hub={HUB}
                  tracked={tracked}
                  active={active}
                  showArcs={showArcs}
                  onSelect={setActive}
                  isDark={resolvedTheme === "dark"}
                />
              </Suspense>
            )}

            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap gap-2">
              {(["loading", "in-transit", "idle", "delivered"] as const).map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-1.5 rounded-full bg-background/95 px-2.5 py-1 text-xs shadow-sm backdrop-blur"
                >
                  <span className={`size-2 rounded-full ${dotTone[s]}`} />
                  <span className="capitalize">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{activeUnit ? activeUnit.id : "Active fleet"}</CardTitle>
            <CardDescription>
              {activeUnit ? activeUnit.driver : `${tracked.length} units tracked`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[420px]">
              <div className="divide-y px-6">
                {tracked.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActive(f.id)}
                    className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 py-3 text-left first:pt-0 last:pb-0 transition-colors hover:bg-muted/40 ${
                      active === f.id ? "bg-muted/60" : ""
                    }`}
                  >
                    <div
                      className={`flex size-8 items-center justify-center rounded-full ${dotTone[f.status]} text-white`}
                    >
                      <Truck className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{f.id}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {f.driver} · {f.load}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <Badge
                        variant="secondary"
                        className={`capitalize ${tone[f.status]}`}
                      >
                        {f.status}
                      </Badge>
                      {f.eta !== "—" && (
                        <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="size-3" /> ETA {f.eta}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function GlobeFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto size-64 rounded-full" />
        <p className="text-xs text-muted-foreground">Loading globe…</p>
      </div>
    </div>
  )
}
