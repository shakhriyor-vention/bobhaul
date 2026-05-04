import { useEffect, useMemo, useRef } from "react"
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { TrackedUnit } from "@/pages/LiveMap"

const statusColorHex: Record<string, string> = {
  approaching: "#f59e0b",
  loading: "#f59e0b",
  unloading: "#3b82f6",
  "in-transit": "#8b5cf6",
  idle: "#3b82f6",
  delivered: "#10b981",
}

type Props = {
  hub: [number, number]
  tracked: TrackedUnit[]
  active: string | null
  showArcs: boolean
  onSelect: (id: string) => void
  isDark: boolean
}

const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty"
const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark"

// Great-circle interpolation for smooth route arcs on globe
function greatCircle(
  start: [number, number],
  end: [number, number],
  steps = 64,
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const lat1 = toRad(start[1])
  const lng1 = toRad(start[0])
  const lat2 = toRad(end[1])
  const lng2 = toRad(end[0])
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
      ),
    )
  if (d === 0) return [start, end]
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
    const lng = Math.atan2(y, x)
    pts.push([toDeg(lng), toDeg(lat)])
  }
  return pts
}

function buildHubMarker(): HTMLDivElement {
  const wrap = document.createElement("div")
  wrap.style.cssText = `
    position: relative;
    width: 16px;
    height: 16px;
    pointer-events: none;
  `
  const pulse = document.createElement("div")
  pulse.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid rgba(10,10,10,0.5);
    animation: bobhaul-globe-pulse 1.6s ease-out infinite;
    pointer-events: none;
  `
  wrap.appendChild(pulse)

  const dot = document.createElement("div")
  dot.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #0a0a0a;
    border: 3px solid #ffffff;
    box-shadow: 0 0 0 4px rgba(10,10,10,0.25), 0 4px 10px rgba(0,0,0,0.3);
    box-sizing: border-box;
  `
  wrap.appendChild(dot)

  const label = document.createElement("div")
  label.textContent = "NORTH HUB"
  label.style.cssText = `
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    background: #0a0a0a;
    color: white;
    font: 600 9px ui-sans-serif, system-ui;
    letter-spacing: 0.6px;
    padding: 3px 8px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
  `
  wrap.appendChild(label)
  return wrap
}

function buildVehicleMarker(
  id: string,
  color: string,
  active: boolean,
  onClick: () => void,
): HTMLDivElement {
  const wrap = document.createElement("div")
  const sz = active ? 34 : 30
  wrap.style.cssText = `
    position: relative;
    width: ${sz}px;
    height: ${sz}px;
    cursor: pointer;
    transition: width 0.2s, height 0.2s;
  `

  const pin = document.createElement("div")
  pin.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: ${color};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    box-sizing: border-box;
    ${active ? "outline: 4px solid rgba(10,10,10,0.25);" : ""}
  `
  pin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`
  wrap.appendChild(pin)

  const label = document.createElement("div")
  label.textContent = id
  label.style.cssText = `
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 4px;
    background: white;
    color: #111;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(0,0,0,0.1);
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    pointer-events: none;
  `
  wrap.appendChild(label)

  wrap.addEventListener("click", (e) => {
    e.stopPropagation()
    onClick()
  })
  return wrap
}

