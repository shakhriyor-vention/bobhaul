import { Fragment, useMemo } from "react"

type Point = { label: string; value: number }

export function Sparkline({
  data,
  className,
  stroke = "currentColor",
  fill = "currentColor",
  height = 60,
  showArea = true,
}: {
  data: number[]
  className?: string
  stroke?: string
  fill?: string
  height?: number
  showArea?: boolean
}) {
  const { path, area, min, max } = useMemo(() => {
    if (!data.length) return { path: "", area: "", min: 0, max: 0 }
    const w = 100
    const h = 100
    const lo = Math.min(...data)
    const hi = Math.max(...data)
    const range = hi - lo || 1
    const step = w / Math.max(data.length - 1, 1)
    const pts = data.map((v, i) => {
      const x = i * step
      const y = h - ((v - lo) / range) * h
      return [x, y] as const
    })
    const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
    const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${h} L0,${h} Z`
    return { path, area, min: lo, max: hi }
  }, [data])

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      style={{ height, width: "100%" }}
      aria-label={`Sparkline · range ${min}–${max}`}
    >
      {showArea && (
        <path d={area} fill={fill} fillOpacity={0.12} />
      )}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function BarChart({
  data,
  className,
  height = 140,
  barClass = "fill-primary/70 hover:fill-primary",
}: {
  data: Point[]
  className?: string
  height?: number
  barClass?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className={className}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-full w-full items-end">
              <div
                className={`w-full rounded-t-md transition-all ${barClass}`}
                style={{ height: `${(d.value / max) * 100}%` }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <div className="text-[10px] text-muted-foreground">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AreaChart({
  data,
  className,
  height = 180,
  stroke = "rgb(124 58 237)",
  fill = "rgb(124 58 237)",
  yLabel,
}: {
  data: Point[]
  className?: string
  height?: number
  stroke?: string
  fill?: string
  yLabel?: string
}) {
  const { path, area, lo, hi } = useMemo(() => {
    const w = 100
    const h = 100
    const values = data.map((d) => d.value)
    const lo = Math.min(...values, 0)
    const hi = Math.max(...values, 1)
    const range = hi - lo || 1
    const step = w / Math.max(data.length - 1, 1)
    const pts = data.map((d, i) => {
      const x = i * step
      const y = h - ((d.value - lo) / range) * h
      return [x, y] as const
    })
    const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ")
    const area = `${path} L${pts[pts.length - 1][0].toFixed(2)},${h} L0,${h} Z`
    return { path, area, lo, hi }
  }, [data])

  return (
    <div className={className}>
      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={fill} stopOpacity={0.35} />
              <stop offset="100%" stopColor={fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <line x1={0} x2={100} y1={50} y2={50} stroke="currentColor" strokeOpacity={0.06} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={100} y1={25} y2={25} stroke="currentColor" strokeOpacity={0.04} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={100} y1={75} y2={75} stroke="currentColor" strokeOpacity={0.04} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="url(#areaFill)" />
          <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="pointer-events-none absolute right-1 top-1 text-[10px] text-muted-foreground">{yLabel}</div>
        <div className="pointer-events-none absolute right-1 top-1 text-[10px] tabular-nums text-muted-foreground">
          {hi}
        </div>
        <div className="pointer-events-none absolute bottom-1 right-1 text-[10px] tabular-nums text-muted-foreground">
          {lo}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d, i) =>
          i % Math.ceil(data.length / 6) === 0 || i === data.length - 1 ? (
            <span key={d.label}>{d.label}</span>
          ) : (
            <span key={d.label} className="opacity-0">.</span>
          ),
        )}
      </div>
    </div>
  )
}

export function Donut({
  value,
  size = 120,
  thickness = 12,
  label,
  sublabel,
  trackClass = "stroke-muted",
  ringClass = "stroke-primary",
}: {
  value: number
  size?: number
  thickness?: number
  label?: string
  sublabel?: string
  trackClass?: string
  ringClass?: string
}) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={ringClass + " transition-[stroke-dashoffset] duration-700"}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className="text-2xl font-semibold tabular-nums">{label ?? `${Math.round(value)}%`}</div>
        {sublabel && <div className="text-[10px] text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  )
}

export function Heatmap({
  data,
  rowLabels,
  colLabels,
  className,
}: {
  data: number[][]
  rowLabels: string[]
  colLabels: string[]
  className?: string
}) {
  const flat = data.flat()
  const max = Math.max(...flat, 1)
  return (
    <div className={className}>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `auto repeat(${colLabels.length}, minmax(0, 1fr))` }}
      >
        <div />
        {colLabels.map((c) => (
          <div key={c} className="text-center text-[10px] text-muted-foreground">{c}</div>
        ))}
        {rowLabels.map((row, ri) => (
          <Fragment key={row}>
            <div className="pr-2 text-right text-[10px] text-muted-foreground">{row}</div>
            {data[ri].map((v, ci) => {
              const intensity = v / max
              return (
                <div
                  key={`${row}-${colLabels[ci]}`}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--primary) ${Math.round(
                      8 + intensity * 92,
                    )}%, transparent)`,
                  }}
                  title={`${row} · ${colLabels[ci]} · ${v}`}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
