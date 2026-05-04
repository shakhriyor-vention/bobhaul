import { iconByName } from "@/lib/amenity-icons"
import { colorTone, type ColorTone } from "@/lib/amenity-colors"
import type { AmenityCategoryDef } from "@/store"
import type { LucideIcon } from "lucide-react"

export type ResolvedCategory = AmenityCategoryDef &
  ColorTone & {
    Icon: LucideIcon
  }

export const resolveCategory = (cat: AmenityCategoryDef): ResolvedCategory => ({
  ...cat,
  ...colorTone(cat.color),
  Icon: iconByName(cat.icon),
})

export const sortByOrder = (a: AmenityCategoryDef, b: AmenityCategoryDef) =>
  a.order - b.order