export default function GlobeView({
  hub,
  tracked,
  active,
  showArcs,
  onSelect,
  isDark,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const spinRef = useRef<{ rafId: number | null; spinning: boolean }>({
    rafId: null,
    spinning: true,
  })

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    // CSS keyframes (one-time injection)
    if (!document.getElementById("bobhaul-globe-keyframes")) {
      const style = document.createElement("style")
      style.id = "bobhaul-globe-keyframes"
      style.textContent = `
        @keyframes bobhaul-globe-pulse {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: isDark ? STYLE_DARK : STYLE_LIGHT,
      center: [hub[1], hub[0]],
      zoom: 1.6,
      attributionControl: false,
      pitch: 0,
      dragRotate: true,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left")
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false, showZoom: true }),
      "bottom-right",
    )

    map.on("style.load", () => {
      // Globe projection
      map.setProjection({ type: "globe" })
      // Atmosphere via sky/fog
      try {
        map.setSky({
          "sky-color": isDark ? "#020817" : "#dbeafe",
          "horizon-color": isDark ? "#0b1f3a" : "#74c0ff",
          "fog-color": isDark ? "#020817" : "#dbeafe",
          "fog-ground-blend": 0.5,
          "horizon-fog-blend": 0.5,
          "sky-horizon-blend": 0.6,
          "atmosphere-blend": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            5,
            1,
            7,
            0,
          ],
        })
      } catch {
        // Sky not supported in older versions
      }

      // Routes source + layer
      map.addSource("routes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: "routes",
        type: "line",
        source: "routes",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["get", "active"], 3, 1.8],
          "line-opacity": 0.85,
          "line-dasharray": [3, 2],
        },
      })
    })

    mapRef.current = map

    // Auto-rotate
    const SPIN_DEG_PER_SEC = 4
    let lastT = performance.now()
    const tick = (t: number) => {
      const dt = (t - lastT) / 1000
      lastT = t
      if (spinRef.current.spinning && map && !map.isMoving()) {
        const c = map.getCenter()
        c.lng -= SPIN_DEG_PER_SEC * dt
        map.jumpTo({ center: [c.lng, c.lat] })
      }
      spinRef.current.rafId = requestAnimationFrame(tick)
    }
    spinRef.current.rafId = requestAnimationFrame(tick)

    map.on("dragstart", () => {
      spinRef.current.spinning = false
    })
    map.on("zoomstart", () => {
      spinRef.current.spinning = false
    })

    return () => {
      if (spinRef.current.rafId) cancelAnimationFrame(spinRef.current.rafId)
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Theme switch — swap style
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setStyle(isDark ? STYLE_DARK : STYLE_LIGHT, { diff: false })
    map.once("style.load", () => {
      try {
        map.setProjection({ type: "globe" })
        map.setSky({
          "sky-color": isDark ? "#020817" : "#dbeafe",
          "horizon-color": isDark ? "#0b1f3a" : "#74c0ff",
          "fog-color": isDark ? "#020817" : "#dbeafe",
          "fog-ground-blend": 0.5,
          "horizon-fog-blend": 0.5,
          "sky-horizon-blend": 0.6,
        })
      } catch {
        // ignore
      }
      if (!map.getSource("routes")) {
        map.addSource("routes", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        })
        map.addLayer({
          id: "routes",
          type: "line",
          source: "routes",
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["case", ["get", "active"], 3, 1.8],
            "line-opacity": 0.85,
            "line-dasharray": [3, 2],
          },
        })
      }
    })
  }, [isDark])

  // Markers — re-render when tracked / active changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const hubMarker = new maplibregl.Marker({
      element: buildHubMarker(),
      anchor: "center",
    })
      .setLngLat([hub[1], hub[0]])
      .addTo(map)
    markersRef.current.push(hubMarker)

    for (const t of tracked) {
      const el = buildVehicleMarker(
        t.id,
        statusColorHex[t.status] ?? "#3b82f6",
        active === t.id,
        () => onSelect(t.id),
      )
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([t.position[1], t.position[0]])
        .addTo(map)
      markersRef.current.push(marker)
    }
  }, [tracked, active, hub, onSelect])

  // Routes — real road polylines from OSRM, fallback to great-circle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      const src = map.getSource("routes") as maplibregl.GeoJSONSource | undefined
      if (!src) return
      const features = showArcs
        ? tracked
            .filter((t) => t.originCoord && t.destCoord && t.loadStatus !== "delivered")
            .map((t) => {
              const origin = t.originCoord!
              const dest = t.destCoord!
              // Prefer real road geometry if available
              const path =
                t.routeCoords && t.routeCoords.length > 1
                  ? t.routeCoords
                  : greatCircle([origin[1], origin[0]], [dest[1], dest[0]], 96)
              return {
                type: "Feature" as const,
                geometry: { type: "LineString" as const, coordinates: path },
                properties: {
                  color: statusColorHex[t.status] ?? "#8b5cf6",
                  active: active === t.id,
                  id: t.id,
                },
              }
            })
        : []
      src.setData({ type: "FeatureCollection", features })
    }
    if (map.isStyleLoaded()) apply()
    else map.once("style.load", apply)
  }, [tracked, showArcs, active])

  // Fly to active
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (active) {
      const unit = tracked.find((t) => t.id === active)
      if (unit) {
        spinRef.current.spinning = false
        map.flyTo({
          center: [unit.position[1], unit.position[0]],
          zoom: 5,
          duration: 1500,
          essential: true,
        })
      }
    } else {
      spinRef.current.spinning = true
      map.flyTo({
        center: [hub[1], hub[0]],
        zoom: 1.8,
        duration: 1500,
        essential: true,
      })
    }
  }, [active, hub, tracked])

  const bgColor = useMemo(() => (isDark ? "#020817" : "#dbeafe"), [isDark])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: bgColor }}
    />
  )
}
