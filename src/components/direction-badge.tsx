import * as React from "react"
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type Direction = "inbound" | "outbound" | "cross-dock"

type DirectionMeta = {
  Icon: typeof ArrowDownToLine
  label: string
  compactLabel: string
  ariaLabel: string
  iconColor: string
}

const DIRECTION_META: Record<Direction, DirectionMeta> = {
  inbound: {
    Icon: ArrowDownToLine,
    label: "Inbound",
    compactLabel: "Inb",
    ariaLabel: "Inbound appointment",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  outbound: {
    Icon: ArrowUpFromLine,
    label: "Outbound",
    compactLabel: "Out",
    ariaLabel: "Outbound appointment",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  "cross-dock": {
    Icon: ArrowLeftRight,
    label: "Cross-Dock",
    compactLabel: "X-Dk",
    ariaLabel: "Cross-Dock appointment",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
}

export const DIRECTION_LABEL: Record<Direction, string> = {
  inbound: DIRECTION_META.inbound.label,
  outbound: DIRECTION_META.outbound.label,
  "cross-dock": DIRECTION_META["cross-dock"].label,
}

type Size = "sm" | "md" | "lg"
type Variant = "full" | "compact" | "icon-only"
type Emphasis = "default" | "subtle"

const SIZE_HEIGHT: Record<Size, string> = {
  sm: "h-5",
  md: "h-6",
  lg: "h-7",
}

const COLLAPSE_FULL_MIN = 96
const COLLAPSE_COMPACT_MIN = 64

function variantForWidth(width: number | undefined): Variant {
  if (width == null) return "full"
  if (width >= COLLAPSE_FULL_MIN) return "full"
  if (width >= COLLAPSE_COMPACT_MIN) return "compact"
  return "icon-only"
}

export interface DirectionBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  direction: Direction
  size?: Size
  variant?: Variant
  emphasis?: Emphasis
  responsive?: boolean
  containerWidth?: number
}

export function DirectionBadge({
  direction,
  size = "md",
  variant: variantProp,
  emphasis = "default",
  responsive = false,
  containerWidth,
  className,
  ...rest
}: DirectionBadgeProps) {
  const meta = DIRECTION_META[direction]
  const wrapperRef = React.useRef<HTMLSpanElement>(null)
  const [observedWidth, setObservedWidth] = React.useState<number | undefined>(
    containerWidth,
  )

  React.useEffect(() => {
    if (!responsive) return
    if (containerWidth != null) {
      setObservedWidth(containerWidth)
      return
    }
    const node = wrapperRef.current?.parentElement
    if (!node) return
    const update = () => setObservedWidth(node.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
    return () => ro.disconnect()
  }, [responsive, containerWidth])

  const resolvedVariant: Variant = variantProp
    ? variantProp
    : responsive
      ? variantForWidth(observedWidth)
      : "full"

  const Icon = meta.Icon
  const isIconOnly = resolvedVariant === "icon-only"
  const isCompact = resolvedVariant === "compact"
  const labelText = isCompact ? meta.compactLabel : meta.label

  const badgeBase =
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-border bg-transparent px-2 py-0.5 text-xs font-medium text-foreground whitespace-nowrap select-none capitalize"

  const subtleOverride =
    emphasis === "subtle" ? "border-transparent" : ""

  const content = (
    <span
      ref={wrapperRef}
      data-slot="direction-badge"
      data-direction={direction}
      data-variant={resolvedVariant}
      role={isIconOnly ? "img" : undefined}
      aria-label={isIconOnly ? meta.ariaLabel : undefined}
      className={cn(
        badgeBase,
        subtleOverride,
        SIZE_HEIGHT[size],
        isIconOnly && "px-0 aspect-square",
        className,
      )}
      {...rest}
    >
      <Icon
        className={cn("size-3 shrink-0", meta.iconColor)}
        aria-hidden={isIconOnly ? undefined : true}
        focusable="false"
      />
      {!isIconOnly && (
        <span className="leading-none min-w-0 truncate">{labelText}</span>
      )}
    </span>
  )

  if (resolvedVariant === "full") return content

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top">{meta.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

DirectionBadge.displayName = "DirectionBadge"
