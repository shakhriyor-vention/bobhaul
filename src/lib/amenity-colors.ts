export type AmenityColor =
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "emerald"
  | "lime"
  | "amber"
  | "orange"
  | "rose"
  | "fuchsia"
  | "slate"

export type ColorTone = {
  swatch: string
  badgeClass: string
  iconClass: string
  ringClass: string
  dotClass: string
}

const palette: Record<AmenityColor, ColorTone> = {
  violet: {
    swatch: "bg-violet-500",
    badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    iconClass: "text-violet-600 dark:text-violet-300",
    ringClass: "border-violet-500/30 bg-violet-500/5",
    dotClass: "bg-violet-500",
  },
  indigo: {
    swatch: "bg-indigo-500",
    badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    iconClass: "text-indigo-600 dark:text-indigo-300",
    ringClass: "border-indigo-500/30 bg-indigo-500/5",
    dotClass: "bg-indigo-500",
  },
  blue: {
    swatch: "bg-blue-500",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    iconClass: "text-blue-600 dark:text-blue-300",
    ringClass: "border-blue-500/30 bg-blue-500/5",
    dotClass: "bg-blue-500",
  },
  cyan: {
    swatch: "bg-cyan-500",
    badgeClass: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    iconClass: "text-cyan-600 dark:text-cyan-300",
    ringClass: "border-cyan-500/30 bg-cyan-500/5",
    dotClass: "bg-cyan-500",
  },
  teal: {
    swatch: "bg-teal-500",
    badgeClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    iconClass: "text-teal-600 dark:text-teal-300",
    ringClass: "border-teal-500/30 bg-teal-500/5",
    dotClass: "bg-teal-500",
  },
  emerald: {
    swatch: "bg-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    iconClass: "text-emerald-600 dark:text-emerald-300",
    ringClass: "border-emerald-500/30 bg-emerald-500/5",
    dotClass: "bg-emerald-500",
  },
  lime: {
    swatch: "bg-lime-500",
    badgeClass: "bg-lime-500/15 text-lime-700 dark:text-lime-300",
    iconClass: "text-lime-600 dark:text-lime-300",
    ringClass: "border-lime-500/30 bg-lime-500/5",
    dotClass: "bg-lime-500",
  },
  amber: {
    swatch: "bg-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    iconClass: "text-amber-600 dark:text-amber-300",
    ringClass: "border-amber-500/30 bg-amber-500/5",
    dotClass: "bg-amber-500",
  },
  orange: {
    swatch: "bg-orange-500",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    iconClass: "text-orange-600 dark:text-orange-300",
    ringClass: "border-orange-500/30 bg-orange-500/5",
    dotClass: "bg-orange-500",
  },
  rose: {
    swatch: "bg-rose-500",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    iconClass: "text-rose-600 dark:text-rose-300",
    ringClass: "border-rose-500/30 bg-rose-500/5",
    dotClass: "bg-rose-500",
  },
  fuchsia: {
    swatch: "bg-fuchsia-500",
    badgeClass: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
    iconClass: "text-fuchsia-600 dark:text-fuchsia-300",
    ringClass: "border-fuchsia-500/30 bg-fuchsia-500/5",
    dotClass: "bg-fuchsia-500",
  },
  slate: {
    swatch: "bg-slate-500",
    badgeClass: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    iconClass: "text-slate-600 dark:text-slate-300",
    ringClass: "border-slate-500/30 bg-slate-500/5",
    dotClass: "bg-slate-500",
  },
}

export const AMENITY_COLORS: AmenityColor[] = Object.keys(palette) as AmenityColor[]

export const colorTone = (c: AmenityColor): ColorTone => palette[c] ?? palette.slate
